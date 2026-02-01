import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../database/entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepository.create(createOrderDto);
    const saved = await this.orderRepository.save(order);
    this.logger.log(`Order created with ID: ${saved.id} for customer: ${saved.customerId}`);
    return saved;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['customer'],
      withDeleted: false,
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customerId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.find({
      where: { status },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    const updated = await this.orderRepository.save(order);
    this.logger.log(`Order updated: ${id}`);
    return updated;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    const updated = await this.orderRepository.save(order);
    this.logger.log(`Order status updated: ${id} -> ${status}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.softRemove(order);
    this.logger.log(`Order soft deleted: ${id}`);
  }

  async restore(id: string): Promise<Order> {
    const result = await this.orderRepository.restore(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Order with ID ${id} not found or not deleted`);
    }
    return this.findOne(id);
  }
}
