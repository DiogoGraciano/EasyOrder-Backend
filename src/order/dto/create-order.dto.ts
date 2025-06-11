import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

export class CreateOrderItemDto {
  @IsNotEmpty({ message: 'O ID do produto é obrigatório' })
  @IsUUID('4', { message: 'O ID do produto deve ser um UUID válido' })
  productId: string;

  @IsNotEmpty({ message: 'O nome do produto é obrigatório' })
  @IsString({ message: 'O nome do produto deve ser uma string' })
  @MaxLength(255, {
    message: 'O nome do produto não pode ter mais de 255 caracteres',
  })
  productName: string;

  @IsNumber({}, { message: 'A quantidade deve ser um número' })
  @Min(1, { message: 'A quantidade deve ser pelo menos 1' })
  quantity: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O preço unitário deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'O preço unitário deve ser maior ou igual a zero' })
  unitPrice: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O subtotal deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'O subtotal deve ser maior ou igual a zero' })
  subtotal: number;
}

export class CreateOrderDto {
  @IsNotEmpty({ message: 'O número do pedido é obrigatório' })
  @IsString({ message: 'O número do pedido deve ser uma string' })
  @MaxLength(50, {
    message: 'O número do pedido não pode ter mais de 50 caracteres',
  })
  orderNumber: string;

  @IsDateString(
    {},
    { message: 'A data do pedido deve estar em formato ISO válido' },
  )
  orderDate: string;

  @IsOptional()
  @IsEnum(OrderStatus, {
    message: 'Status deve ser: pending, completed ou cancelled',
  })
  status?: OrderStatus;

  @IsNotEmpty({ message: 'O ID do cliente é obrigatório' })
  @IsUUID('4', { message: 'O ID do cliente deve ser um UUID válido' })
  customerId: string;

  @IsNotEmpty({ message: 'O ID da empresa é obrigatório' })
  @IsUUID('4', { message: 'O ID da empresa deve ser um UUID válido' })
  enterpriseId: string;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'O valor total deve ter no máximo 2 casas decimais' },
  )
  @Min(0, { message: 'O valor total deve ser maior ou igual a zero' })
  totalAmount: number;

  @IsOptional()
  @IsString({ message: 'As observações devem ser uma string' })
  @MaxLength(1000, {
    message: 'As observações não podem ter mais de 1000 caracteres',
  })
  notes?: string;

  @IsArray({ message: 'Os itens devem ser um array' })
  @ArrayMinSize(1, { message: 'O pedido deve ter pelo menos 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
