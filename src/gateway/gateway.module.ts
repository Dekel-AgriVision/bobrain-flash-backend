/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
@Module({
  imports: [],
  providers: [SocketGateway],
  exports: [],
})
export class GatewayModule {}
