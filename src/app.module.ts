import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { DatabaseModule } from './database/database.module';
import { CustomerModule } from './customer/customer.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    AuthModule,
    CustomerModule,
    EnterpriseModule,
    ProductModule,
    OrderModule,
    HealthModule,
  ],
})
export class AppModule {}
