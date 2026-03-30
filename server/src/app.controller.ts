import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return { message: '말하기 듣기 쓰기 API' };
  }
}
