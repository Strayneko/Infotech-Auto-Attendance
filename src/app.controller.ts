import { Controller, Get } from '@nestjs/common';

@Controller('')
export class AppController {
  @Get('/')
  public async index() {
    const date = new Date();
    const serverTime = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    return { status: true, serverTime };
  }
}
