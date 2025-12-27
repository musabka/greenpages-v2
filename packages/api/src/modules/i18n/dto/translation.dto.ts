import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreateTranslationDto {
  @IsString()
  @IsNotEmpty()
  namespace!: string;

  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsIn(['ar', 'en'])
  locale!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class UpdateTranslationDto {
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class GetTranslationsDto {
  @IsOptional()
  @IsString()
  namespace?: string;

  @IsString()
  @IsIn(['ar', 'en'])
  locale!: string;
}

export class TranslateDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsIn(['ar', 'en'])
  locale!: string;

  @IsOptional()
  @IsString()
  namespace?: string;

  @IsOptional()
  params?: Record<string, any>;
}

export class UpdateUserLocaleDto {
  @IsString()
  @IsIn(['ar', 'en'])
  locale!: string;
}
