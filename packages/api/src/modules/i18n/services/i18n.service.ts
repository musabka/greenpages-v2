import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateTranslationDto,
  UpdateTranslationDto,
  GetTranslationsDto,
} from '../dto';

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);
  private readonly PRIMARY_LOCALE = 'ar';
  private readonly SUPPORTED_LOCALES = ['ar', 'en'];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Translate a key to the specified locale with fallback to Arabic
   * @param key Translation key
   * @param locale Target locale
   * @param params Optional parameters for interpolation
   * @param namespace Optional namespace (defaults to 'common')
   * @returns Translated string
   */
  async translate(
    key: string,
    locale: string,
    params?: Record<string, any>,
    namespace: string = 'common',
  ): Promise<string> {
    // Validate locale
    if (!this.SUPPORTED_LOCALES.includes(locale)) {
      this.logger.warn(`Unsupported locale: ${locale}, falling back to ${this.PRIMARY_LOCALE}`);
      locale = this.PRIMARY_LOCALE;
    }

    // Try to get translation for requested locale
    let translation = await this.prisma.translation.findUnique({
      where: {
        namespace_key_locale: {
          namespace,
          key,
          locale,
        },
      },
    });

    // Fallback to primary locale (Arabic) if translation not found
    if (!translation && locale !== this.PRIMARY_LOCALE) {
      this.logger.debug(
        `Translation not found for key: ${key}, locale: ${locale}, falling back to ${this.PRIMARY_LOCALE}`,
      );
      translation = await this.prisma.translation.findUnique({
        where: {
          namespace_key_locale: {
            namespace,
            key,
            locale: this.PRIMARY_LOCALE,
          },
        },
      });
    }

    // If still not found, return the key itself
    if (!translation) {
      this.logger.warn(`Translation not found for key: ${key}, namespace: ${namespace}`);
      return key;
    }

    // Interpolate parameters if provided
    let value = translation.value;
    if (params) {
      Object.keys(params).forEach((paramKey) => {
        const regex = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
        value = value.replace(regex, String(params[paramKey]));
      });
    }

    return value;
  }

  /**
   * Get all translations for a namespace and locale
   * @param namespace Namespace to filter by
   * @param locale Target locale
   * @returns Record of key-value pairs
   */
  async getTranslations(
    namespace: string,
    locale: string,
  ): Promise<Record<string, string>> {
    const translations = await this.prisma.translation.findMany({
      where: {
        namespace,
        locale,
      },
    });

    const result: Record<string, string> = {};
    translations.forEach((t) => {
      result[t.key] = t.value;
    });

    return result;
  }

  /**
   * Get all translations for a locale (all namespaces)
   * @param locale Target locale
   * @returns Record of namespace -> key-value pairs
   */
  async getAllTranslations(
    locale: string,
  ): Promise<Record<string, Record<string, string>>> {
    const translations = await this.prisma.translation.findMany({
      where: {
        locale,
      },
    });

    const result: Record<string, Record<string, string>> = {};
    translations.forEach((t) => {
      if (!result[t.namespace]) {
        result[t.namespace] = {};
      }
      result[t.namespace][t.key] = t.value;
    });

    return result;
  }

  /**
   * Create a new translation
   * @param data Translation data
   * @returns Created translation
   */
  async createTranslation(data: CreateTranslationDto) {
    return this.prisma.translation.create({
      data: {
        namespace: data.namespace,
        key: data.key,
        locale: data.locale,
        value: data.value,
      },
    });
  }

  /**
   * Update an existing translation
   * @param namespace Namespace
   * @param key Translation key
   * @param locale Locale
   * @param data Update data
   * @returns Updated translation
   */
  async updateTranslation(
    namespace: string,
    key: string,
    locale: string,
    data: UpdateTranslationDto,
  ) {
    const translation = await this.prisma.translation.findUnique({
      where: {
        namespace_key_locale: {
          namespace,
          key,
          locale,
        },
      },
    });

    if (!translation) {
      throw new NotFoundException(
        `Translation not found: namespace=${namespace}, key=${key}, locale=${locale}`,
      );
    }

    return this.prisma.translation.update({
      where: {
        namespace_key_locale: {
          namespace,
          key,
          locale,
        },
      },
      data: {
        value: data.value,
      },
    });
  }

  /**
   * Delete a translation
   * @param namespace Namespace
   * @param key Translation key
   * @param locale Locale
   */
  async deleteTranslation(namespace: string, key: string, locale: string) {
    const translation = await this.prisma.translation.findUnique({
      where: {
        namespace_key_locale: {
          namespace,
          key,
          locale,
        },
      },
    });

    if (!translation) {
      throw new NotFoundException(
        `Translation not found: namespace=${namespace}, key=${key}, locale=${locale}`,
      );
    }

    return this.prisma.translation.delete({
      where: {
        namespace_key_locale: {
          namespace,
          key,
          locale,
        },
      },
    });
  }

  /**
   * Get list of supported locales
   * @returns Array of supported locale codes
   */
  getSupportedLocales(): string[] {
    return [...this.SUPPORTED_LOCALES];
  }

  /**
   * Get the primary locale
   * @returns Primary locale code
   */
  getPrimaryLocale(): string {
    return this.PRIMARY_LOCALE;
  }

  /**
   * Update user's language preference
   * @param userId User ID
   * @param locale New locale
   * @returns Updated user
   */
  async updateUserLocale(userId: string, locale: string) {
    if (!this.SUPPORTED_LOCALES.includes(locale)) {
      throw new NotFoundException(`Unsupported locale: ${locale}`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { locale },
    });
  }

  /**
   * Get user's language preference
   * @param userId User ID
   * @returns User's locale
   */
  async getUserLocale(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { locale: true },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    return user.locale;
  }

  /**
   * Bulk create or update translations
   * @param translations Array of translation data
   * @returns Number of translations created/updated
   */
  async bulkUpsertTranslations(
    translations: CreateTranslationDto[],
  ): Promise<number> {
    let count = 0;

    for (const translation of translations) {
      await this.prisma.translation.upsert({
        where: {
          namespace_key_locale: {
            namespace: translation.namespace,
            key: translation.key,
            locale: translation.locale,
          },
        },
        create: {
          namespace: translation.namespace,
          key: translation.key,
          locale: translation.locale,
          value: translation.value,
        },
        update: {
          value: translation.value,
        },
      });
      count++;
    }

    return count;
  }

  /**
   * Get all translations for management (paginated)
   * @param namespace Optional namespace filter
   * @param locale Optional locale filter
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated translations
   */
  async listTranslations(
    namespace?: string,
    locale?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    const where: any = {};
    if (namespace) where.namespace = namespace;
    if (locale) where.locale = locale;

    const [translations, total] = await Promise.all([
      this.prisma.translation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ namespace: 'asc' }, { key: 'asc' }, { locale: 'asc' }],
      }),
      this.prisma.translation.count({ where }),
    ]);

    return {
      data: translations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
