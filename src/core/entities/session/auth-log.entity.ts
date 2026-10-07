import { Column, Entity } from 'typeorm';
import { Details } from 'express-useragent';
import { CoreEntity } from '../base/core.entity';
import { AuthLogAuthMethodEnum } from '../../../core/definitions/enums';

@Entity()
export class AuthLog extends CoreEntity {
  @Column({ nullable: true })
  username: string;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column({ name: 'request_url' })
  requestUrl: string;

  @Column({ name: 'request_method' })
  requestMethod: string;

  @Column({ name: 'is_denied', default: false, nullable: true })
  isDenied: boolean;

  @Column({ name: 'denial_reason', nullable: true })
  denialReason: string;

  @Column({ name: 'auth_method' })
  authMethod: AuthLogAuthMethodEnum;

  @Column({ name: 'user_agent', type: 'simple-json', nullable: true })
  userAgent: Details;

  @Column({ name: 'application_id' })
  applicationId: string;
}
