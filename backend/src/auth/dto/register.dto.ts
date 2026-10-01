import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть не короче 6 символов' })
  @MaxLength(72) // предел bcrypt
  password: string;

  @IsString()
  @MinLength(2, { message: 'Укажите ФИО' })
  @MaxLength(200)
  fullName: string;
}
