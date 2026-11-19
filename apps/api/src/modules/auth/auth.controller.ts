import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Rate limit fino: 5 tentativas / 15 min */
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password);
  }
}
