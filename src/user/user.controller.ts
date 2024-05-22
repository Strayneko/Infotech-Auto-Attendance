import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRequestDto } from './dto/user-request.dto';
import { StoreUserRequestDto } from './dto/store-user-request.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/getUserInfo')
  public async getUsers(@Body() body: UserRequestDto) {
    return await this.userService.getUserInformation(body);
  }

  @Post('/storeUserInfo')
  public async storeUserInfo(@Body() body: StoreUserRequestDto) {
    return await this.userService.storeUserInformation(body);
  }
}