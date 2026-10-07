import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Details } from 'express-useragent';
import { CoreEntity } from '../base/core.entity';
import { ApiProperty } from '@nestjs/swagger';
import { AuthUser } from './auth-user.entity';

@Entity()
export class AccessRequestHistory extends CoreEntity {
  @Column()
  username: string;

  @ApiProperty()
  @Column({ type: 'simple-json' })
  data: any;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @Column({ name: 'request_status' })
  requestStatus: number;

  @Column({ name: 'request_url' })
  requestUrl: string;

  @Column({ name: 'request_method' })
  requestMethod: string;

  @Column({ nullable: true })
  message: string;

  @Column({ type: 'simple-json', nullable: true })
  errors: string;

  @Column({ name: 'user_agent', type: 'simple-json', nullable: true })
  userAgent: Details;

  @Column({ name: 'auth_user_id', type: 'uuid', nullable: true })
  authUserId: string;

  @ApiProperty({ description: `Jeton d'authentification` })
  @ManyToOne(() => AuthUser, {
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
    createForeignKeyConstraints: false,
    nullable: true,
  })
  @JoinColumn({ name: 'auth_user_id' })
  authUser: AuthUser;
}
