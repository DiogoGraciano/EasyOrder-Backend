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
    // Validações personalizadas de negócio
    await this.validateOrderCreation(createOrderDto);

    const { items, ...orderData } = createOrderDto;

    // Verificar se o número do pedido já existe
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
    // Validar se o cliente existe
    await this.validateCustomerExists(createOrderDto.customerId);

    // Validar se a empresa existe
    await this.validateEnterpriseExists(createOrderDto.enterpriseId);

    // Validações dos itens
    this.validateOrderItems(createOrderDto.items);

    // Validar produtos e estoque
    await this.validateProductsAndStock(createOrderDto.items);

    // Validar se os produtos pertencem à empresa
    await this.validateProductsBelongToEnterprise(
      createOrderDto.items,
      createOrderDto.enterpriseId,
    );

    // Validar cálculos do pedido
    this.validateOrderCalculations(createOrderDto);

    // Validações de regras de negócio
    this.validateBusinessRules(createOrderDto);
  }

  private validateOrderItems(items: CreateOrderItemDto[]): void {
    // Validar se há pelo menos um item
    if (!items || items.length === 0) {
      throw new BadRequestException('O pedido deve ter pelo menos um item');
    }

    // Validar se não há produtos duplicados
    this.validateNoDuplicateProducts(items);

    // Validar quantidade total
    this.validateTotalQuantity(items);

    // Validar cada item individualmente
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

    // Validar quantidade
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

    // Validar preços
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

    // Validar se o subtotal está correto
    const expectedSubtotal = item.quantity * item.unitPrice;
    if (Math.abs(item.subtotal - expectedSubtotal) > 0.01) {
      throw new BadRequestException(
        `${itemPrefix}: Subtotal incorreto. Esperado: R$ ${expectedSubtotal.toFixed(2)}, Informado: R$ ${item.subtotal.toFixed(2)}`,
      );
    }

    // Validar nome do produto
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
    // Validar valor mínimo do pedido
    this.validateMinOrderValue(createOrderDto.totalAmount);

    // Validar data do pedido
    this.validateOrderDate(createOrderDto.orderDate);

    // Validar número do pedido
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

    // Não permitir datas futuras
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

    // Validar formato do número do pedido (apenas letras, números e hífens)
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

      // Verificar se há estoque suficiente
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Estoque insuficiente para o produto ${product.name}. ` +
            `Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
        );
      }

      // Verificar se o preço unitário está correto
      if (Math.abs(product.price - item.unitPrice) > 0.01) {
        throw new BadRequestException(
          `Preço unitário incorreto para o produto ${product.name}. ` +
            `Preço atual: R$ ${product.price}, Informado: R$ ${item.unitPrice}`,
        );
      }

      // Verificar se o nome do produto está correto
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

  private validateOrderCalculations(createOrderDto: CreateOrderDto): void {
    let calculatedTotal = 0;

    for (const item of createOrderDto.items) {
      // Verificar se o subtotal está correto
      const expectedSubtotal = item.quantity * item.unitPrice;
      if (Math.abs(item.subtotal - expectedSubtotal) > 0.01) {
        throw new BadRequestException(
          `Subtotal incorreto para o produto ${item.productName}. ` +
            `Esperado: R$ ${expectedSubtotal.toFixed(2)}, Informado: R$ ${item.subtotal.toFixed(2)}`,
        );
      }

      calculatedTotal += item.subtotal;
    }

    // Verificar se o total do pedido está correto
    if (Math.abs(createOrderDto.totalAmount - calculatedTotal) > 0.01) {
      throw new BadRequestException(
        `Total do pedido incorreto. ` +
          `Esperado: R$ ${calculatedTotal.toFixed(2)}, Informado: R$ ${createOrderDto.totalAmount.toFixed(2)}`,
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
    // Validar se o cliente existe
    await this.validateCustomerExists(customerId);

    return await this.orderRepository.find({
      where: { customerId },
      relations: ['customer', 'enterprise', 'items'],
    });
  }

  async findByenterprise(enterpriseId: string): Promise<Order[]> {
    // Validar se a empresa existe
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

    // Validações específicas para atualização
    await this.validateOrderUpdate(order, updateOrderDto);

    Object.assign(order, updateOrderDto);
    return await this.orderRepository.save(order);
  }

  private async validateOrderUpdate(
    existingOrder: Order,
    updateOrderDto: UpdateOrderDto,
  ): Promise<void> {
    // Não permitir alterar pedidos já completados ou cancelados
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

    // Se está alterando o número do pedido, verificar se não existe outro com o mesmo número
    if (
      updateOrderDto.orderNumber &&
      updateOrderDto.orderNumber !== existingOrder.orderNumber
    ) {
      this.validateOrderNumber(updateOrderDto.orderNumber);
      await this.validateUniqueOrderNumber(updateOrderDto.orderNumber);
    }

    // Se está alterando o cliente, validar se existe
    if (
      updateOrderDto.customerId &&
      updateOrderDto.customerId !== existingOrder.customerId
    ) {
      await this.validateCustomerExists(updateOrderDto.customerId);
    }

    // Se está alterando a empresa, validar se existe
    if (
      updateOrderDto.enterpriseId &&
      updateOrderDto.enterpriseId !== existingOrder.enterpriseId
    ) {
      await this.validateEnterpriseExists(updateOrderDto.enterpriseId);
    }

    // Validar transições de status
    if (
      updateOrderDto.status &&
      updateOrderDto.status !== existingOrder.status
    ) {
      this.validateStatusTransition(
        existingOrder.status,
        updateOrderDto.status,
      );
    }

    // Se está alterando o valor total, validar valor mínimo
    if (updateOrderDto.totalAmount !== undefined) {
      this.validateMinOrderValue(updateOrderDto.totalAmount);
    }

    // Se está alterando a data, validar
    if (updateOrderDto.orderDate) {
      this.validateOrderDate(updateOrderDto.orderDate);
    }
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [], // Não pode sair do status completado
      [OrderStatus.CANCELLED]: [], // Não pode sair do status cancelado
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: de ${currentStatus} para ${newStatus}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);

    // Não permitir excluir pedidos completados
    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        'Não é possível excluir um pedido completado',
      );
    }

    await this.orderRepository.remove(order);
  }
}
