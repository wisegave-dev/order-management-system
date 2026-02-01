# Database Setup Guide

This guide will help you set up MySQL/MariaDB for the Order Management System in both local development and production environments.

---

## Table of Contents
- [Local Development Setup](#local-development-setup)
- [Production Setup](#production-setup)
- [Database Configuration](#database-configuration)
- [Creating Entities](#creating-entities)
- [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Option 1: Using Homebrew (macOS/Linux)

```bash
# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation (set root password)
mysql_secure_installation
```

### Option 2: Using Docker (Cross-platform)

```bash
# Pull and run MySQL container
docker run --name order-mgmt-mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=order_management \
  -p 3306:3306 \
  -d mysql:8.0

# Or using Docker Compose (create docker-compose.yml)
# See the docker-compose example below
```

### Docker Compose Example

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: order-mgmt-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: order_management
      MYSQL_USER: order_user
      MYSQL_PASSWORD: order_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

Then run:
```bash
docker-compose up -d
```

### Create Local Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE order_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create user (optional, if you want a separate user)
CREATE USER 'order_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON order_management.* TO 'order_user'@'localhost';
FLUSH PRIVILEGES;

# Exit
EXIT;
```

### Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your local database credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_root_password
DB_DATABASE=order_management
```

---

## Production Setup

### Option 1: Cloud MySQL Services

#### AWS RDS
```bash
# Create MySQL database via AWS Console or CLI:
aws rds create-db-instance \
  --db-instance-identifier order-mgmt-db \
  --db-instance-class db.t3.micro \
  --engine MySQL \
  --master-username admin \
  --master-user-password your_secure_password \
  --allocated-storage 20
```

#### Google Cloud SQL
```bash
# Create Cloud SQL instance
gcloud sql instances create order-mgmt-db \
  --tier=db-f1-micro \
  --region=us-central1 \
  --mysql-version=MYSQL_8_0
```

#### Azure Database for MySQL
Use Azure Portal to create a MySQL Flexible Server

#### DigitalOcean Managed Database
Create via DigitalOcean Control Panel

### Option 2: Traditional VPS/Server

#### Install MySQL on Ubuntu/Debian
```bash
# Update packages
sudo apt update

# Install MySQL Server
sudo apt install mysql-server -y

# Secure installation
sudo mysql_secure_installation

# Configure remote access (if needed)
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Change bind-address from 127.0.0.1 to 0.0.0.0

# Restart MySQL
sudo systemctl restart mysql
```

#### Create Production Database
```bash
# Login to MySQL
sudo mysql -u root -p

# Create database
CREATE DATABASE order_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Create dedicated user (recommended for production)
CREATE USER 'order_prod_user'@'%' IDENTIFIED BY 'strong_secure_password_here';
GRANT ALL PRIVILEGES ON order_management.* TO 'order_prod_user'@'%';
FLUSH PRIVILEGES;

# Exit
EXIT;
```

### Production Environment Variables

Update your production `.env` file:

```env
NODE_ENV=production

DB_HOST=your-production-db-host.com
DB_PORT=3306
DB_USERNAME=order_prod_user
DB_PASSWORD=strong_secure_password_here
DB_DATABASE=order_management
```

### Security Best Practices for Production

1. **Use strong passwords** - Minimum 16 characters with mixed case, numbers, and symbols
2. **Restrict access** - Only allow connections from your application IP
3. **Enable SSL/TLS** - Force encrypted connections
4. **Regular backups** - Set up automated backups
5. **Monitor logs** - Set up logging and monitoring
6. **Update regularly** - Keep MySQL patched

---

## Database Configuration

### TypeORM Features Enabled

```typescript
// Automatic schema synchronization (development only)
synchronize: process.env.NODE_ENV === 'development'

// SQL query logging (development only)
logging: process.env.NODE_ENV === 'development'

// Soft deletes enabled
@DeleteDateColumn()
deletedAt: Date | null;
```

### Connection Pool Settings

```typescript
extra: {
  connectionLimit: 10, // Adjust based on your needs
}
```

### Timezone Configuration

All timestamps are stored in UTC to avoid timezone issues:

```typescript
timezone: '+00:00'
```

---

## Creating Entities

### Step 1: Extend BaseEntity

```typescript
import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../database/base.entity';

@Entity('orders')
export class Order extends BaseEntity {
  @Column()
  customerName: string;

  @Column('decimal')
  total: number;

  @Column({ default: 'pending' })
  status: string;
}
```

### Step 2: Create Module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderService } from './order.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [OrderService],
  exports: [TypeOrmModule],
})
export class OrderModule {}
```

### Step 3: Use in Service

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  findAll() {
    return this.orderRepository.find();
  }

  findOne(id: string) {
    return this.orderRepository.findOne({ where: { id } });
  }

  create(orderData: Partial<Order>) {
    const order = this.orderRepository.create(orderData);
    return this.orderRepository.save(order);
  }

  async update(id: string, orderData: Partial<Order>) {
    await this.orderRepository.update(id, orderData);
    return this.findOne(id);
  }

  async delete(id: string) {
    // Soft delete (sets deletedAt)
    await this.orderRepository.softDelete(id);
  }

  async restore(id: string) {
    // Restore soft deleted record
    await this.orderRepository.restore(id);
  }
}
```

---

## Troubleshooting

### Connection Refused
```bash
# Check if MySQL is running
# macOS:
brew services list

# Linux:
sudo systemctl status mysql

# Docker:
docker ps | grep mysql
```

### Access Denied
```bash
# Check credentials in .env
cat .env | grep DB_

# Test connection manually
mysql -h localhost -u root -p order_management
```

### Database Doesn't Exist
```bash
mysql -u root -p -e "CREATE DATABASE order_management;"
```

### Port Already in Use
```bash
# Check what's using port 3306
lsof -i :3306

# Kill process if needed
kill -9 <PID>
```

### Synchronization Issues
In development, TypeORM auto-syncs schemas. If you encounter issues:
```bash
# Stop the application
# Delete all tables (CAUTION: This deletes data)
mysql -u root -p order_management -e "DROP TABLE `users`, `orders`;"

# Restart the application
npm run start
```

### View TypeORM Generated SQL
Set `logging: true` in database.module.ts to see all SQL queries in the console.

---

## Next Steps

1. ✅ Set up local MySQL database
2. ✅ Configure environment variables
3. ✅ Test the connection by running the application
4. Create your entities extending `BaseEntity`
5. Create services using TypeORM Repository pattern
6. Set up production database when ready to deploy

---

## Useful Commands

```bash
# Start MySQL
brew services start mysql  # macOS
sudo systemctl start mysql # Linux
docker start order-mgmt-mysql # Docker

# Stop MySQL
brew services stop mysql   # macOS
sudo systemctl stop mysql  # Linux
docker stop order-mgmt-mysql # Docker

# Login to MySQL
mysql -u root -p

# Show databases
SHOW DATABASES;

# Show tables
USE order_management;
SHOW TABLES;

# Describe table structure
DESCRIBE users;

# View table data
SELECT * FROM users;

# Count records
SELECT COUNT(*) FROM users;
```
