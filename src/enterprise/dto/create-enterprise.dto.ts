import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateEnterpriseDto {
  @IsNotEmpty({ message: 'O nome legal é obrigatório' })
  @IsString({ message: 'O nome legal deve ser uma string' })
  @Length(1, 255, { message: 'O nome legal deve ter entre 1 e 255 caracteres' })
  legalName: string;

  @IsNotEmpty({ message: 'O nome fantasia é obrigatório' })
  @IsString({ message: 'O nome fantasia deve ser uma string' })
  @Length(1, 255, {
    message: 'O nome fantasia deve ter entre 1 e 255 caracteres',
  })
  tradeName: string;

  @IsOptional()
  @IsString({ message: 'O logo deve ser uma string' })
  logo?: string;

  @IsDateString({}, { message: 'A data de fundação deve ser uma data válida' })
  foundationDate: string;

  @IsNotEmpty({ message: 'O CNPJ é obrigatório' })
  @IsString({ message: 'O CNPJ deve ser uma string' })
  @MaxLength(14, { message: 'O CNPJ deve ter no máximo 14 caracteres' })
  cnpj: string;

  @IsNotEmpty({ message: 'O endereço é obrigatório' })
  @IsString({ message: 'O endereço deve ser uma string' })
  address: string;
}
