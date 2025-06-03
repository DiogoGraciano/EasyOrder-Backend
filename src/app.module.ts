import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';
import { DatabaseModule } from './database/database.module';
import { CustomerModule } from './customer/customer.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';

@Module({
  imports: [
    SharedModule,
    DatabaseModule,
    CustomerModule,
    EnterpriseModule,
    ProductModule,
    OrderModule,
  ],
})
export class AppModule {}
