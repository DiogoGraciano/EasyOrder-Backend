import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateEnterpriseDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  legalName: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  tradeName: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsDateString()
  foundationDate: string;

  @IsNotEmpty()
  @IsString()
  @Length(14, 18)
  cnpj: string;

  @IsNotEmpty()
  @IsString()
  address: string;
}
