import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { AuthUser, JwtPayload } from '../common/auth-user.js';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    if (await this.users.findByEmailWithPassword(email)) {
      throw new ConflictException('Пользователь с таким email уже зарегистрирован');
    }
    // Роль не принимается от клиента — всегда STUDENT по умолчанию из схемы.
    const password = await bcrypt.hash(dto.password, 10);
    return this.users.create({ email, password, fullName: dto.fullName.trim() });
  }

  async validateCredentials(email: string, password: string): Promise<AuthUser | null> {
    const user = await this.users.findByEmailWithPassword(email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password))) return null;
    const { id, fullName, role, groupId } = user;
    return { id, email: user.email, fullName, role, groupId };
  }

  signToken(user: AuthUser): { token: string; expiresAt: Date } {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    const token = this.jwt.sign(payload);
    const { exp } = this.jwt.decode<{ exp: number }>(token);
    return { token, expiresAt: new Date(exp * 1000) };
  }
}
