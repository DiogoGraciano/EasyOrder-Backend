export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    photo?: string;
    cpf?: string;
    address?: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}
