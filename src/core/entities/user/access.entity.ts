import { Column, Index } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { RawRule } from '@casl/ability';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EntityType, PermissionsType } from '../../definitions/types';
import { CoreEntity } from '../base/core.entity';
import { Exclude, instanceToPlain } from 'class-transformer';
import { Entity } from 'typeorm';

@Entity()
export class Access extends CoreEntity {
  @ApiHideProperty()
  @Exclude({ toPlainOnly: true })
  private _abilityRules: RawRule[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `name`, uniqueItems: true })
  @Index()
  @Column()
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: `Entite pour la gestion des permission`,
    uniqueItems: true,
  })
  //@Index()
  @Column({ type: 'simple-json', nullable: false })
  entity: EntityType;

  @IsOptional()
  @ApiProperty({ required: false })
  @Column({ type: 'simple-json', nullable: false })
  permissions: PermissionsType;

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
