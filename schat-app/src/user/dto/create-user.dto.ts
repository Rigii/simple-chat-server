import { IsNotEmpty } from 'class-validator';
import { TUserRole } from '../types';

export class CreateUserDto {
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  nickname: string;
  role: TUserRole;
  password: string;
}
