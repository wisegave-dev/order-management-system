import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../database/entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    try {
      const customer = this.customerRepository.create(createCustomerDto);
      const saved = await this.customerRepository.save(customer);
      this.logger.log(`Customer created with ID: ${saved.id}`);
      return saved;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        this.logger.warn(`Duplicate email attempt: ${createCustomerDto.email}`);
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findAll(): Promise<Customer[]> {
    return this.customerRepository.find({
      relations: ['orders'],
      withDeleted: false,
    });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['orders'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    try {
      Object.assign(customer, updateCustomerDto);
      const updated = await this.customerRepository.save(customer);
      this.logger.log(`Customer updated: ${id}`);
      return updated;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);
    await this.customerRepository.softRemove(customer);
    this.logger.log(`Customer soft deleted: ${id}`);
  }

  async restore(id: string): Promise<Customer> {
    const result = await this.customerRepository.restore(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID ${id} not found or not deleted`);
    }
    return this.findOne(id);
  }
}
