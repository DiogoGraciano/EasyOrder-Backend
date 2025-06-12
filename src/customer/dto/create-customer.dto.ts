import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty({ message: 'O nome do cliente é obrigatório' })
  @IsString({ message: 'O nome do cliente deve ser uma string' })
  @Length(1, 255, {
    message: 'O nome do cliente deve ter entre 1 e 255 caracteres',
  })
  name: string;

  @IsEmail({}, { message: 'O email deve ser um endereço de email válido' })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  email: string;

  @IsNotEmpty({ message: 'O telefone é obrigatório' })
  @IsString({ message: 'O telefone deve ser uma string' })
  @Length(1, 20, { message: 'O telefone deve ter entre 1 e 20 caracteres' })
  phone: string;

  @IsOptional()
  @IsString({ message: 'A foto deve ser uma string' })
  photo?: string;

  @IsNotEmpty({ message: 'O CPF é obrigatório' })
  @IsString({ message: 'O CPF deve ser uma string' })
  @Length(14, 14, { message: 'O CPF deve ter exatamente 14 caracteres' })
  cpf: string;

  @IsNotEmpty({ message: 'O endereço é obrigatório' })
  @IsString({ message: 'O endereço deve ser uma string' })
  address: string;
}
