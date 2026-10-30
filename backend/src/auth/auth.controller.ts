import { Body, Controller, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  private readonly cookieName: string;

  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    config: ConfigService,
  ) {
    this.cookieName = config.getOrThrow<string>('COOKIE_NAME');
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.register(dto);
    return { user, token: this.auth.signToken(user).token };
  }

  // LoginDto описывает тело для валидации/документации; сами учётные данные
  // проверяет LocalStrategy.
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() _dto: LoginDto,
    @CurrentUser() user: AuthUser,
  ) {
    return { user: await this.users.findById(user.id), token: this.auth.signToken(user).token };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    // Токен теперь живёт в sessionStorage вкладки; cookie чистим ради старых сессий.
    res.clearCookie(this.cookieName, { path: '/' });
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.findById(user.id);
  }
}
