import { Body, Controller, Post, Put, Res, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginRequestDto } from './dto/login-request.dto';
import { UserRequestDto } from './dto/user-request.dto';
import { MeRequestDto } from './dto/me-request.dto';
import { Response } from 'express';
import { OneTimeTokenGuard } from '../one-time-token/one-time-token.guard';
import { UpdatePasswordRequestDto } from './dto/update-password-request.dto';

@UseGuards(new OneTimeTokenGuard())
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/getUserInfo')
  public async getUsers(@Body() body: LoginRequestDto, @Res() res: Response) {
    const data = await this.userService.getUserInformation(body);

    return res.status(data.code).json(data);
  }

  @Post('/storeUserInfo')
  public async storeUserInfo(
    @Body() body: UserRequestDto,
    @Res() res: Response,
  ) {
    const store = await this.userService.storeUserInformation(body);

    return res.status(store.code).json(store);
  }

  @Post('/me')
  public async getUserInfo(@Body() body: MeRequestDto, @Res() res: Response) {
    const data = await this.userService.getUserByToken(body.userToken);
    return res.status(data.code).json(data);
  }

  @Put('/updatePassword')
  public async updatePassword(
    @Body() body: UpdatePasswordRequestDto,
    @Res() res: Response,
  ) {
    const data = await this.userService.updateAppPassword(body);

    return res.status(data.code).json(data);
  }
}
