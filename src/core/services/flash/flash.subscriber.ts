/* eslint-disable prettier/prettier */
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';
import { generate } from 'generate-password';
import dayjs from 'dayjs';
import { Flash } from 'src/core/entities/flash/flash.entity';

@EventSubscriber()
export class FlashSubscriber
  implements EntitySubscriberInterface<Flash>
{
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Flash;
  }

  async beforeInsert(event: InsertEvent<Flash>) {
    if (
      typeof event.entity.reference !== 'string' ||
      event.entity.reference.trim() === ''
    ) {
      event.entity.reference = await this.generateReference(event.connection);
    }
  }

  private async generateReference(connection: DataSource): Promise<string> {
    let reference: string;
    let existsCount: number;
    do {
      reference =
        'F' +
        dayjs.utc().toArray().join('').slice(0, 6) +
        generate({
          numbers: true,
          length: 3,
          strict: true,
          lowercase: false,
          uppercase: false,
          excludeSimilarCharacters: true,
        });
      existsCount = await connection.getRepository(Flash).countBy({
        reference: reference,
      });
    } while (existsCount > 0);

    return reference;
  }
}
