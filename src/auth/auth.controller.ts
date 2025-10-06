import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req): Promise<any> {
    const { password, ...userWithoutPassword } = req.user;
    return userWithoutPassword;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    // Em uma implementação mais robusta, você poderia adicionar o token a uma blacklist
    return { message: 'Logout realizado com sucesso' };
  }
}
