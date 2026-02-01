import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { Order } from './order.entity';

@Entity('customers')
export class Customer extends BaseEntity {
  @Column({ type: 'varchar', length: 255, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 255, name: 'last_name' })
  lastName: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
    name: 'email',
  })
  email: string;

  @Column({ type: 'varchar', length: 255, name: 'business_name', nullable: true })
  businessName: string;

  @Column({ type: 'varchar', length: 100, name: 'timezone', default: 'America/New_York' })
  timezone: string;

  @Column({ type: 'json', name: 'metadata', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];
}
