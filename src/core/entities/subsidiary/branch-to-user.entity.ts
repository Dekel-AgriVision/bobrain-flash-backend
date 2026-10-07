import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CoreEntity } from '../base/core.entity';
import { Branch } from './branch.entity';

/**
 * Relationship table {user, product} with custom properties
 */
@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class BranchToUser extends CoreEntity {
  @IsUUID()
  @IsNotEmpty()
  @Column({ name: 'branch_id', type: 'uuid', nullable: false })
  branchId: string;

  @ApiProperty({ required: false, type: () => Branch })
  @ManyToOne(() => Branch, (branch) => branch.branchToUsers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;
}
