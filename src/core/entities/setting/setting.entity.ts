import { Column, Entity, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class Setting extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Name` })
  @Index()
  @Column({ name: 'name' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Description` })
  @Column({ name: 'display_name' })
  displayName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Valeur` })
  @Column({ name: 'value' })
  value: string;

  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
