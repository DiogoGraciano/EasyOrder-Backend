import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string;

  @IsNotEmpty({ message: 'Email é obrigatório' })
  @IsEmail(
    {},
    {
      message: 'Email inválido. O email deve ter um formato válido (ex: usuario@exemplo.com)',
    },
  )
  email: string;

  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, {
    message: 'Senha muito curta. A senha deve ter pelo menos 6 caracteres',
  })
  password: string;
}
