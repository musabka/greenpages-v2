import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { I18nService } from '../services/i18n.service';
import {
  CreateTranslationDto,
  UpdateTranslationDto,
  GetTranslationsDto,
  TranslateDto,
  UpdateUserLocaleDto,
} from '../dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';

@Controller('i18n')
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Public()
  @Get('translate')
  async translate(@Query() query: TranslateDto) {
    const translation = await this.i18nService.translate(
      query.key,
      query.locale,
      query.params,
      query.namespace || 'common',
    );
    return { key: query.key, locale: query.locale, value: translation };
  }

  @Public()
  @Get('translations')
  async getTranslations(@Query() query: GetTranslationsDto) {
    if (query.namespace) {
      const translations = await this.i18nService.getTranslations(
        query.namespace,
        query.locale,
      );
      return { namespace: query.namespace, locale: query.locale, translations };
    } else {
      const translations = await this.i18nService.getAllTranslations(query.locale);
      return { locale: query.locale, translations };
    }
  }

  @Public()
  @Get('locales')
  getSupportedLocales() {
    return {
      locales: this.i18nService.getSupportedLocales(),
      primary: this.i18nService.getPrimaryLocale(),
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('translations')
  async createTranslation(@Body() data: CreateTranslationDto) {
    return this.i18nService.createTranslation(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Put('translations/:namespace/:key/:locale')
  async updateTranslation(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
    @Param('locale') locale: string,
    @Body() data: UpdateTranslationDto,
  ) {
    return this.i18nService.updateTranslation(namespace, key, locale, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete('translations/:namespace/:key/:locale')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTranslation(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
    @Param('locale') locale: string,
  ) {
    await this.i18nService.deleteTranslation(namespace, key, locale);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('translations/list')
  async listTranslations(
    @Query('namespace') namespace?: string,
    @Query('locale') locale?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.i18nService.listTranslations(namespace, locale, page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('translations/bulk')
  async bulkUpsertTranslations(@Body() translations: CreateTranslationDto[]) {
    const count = await this.i18nService.bulkUpsertTranslations(translations);
    return { count, message: `${count} translations created/updated` };
  }

  @UseGuards(JwtAuthGuard)
  @Put('user/locale')
  async updateUserLocale(
    @CurrentUser() user: any,
    @Body() data: UpdateUserLocaleDto,
  ) {
    const updatedUser = await this.i18nService.updateUserLocale(user.id, data.locale);
    return { locale: updatedUser.locale };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/locale')
  async getUserLocale(@CurrentUser() user: any) {
    const locale = await this.i18nService.getUserLocale(user.id);
    return { locale };
  }
}
