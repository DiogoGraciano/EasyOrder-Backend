import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileUploadService } from '../shared/services/file-upload.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: ['company'],
    });
  }

  async findByCompany(companyId: string): Promise<Product[]> {
    return await this.productRepository.find({
      where: { companyId },
      relations: ['company'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);

    if (product.photo) {
      await this.fileUploadService.deleteFile(product.photo);
    }

    await this.productRepository.remove(product);
  }

  async uploadPhoto(id: string, file: Express.Multer.File): Promise<Product> {
    const product = await this.findOne(id);

    if (product.photo) {
      await this.fileUploadService.deleteFile(product.photo);
    }

    const photoUrl = await this.fileUploadService.uploadFile(file, 'products');
    product.photo = photoUrl;

    return await this.productRepository.save(product);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    product.stock += quantity;
    return await this.productRepository.save(product);
  }
}
