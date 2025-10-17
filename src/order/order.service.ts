import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Customer } from '../customer/entities/customer.entity';
import { Enterprise } from '../enterprise/entities/enterprise.entity';
import { Product } from '../product/entities/product.entity';
import { OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Enterprise)
    private enterpriseRepository: Repository<Enterprise>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    await this.validateOrderCreation(createOrderDto);

    const { items, ...orderData } = createOrderDto;

    await this.validateUniqueOrderNumber(orderData.orderNumber);

    const order = this.orderRepository.create(orderData);
    const savedOrder = await this.orderRepository.save(order);

    const orderItems = items.map((item) =>
      this.orderItemRepository.create({
        ...item,
        orderId: savedOrder.id,
      }),
    );

    await this.orderItemRepository.save(orderItems);

    return this.findOne(savedOrder.id);
  }

  private async validateOrderCreation(
    createOrderDto: CreateOrderDto,
  ): Promise<void> {
    await this.validateCustomerExists(createOrderDto.customerId);

    await this.validateEnterpriseExists(createOrderDto.enterpriseId);

    this.validateOrderItems(createOrderDto.items);

    await this.validateProductsAndStock(createOrderDto.items);

    await this.validateProductsBelongToEnterprise(
      createOrderDto.items,
      createOrderDto.enterpriseId,
    );

    this.validateOrderCalculations(createOrderDto);

    this.validateBusinessRules(createOrderDto);
  }

  private validateOrderItems(items: CreateOrderItemDto[]): void {
    if (!items || items.length === 0) {
      throw new BadRequestException('O pedido deve ter pelo menos um item');
    }

    this.validateNoDuplicateProducts(items);

    this.validateTotalQuantity(items);

    items.forEach((item, index) => {
      this.validateOrderItem(item, index);
    });
  }

  private validateNoDuplicateProducts(items: CreateOrderItemDto[]): void {
    const productIds = items.map((item) => item.productId);
    const uniqueProductIds = new Set(productIds);

    if (productIds.length !== uniqueProductIds.size) {
      throw new BadRequestException(
        'O pedido não pode conter produtos duplicados',
      );
    }
  }

  private validateTotalQuantity(
    items: CreateOrderItemDto[],
    maxQuantity = 50,
  ): void {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    if (totalQuantity > maxQuantity) {
      throw new BadRequestException(
        `A quantidade total de itens não pode exceder ${maxQuantity}. Total atual: ${totalQuantity}`,
      );
    }
  }

  private validateOrderItem(item: CreateOrderItemDto, index: number): void {
    const itemPrefix = `Item ${index + 1}`;

    if (item.quantity <= 0) {
      throw new BadRequestException(
        `${itemPrefix}: A quantidade deve ser maior que zero`,
      );
    }

    if (item.quantity > 100) {
      throw new BadRequestException(
        `${itemPrefix}: A quantidade não pode exceder 100 unidades`,
      );
    }

    if (item.unitPrice < 0) {
      throw new BadRequestException(
        `${itemPrefix}: O preço unitário não pode ser negativo`,
      );
    }

    if (item.subtotal < 0) {
      throw new BadRequestException(
        `${itemPrefix}: O subtotal não pode ser negativo`,
      );
    }

    const expectedSubtotal = item.quantity * item.unitPrice;
    if (Math.abs(item.subtotal - expectedSubtotal) > 0.01) {
      throw new BadRequestException(
        `${itemPrefix}: Subtotal incorreto. Esperado: R$ ${expectedSubtotal.toFixed(2)}, Informado: R$ ${item.subtotal.toFixed(2)}`,
      );
    }

    if (!item.productName || item.productName.trim().length === 0) {
      throw new BadRequestException(
        `${itemPrefix}: O nome do produto é obrigatório`,
      );
    }

    if (item.productName.length > 255) {
      throw new BadRequestException(
        `${itemPrefix}: O nome do produto não pode ter mais de 255 caracteres`,
      );
    }
  }

  private validateBusinessRules(createOrderDto: CreateOrderDto): void {
    this.validateMinOrderValue(createOrderDto.totalAmount);

    this.validateOrderDate(createOrderDto.orderDate);

    this.validateOrderNumber(createOrderDto.orderNumber);
  }

  private validateMinOrderValue(totalAmount: number, minValue = 5): void {
    if (totalAmount < minValue) {
      throw new BadRequestException(
        `O valor mínimo do pedido é R$ ${minValue.toFixed(2)}. Valor atual: R$ ${totalAmount.toFixed(2)}`,
      );
    }
  }

  private validateOrderDate(orderDate: string): void {
    const date = new Date(orderDate);
    const today = new Date();

    today.setHours(23, 59, 59, 999);
    if (date > today) {
      throw new BadRequestException('A data do pedido não pode ser no futuro');
    }
  }

  private validateOrderNumber(orderNumber: string): void {
    if (!orderNumber || orderNumber.trim().length === 0) {
      throw new BadRequestException('O número do pedido é obrigatório');
    }

    if (orderNumber.length > 50) {
      throw new BadRequestException(
        'O número do pedido não pode ter mais de 50 caracteres',
      );
    }

    const validFormat = /^[A-Za-z0-9-]+$/;
    if (!validFormat.test(orderNumber)) {
      throw new BadRequestException(
        'O número do pedido deve conter apenas letras, números e hífens',
      );
    }
  }

  private async validateCustomerExists(customerId: string): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Cliente com ID ${customerId} não encontrado`,
      );
    }
  }

  private async validateEnterpriseExists(enterpriseId: string): Promise<void> {
    const enterprise = await this.enterpriseRepository.findOne({
      where: { id: enterpriseId },
    });

    if (!enterprise) {
      throw new NotFoundException(
        `Empresa com ID ${enterpriseId} não encontrada`,
      );
    }
  }

  private async validateProductsAndStock(
    items: CreateOrderItemDto[],
  ): Promise<void> {
    for (const item of items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Produto com ID ${item.productId} não encontrado`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${product.name}. ` +
            `Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
        );
      }

      if (Math.abs(product.price - item.unitPrice) > 0.01) {
        throw new BadRequestException(
          `Preço unitário incorreto para o produto ${product.name}. ` +
            `Preço atual: R$ ${product.price}, Informado: R$ ${item.unitPrice}`,
        );
      }

      if (product.name !== item.productName) {
        throw new BadRequestException(
          `Nome do produto incorreto. Esperado: ${product.name}, Informado: ${item.productName}`,
        );
      }
    }
  }

  private async validateProductsBelongToEnterprise(
    items: CreateOrderItemDto[],
    enterpriseId: string,
  ): Promise<void> {
    for (const item of items) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });

      if (product && product.enterpriseId !== enterpriseId) {
        throw new BadRequestException(
          `O produto ${product.name} não pertence à empresa especificada`,
        );
      }
    }
  }

  private validateOrderCalculations(createOrderDto: CreateOrderDto): void;
  private validateOrderCalculations(updateOrderDto: UpdateOrderDto): void;
  private validateOrderCalculations(orderDto: CreateOrderDto | UpdateOrderDto): void {
    if (!orderDto.items || !orderDto.totalAmount) {
      return;
    }

    let calculatedTotal = 0;

    for (const item of orderDto.items) {
      const expectedSubtotal = item.quantity * item.unitPrice;
      if (Math.abs(item.subtotal - expectedSubtotal) > 0.01) {
        throw new BadRequestException(
          `Subtotal incorreto para o produto ${item.productName}. ` +
            `Esperado: R$ ${expectedSubtotal.toFixed(2)}, Informado: R$ ${item.subtotal.toFixed(2)}`,
        );
      }

      calculatedTotal += item.subtotal;
    }

    if (Math.abs(orderDto.totalAmount - calculatedTotal) > 0.01) {
      throw new BadRequestException(
        `Total do pedido incorreto. ` +
          `Esperado: R$ ${calculatedTotal.toFixed(2)}, Informado: R$ ${orderDto.totalAmount.toFixed(2)}`,
      );
    }
  }

  private async validateUniqueOrderNumber(orderNumber: string): Promise<void> {
    const existingOrder = await this.orderRepository.findOne({
      where: { orderNumber },
    });

    if (existingOrder) {
      throw new ConflictException(
        `Já existe um pedido com o número ${orderNumber}`,
      );
    }
  }

  async findAll(): Promise<Order[]> {
    return await this.orderRepository.find({
      relations: ['customer', 'enterprise', 'items'],
    });
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    await this.validateCustomerExists(customerId);

    return await this.orderRepository.find({
      where: { customerId },
      relations: ['customer', 'enterprise', 'items'],
    });
  }

  async findByenterprise(enterpriseId: string): Promise<Order[]> {
    await this.validateEnterpriseExists(enterpriseId);

    return await this.orderRepository.find({
      where: { enterpriseId },
      relations: ['customer', 'enterprise', 'items'],
    });
  }

  async findOne(id: string): Promise<Order> {
    if (!id) {
      throw new BadRequestException('ID do pedido é obrigatório');
    }

    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['customer', 'enterprise', 'items'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);

    await this.validateOrderUpdate(order, updateOrderDto);

    if (updateOrderDto.items) {
      await this.validateProductsAndStock(updateOrderDto.items);
      await this.validateProductsBelongToEnterprise(
        updateOrderDto.items,
        updateOrderDto.enterpriseId || order.enterpriseId,
      );
      this.validateOrderCalculations(updateOrderDto);
    }

    if (order.items && order.items.length > 0) {
      await this.orderItemRepository.delete({ orderId: order.id });
    }

    Object.assign(order, updateOrderDto);
    const savedOrder = await this.orderRepository.save(order);

    if (updateOrderDto.items && updateOrderDto.items.length > 0) {
      const orderItems = updateOrderDto.items.map((item) =>
        this.orderItemRepository.create({
          ...item,
          orderId: savedOrder.id,
        }),
      );

      await this.orderItemRepository.save(orderItems);
    }

    return this.findOne(savedOrder.id);
  }

  private async validateOrderUpdate(
    existingOrder: Order,
    updateOrderDto: UpdateOrderDto,
  ): Promise<void> {
    if (existingOrder.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Não é possível alterar um pedido já completado',
      );
    }

    if (existingOrder.status === OrderStatus.CANCELLED) {
      throw new BadRequestException(
        'Não é possível alterar um pedido cancelado',
      );
    }

    if (
      updateOrderDto.orderNumber &&
      updateOrderDto.orderNumber !== existingOrder.orderNumber
    ) {
      this.validateOrderNumber(updateOrderDto.orderNumber);
      await this.validateUniqueOrderNumber(updateOrderDto.orderNumber);
    }

    if (
      updateOrderDto.customerId &&
      updateOrderDto.customerId !== existingOrder.customerId
    ) {
      await this.validateCustomerExists(updateOrderDto.customerId);
    }

    if (
      updateOrderDto.enterpriseId &&
      updateOrderDto.enterpriseId !== existingOrder.enterpriseId
    ) {
      await this.validateEnterpriseExists(updateOrderDto.enterpriseId);
    }

    if (
      updateOrderDto.status &&
      updateOrderDto.status !== existingOrder.status
    ) {
      this.validateStatusTransition(
        existingOrder.status,
        updateOrderDto.status,
      );
    }

    if (updateOrderDto.totalAmount !== undefined) {
      this.validateMinOrderValue(updateOrderDto.totalAmount);
    }

    if (updateOrderDto.orderDate) {
      this.validateOrderDate(updateOrderDto.orderDate);
    }

    if (updateOrderDto.items) {
      this.validateOrderItems(updateOrderDto.items);
    }
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: de ${currentStatus} para ${newStatus}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Não é possível excluir um pedido completado',
      );
    }

    if (order.items && order.items.length > 0) {
      await this.orderItemRepository.delete({ orderId: order.id });
    }
    
    await this.orderRepository.remove(order);
  }
}
