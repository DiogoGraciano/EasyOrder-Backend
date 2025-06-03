import { Injectable, NotFoundException } from '@nestjs/common';
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
    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async findAll(): Promise<Customer[]> {
    return await this.customerRepository.find({
      relations: ['orders'],
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

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);

    // Delete photo from R2 if exists
    if (customer.photo) {
      await this.fileUploadService.deleteFile(customer.photo);
    }

    await this.customerRepository.remove(customer);
  }

  async uploadPhoto(id: string, file: Express.Multer.File): Promise<Customer> {
    const customer = await this.findOne(id);

    // Delete old photo if exists
    if (customer.photo) {
      await this.fileUploadService.deleteFile(customer.photo);
    }

    // Upload new photo
    const photoUrl = await this.fileUploadService.uploadFile(file, 'customers');
    customer.photo = photoUrl;

    return await this.customerRepository.save(customer);
  }
}
