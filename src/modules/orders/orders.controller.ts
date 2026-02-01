import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '../database/entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('by-customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.ordersService.findByCustomer(customerId);
  }

  @Get('by-status/:status')
  findByStatus(@Param('status') status: OrderStatus) {
    return this.ordersService.findByStatus(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status/:status')
  updateStatus(@Param('id') id: string, @Param('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
