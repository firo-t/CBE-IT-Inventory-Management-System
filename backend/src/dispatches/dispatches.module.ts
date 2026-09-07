import { Module } from '@nestjs/common';
import { DispatchesService } from './dispatches.service';
import { DispatchesController } from './dispatches.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DispatchesController],
  providers: [DispatchesService],
  exports: [DispatchesService],
})
export class DispatchesModule {}
