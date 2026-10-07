import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Column } from 'typeorm';
import { CoreEntity } from './core.entity';

export class PersonCoreEntity extends CoreEntity {
  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Prénoms' })
  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Nom' })
  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: `Numéro de téléphone` })
  @Column({ name: 'phone_number', nullable: true })
  phoneNumber: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({ required: false, description: `Email` })
  @Column({ nullable: true })
  email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: `Adresse` })
  @Column({ nullable: true })
  address: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: `Description` })
  @Column({ type: 'text', nullable: true })
  description: string;
}
