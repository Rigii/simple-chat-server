import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto } from '../dto/user.dto';
import { USER_ROUTES } from '../constants/user.routes';

@Controller(USER_ROUTES.user)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post(USER_ROUTES.create_user)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
