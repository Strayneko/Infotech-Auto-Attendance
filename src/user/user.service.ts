import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  public constructor(protected readonly prismaService: PrismaService) {}

  public async getUsers() {
    return this.prismaService.user.findMany();
  }
}
