import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
  @IsString({ message: 'O nome do produto deve ser uma string' })
  @Length(1, 255, {
    message: 'O nome do produto deve ter entre 1 e 255 caracteres',
  })
  name: string;

  @IsNotEmpty({ message: 'A descrição do produto é obrigatória' })
  @IsString({ message: 'A descrição do produto deve ser uma string' })
  description: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'O preço deve ser maior ou igual a zero' })
  price: number;

  @IsNumber({}, { message: 'O estoque deve ser um número' })
  @Min(0, { message: 'O estoque deve ser maior ou igual a zero' })
  stock: number;

  @IsOptional()
  @IsString({ message: 'A foto deve ser uma string' })
  photo?: string;

  @IsNotEmpty({ message: 'O ID da empresa é obrigatório' })
  @IsUUID('4', { message: 'O ID da empresa deve ser um UUID válido' })
  enterpriseId: string;
}
