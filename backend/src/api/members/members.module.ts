import { Module } from '@nestjs/common';
import { MembersController } from './controllers/members.controller';

@Module({
  controllers: [MembersController]
})
export class MembersModule {}
