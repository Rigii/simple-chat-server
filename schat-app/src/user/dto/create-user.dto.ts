import { IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  email: string;
  @IsNotEmpty()
  nickname: string;
  role: string;
}
