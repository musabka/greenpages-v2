import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from './i18n.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('I18nService', () => {
  let service: I18nService;
  let prisma: PrismaService;

  const mockPrismaService = {
    translation: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        I18nService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<I18nService>(I18nService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('translate', () => {
    it('should return translation for requested locale', async () => {
      const mockTranslation = {
        id: '1',
        namespace: 'common',
        key: 'welcome',
        locale: 'ar',
        value: 'مرحباً',
        updatedAt: new Date(),
      };

      mockPrismaService.translation.findUnique.mockResolvedValue(mockTranslation);

      const result = await service.translate('welcome', 'ar', undefined, 'common');

      expect(result).toBe('مرحباً');
      expect(mockPrismaService.translation.findUnique).toHaveBeenCalledWith({
        where: {
          namespace_key_locale: {
            namespace: 'common',
            key: 'welcome',
            locale: 'ar',
          },
        },
      });
    });

    it('should fallback to Arabic when translation not found for requested locale', async () => {
      const mockArabicTranslation = {
        id: '1',
        namespace: 'common',
        key: 'welcome',
        locale: 'ar',
        value: 'مرحباً',
        updatedAt: new Date(),
      };

      // First call returns null (English not found), second call returns Arabic
      mockPrismaService.translation.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockArabicTranslation);

      const result = await service.translate('welcome', 'en', undefined, 'common');

      expect(result).toBe('مرحباً');
      expect(mockPrismaService.translation.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.translation.findUnique).toHaveBeenNthCalledWith(1, {
        where: {
          namespace_key_locale: {
            namespace: 'common',
            key: 'welcome',
            locale: 'en',
          },
        },
      });
      expect(mockPrismaService.translation.findUnique).toHaveBeenNthCalledWith(2, {
        where: {
          namespace_key_locale: {
            namespace: 'common',
            key: 'welcome',
            locale: 'ar',
          },
        },
      });
    });

    it('should return key when translation not found in any locale', async () => {
      mockPrismaService.translation.findUnique.mockResolvedValue(null);

      const result = await service.translate('missing_key', 'en', undefined, 'common');

      expect(result).toBe('missing_key');
    });

    it('should interpolate parameters in translation', async () => {
      const mockTranslation = {
        id: '1',
        namespace: 'common',
        key: 'greeting',
        locale: 'ar',
        value: 'مرحباً {{ name }}',
        updatedAt: new Date(),
      };

      mockPrismaService.translation.findUnique.mockResolvedValue(mockTranslation);

      const result = await service.translate('greeting', 'ar', { name: 'أحمد' }, 'common');

      expect(result).toBe('مرحباً أحمد');
    });
  });

  describe('getTranslations', () => {
    it('should return all translations for namespace and locale', async () => {
      const mockTranslations = [
        {
          id: '1',
          namespace: 'common',
          key: 'welcome',
          locale: 'ar',
          value: 'مرحباً',
          updatedAt: new Date(),
        },
        {
          id: '2',
          namespace: 'common',
          key: 'goodbye',
          locale: 'ar',
          value: 'وداعاً',
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.translation.findMany.mockResolvedValue(mockTranslations);

      const result = await service.getTranslations('common', 'ar');

      expect(result).toEqual({
        welcome: 'مرحباً',
        goodbye: 'وداعاً',
      });
    });
  });

  describe('getSupportedLocales', () => {
    it('should return list of supported locales', () => {
      const result = service.getSupportedLocales();

      expect(result).toEqual(['ar', 'en']);
    });
  });

  describe('getPrimaryLocale', () => {
    it('should return primary locale', () => {
      const result = service.getPrimaryLocale();

      expect(result).toBe('ar');
    });
  });

  describe('updateUserLocale', () => {
    it('should update user locale', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        locale: 'en',
      };

      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.updateUserLocale('user1', 'en');

      expect(result.locale).toBe('en');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { locale: 'en' },
      });
    });

    it('should throw error for unsupported locale', async () => {
      await expect(service.updateUserLocale('user1', 'fr')).rejects.toThrow(
        'Unsupported locale: fr',
      );
    });
  });

  describe('createTranslation', () => {
    it('should create a new translation', async () => {
      const createDto = {
        namespace: 'common',
        key: 'welcome',
        locale: 'ar',
        value: 'مرحباً',
      };

      const mockTranslation = {
        id: '1',
        ...createDto,
        updatedAt: new Date(),
      };

      mockPrismaService.translation.create.mockResolvedValue(mockTranslation);

      const result = await service.createTranslation(createDto);

      expect(result).toEqual(mockTranslation);
      expect(mockPrismaService.translation.create).toHaveBeenCalledWith({
        data: createDto,
      });
    });
  });

  describe('updateTranslation', () => {
    it('should update existing translation', async () => {
      const existingTranslation = {
        id: '1',
        namespace: 'common',
        key: 'welcome',
        locale: 'ar',
        value: 'مرحباً',
        updatedAt: new Date(),
      };

      const updatedTranslation = {
        ...existingTranslation,
        value: 'أهلاً وسهلاً',
      };

      mockPrismaService.translation.findUnique.mockResolvedValue(existingTranslation);
      mockPrismaService.translation.update.mockResolvedValue(updatedTranslation);

      const result = await service.updateTranslation('common', 'welcome', 'ar', {
        value: 'أهلاً وسهلاً',
      });

      expect(result.value).toBe('أهلاً وسهلاً');
    });

    it('should throw error when translation not found', async () => {
      mockPrismaService.translation.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTranslation('common', 'missing', 'ar', { value: 'test' }),
      ).rejects.toThrow('Translation not found');
    });
  });
});
