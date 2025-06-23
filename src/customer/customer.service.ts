import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { FileUploadService } from '../shared/services/file-upload.service';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    await this.validateCustomerCreation(createCustomerDto);

    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  private async validateCustomerCreation(
    createCustomerDto: CreateCustomerDto,
  ): Promise<void> {

    this.validateBasicData(createCustomerDto);

    this.validateCPF(createCustomerDto.cpf);

    this.validateEmail(createCustomerDto.email);

    this.validatePhone(createCustomerDto.phone);

    await this.validateUniqueness(createCustomerDto);
  }

  private validateBasicData(
    customerDto: CreateCustomerDto | UpdateCustomerDto,
  ): void {
    if (customerDto.name) {
      if (customerDto.name.trim().length < 2) {
        throw new BadRequestException(
          'O nome deve ter pelo menos 2 caracteres',
        );
      }

      if (customerDto.name.length > 255) {
        throw new BadRequestException(
          'O nome não pode ter mais de 255 caracteres',
        );
      }

      const namePattern = /^[a-zA-ZÀ-ÿ\s]+$/;
      if (!namePattern.test(customerDto.name)) {
        throw new BadRequestException(
          'O nome deve conter apenas letras e espaços',
        );
      }
    }

    if (customerDto.address) {
      if (customerDto.address.trim().length < 10) {
        throw new BadRequestException(
          'O endereço deve ter pelo menos 10 caracteres',
        );
      }

      if (customerDto.address.length > 500) {
        throw new BadRequestException(
          'O endereço não pode ter mais de 500 caracteres',
        );
      }
    }
  }

  private validateCPF(cpf: string): void {
    if (!cpf) return;

    const cleanCPF = cpf.replace(/\D/g, '');

    if (cleanCPF.length !== 11) {
      throw new BadRequestException('CPF deve ter 11 dígitos');
    }

    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      throw new BadRequestException('CPF inválido');
    }

    if (!this.isValidCPF(cleanCPF)) {
      throw new BadRequestException('CPF inválido');
    }
  }

  private isValidCPF(cpf: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    let digit1 = remainder >= 10 ? 0 : remainder;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    let digit2 = remainder >= 10 ? 0 : remainder;

    return (
      digit1 === parseInt(cpf.charAt(9)) && digit2 === parseInt(cpf.charAt(10))
    );
  }

  private validateEmail(email: string): void {
    if (!email) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      throw new BadRequestException('Formato de email inválido');
    }

    if (email.length > 255) {
      throw new BadRequestException(
        'Email não pode ter mais de 255 caracteres',
      );
    }
  }

  private validatePhone(phone: string): void {
    if (!phone) return;

    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw new BadRequestException('Telefone deve ter 10 ou 11 dígitos');
    }

    if (/^(\d)\1+$/.test(cleanPhone)) {
      throw new BadRequestException('Telefone inválido');
    }

    const areaCode = cleanPhone.substring(0, 2);
    const validAreaCodes = [
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '21',
      '22',
      '24',
      '27',
      '28',
      '31',
      '32',
      '33',
      '34',
      '35',
      '37',
      '38',
      '41',
      '42',
      '43',
      '44',
      '45',
      '46',
      '47',
      '48',
      '49',
      '51',
      '53',
      '54',
      '55',
      '61',
      '62',
      '63',
      '64',
      '65',
      '67',
      '68',
      '69',
      '71',
      '73',
      '74',
      '75',
      '77',
      '79',
      '81',
      '87',
      '82',
      '83',
      '84',
      '85',
      '88',
      '86',
      '89',
      '91',
      '93',
      '94',
      '92',
      '97',
      '95',
      '96',
      '98',
      '99',
    ];

    if (!validAreaCodes.includes(areaCode)) {
      throw new BadRequestException('Código de área inválido');
    }
  }

  private async validateUniqueness(
    customerDto: CreateCustomerDto,
  ): Promise<void> {  
    if (customerDto.email) {
      const existingByEmail = await this.customerRepository.findOne({
        where: { email: customerDto.email },
      });

      if (existingByEmail) {
        throw new ConflictException('Já existe um cliente com este email');
      }
    }

    if (customerDto.cpf) {
      const existingByCPF = await this.customerRepository.findOne({
        where: { cpf: customerDto.cpf },
      });

      if (existingByCPF) {
        throw new ConflictException('Já existe um cliente com este CPF');
      }
    }
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find({
      relations: ['orders'],
    });
  }

  async findOne(id: string): Promise<Customer> {
    if (!id) {
      throw new BadRequestException('ID do cliente é obrigatório');
    }

    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['orders'],
    });

    if (!customer) {
      throw new NotFoundException(`Cliente com ID ${id} não encontrado`);
    }

    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);

    await this.validateCustomerUpdate(customer, updateCustomerDto);

    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
  }

  private async validateCustomerUpdate(
    existingCustomer: Customer,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<void> {
    this.validateBasicData(updateCustomerDto);

    if (
      updateCustomerDto.cpf &&
      updateCustomerDto.cpf !== existingCustomer.cpf
    ) {
      this.validateCPF(updateCustomerDto.cpf);
      await this.validateCPFUniqueness(
        updateCustomerDto.cpf,
        existingCustomer.id,
      );
    }

    if (
      updateCustomerDto.email &&
      updateCustomerDto.email !== existingCustomer.email
    ) {
      this.validateEmail(updateCustomerDto.email);
      await this.validateEmailUniqueness(
        updateCustomerDto.email,
        existingCustomer.id,
      );
    }

    if (updateCustomerDto.phone) {
      this.validatePhone(updateCustomerDto.phone);
    }
  }

  private async validateEmailUniqueness(
    email: string,
    excludeId: string,
  ): Promise<void> {
    const existingCustomer = await this.customerRepository.findOne({
      where: { email },
    });

    if (existingCustomer && existingCustomer.id !== excludeId) {
      throw new ConflictException('Já existe um cliente com este email');
    }
  }

  private async validateCPFUniqueness(
    cpf: string,
    excludeId: string,
  ): Promise<void> {
    const existingCustomer = await this.customerRepository.findOne({
      where: { cpf },
    });

    if (existingCustomer && existingCustomer.id !== excludeId) {
      throw new ConflictException('Já existe um cliente com este CPF');
    }
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);

    if (customer.orders && customer.orders.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir um cliente que possui pedidos',
      );
    }

    if (customer.photo) {
      await this.fileUploadService.deleteFile(customer.photo);
    }

    await this.customerRepository.remove(customer);
  }

  async uploadPhoto(id: string, file: Express.Multer.File): Promise<Customer> {
    const customer = await this.findOne(id);

    this.validatePhotoFile(file);

    if (customer.photo) {
      await this.fileUploadService.deleteFile(customer.photo);
    }

    const photoUrl = await this.fileUploadService.uploadFile(file, 'customers');
    customer.photo = photoUrl;

    return await this.customerRepository.save(customer);
  }

  private validatePhotoFile(file: Express.Multer.File): void {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo inválido. Permitidos: JPEG, PNG, WebP',
      );
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Máximo: 5MB');
    }
  }
}
