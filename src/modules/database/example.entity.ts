import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password?: string;

  @Column({ type: 'enum', enum: ['active', 'inactive'], default: 'active' })
  status: 'active' | 'inactive';
}
