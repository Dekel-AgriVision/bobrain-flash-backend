import { Injectable } from '@nestjs/common';
import { ErpConnection } from 'src/core/entities/setting/erp-connection.entity';

@Injectable()
export class ErpConnService {
  async getConfig(branchCode: string) {
    return await ErpConnection.findOne({
      where: {
        code: branchCode,
        isActive: true,
      },
      relations: ['branch'],
    });
  }
}
