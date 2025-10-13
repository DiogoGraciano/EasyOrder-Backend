export class AuthResponseDto {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    photo?: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}
