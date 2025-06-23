import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileUploadService } from '../shared/services/file-upload.service';
import { Enterprise } from '../enterprise/entities/enterprise.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Enterprise)
    private enterpriseRepository: Repository<Enterprise>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    await this.validateProductCreation(createProductDto);

    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  private async validateProductCreation(
    createProductDto: CreateProductDto,
  ): Promise<void> {
    this.validateBasicData(createProductDto);

    this.validatePrice(createProductDto.price);

    this.validateStock(createProductDto.stock);

    await this.validateEnterpriseExists(createProductDto.enterpriseId);

    await this.validateNameUniqueness(
      createProductDto.name,
      createProductDto.enterpriseId,
    );
  }

  private validateBasicData(
    productDto: CreateProductDto | UpdateProductDto,
  ): void {
    if (productDto.name) {
      if (productDto.name.trim().length < 2) {
        throw new BadRequestException(
          'O nome do produto deve ter pelo menos 2 caracteres',
        );
      }

      if (productDto.name.length > 255) {
        throw new BadRequestException(
          'O nome do produto não pode ter mais de 255 caracteres',
        );
      }

      const namePattern = /^[a-zA-ZÀ-ÿ0-9\s\-_.()]+$/;
      if (!namePattern.test(productDto.name)) {
        throw new BadRequestException(
          'O nome do produto contém caracteres inválidos',
        );
      }
    }

    if (productDto.description) {
      if (productDto.description.trim().length < 10) {
        throw new BadRequestException(
          'A descrição deve ter pelo menos 10 caracteres',
        );
      }

      if (productDto.description.length > 1000) {
        throw new BadRequestException(
          'A descrição não pode ter mais de 1000 caracteres',
        );
      }
    }
  }

  private validatePrice(price: number): void {
    if (price === undefined || price === null) return;

    if (price < 0) {
      throw new BadRequestException('O preço não pode ser negativo');
    }

    if (price === 0) {
      throw new BadRequestException('O preço deve ser maior que zero');
    }

    if (price > 1000000) {
      throw new BadRequestException(
        'O preço não pode ser superior a R$ 1.000.000,00',
      );
    }

    const decimalPlaces = (price.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new BadRequestException(
        'O preço deve ter no máximo 2 casas decimais',
      );
    }
  }

  private validateStock(stock: number): void {
    if (stock === undefined || stock === null) return;

    if (stock < 0) {
      throw new BadRequestException('O estoque não pode ser negativo');
    }

    if (stock > 999999) {
      throw new BadRequestException(
        'O estoque não pode ser superior a 999.999 unidades',
      );
    }
    
    if (!Number.isInteger(stock)) {
      throw new BadRequestException('O estoque deve ser um número inteiro');
    }
  }

  private async validateEnterpriseExists(enterpriseId: string): Promise<void> {
    if (!enterpriseId) return;

    const enterprise = await this.enterpriseRepository.findOne({
      where: { id: enterpriseId },
    });

    if (!enterprise) {
      throw new NotFoundException(
        `Empresa com ID ${enterpriseId} não encontrada`,
      );
    }
  }

  private async validateNameUniqueness(
    name: string,
    enterpriseId: string,
    excludeId?: string,
  ): Promise<void> {
    if (!name || !enterpriseId) return;

    const existingProduct = await this.productRepository.findOne({
      where: { name, enterpriseId },
    });

    if (existingProduct && existingProduct.id !== excludeId) {
      throw new ConflictException(
        'Já existe um produto com este nome nesta empresa',
      );
    }
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: ['enterprise'],
    });
  }

  async findByenterprise(enterpriseId: string): Promise<Product[]> {
    if (!enterpriseId) {
      throw new BadRequestException('ID da empresa é obrigatório');
    }

    await this.validateEnterpriseExists(enterpriseId);

    return await this.productRepository.find({
      where: { enterpriseId },
      relations: ['enterprise'],
    });
  }

  async findOne(id: string): Promise<Product> {
    if (!id) {
      throw new BadRequestException('ID do produto é obrigatório');
    }

    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['enterprise'],
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID ${id} não encontrado`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    await this.validateProductUpdate(product, updateProductDto);

    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  private async validateProductUpdate(
    existingProduct: Product,
    updateProductDto: UpdateProductDto,
  ): Promise<void> {
    this.validateBasicData(updateProductDto);

    if (updateProductDto.price !== undefined) {
      this.validatePrice(updateProductDto.price);
    }

    if (updateProductDto.stock !== undefined) {
      this.validateStock(updateProductDto.stock);
    }

    if (
      updateProductDto.enterpriseId &&
      updateProductDto.enterpriseId !== existingProduct.enterpriseId
    ) {
      await this.validateEnterpriseExists(updateProductDto.enterpriseId);
    }

    if (
      updateProductDto.name &&
      updateProductDto.name !== existingProduct.name
    ) {
      const enterpriseId =
        updateProductDto.enterpriseId || existingProduct.enterpriseId;
      await this.validateNameUniqueness(
        updateProductDto.name,
        enterpriseId,
        existingProduct.id,
      );
    }
  }

  async remove(id: string): Promise<Product> {
    const product = await this.findOne(id);

    if (product.photo) {
      await this.fileUploadService.deleteFile(product.photo);
    }

    await this.productRepository.remove(product);
    return product;
  }

  async uploadPhoto(id: string, file: Express.Multer.File): Promise<Product> {
    const product = await this.findOne(id);

    this.validatePhotoFile(file);

    if (product.photo) {
      await this.fileUploadService.deleteFile(product.photo);
    }

    const photoUrl = await this.fileUploadService.uploadFile(file, 'products');
    product.photo = photoUrl;

    return await this.productRepository.save(product);
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

    if (file.originalname.length > 255) {
      throw new BadRequestException(
        'Nome do arquivo muito longo. Máximo: 255 caracteres',
      );
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Extensão de arquivo inválida. Permitidas: .jpg, .jpeg, .png, .webp',
      );
    }
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);

    if (!Number.isInteger(quantity)) {
      throw new BadRequestException('A quantidade deve ser um número inteiro');
    }

    if (quantity === 0) {
      throw new BadRequestException('A quantidade deve ser diferente de zero');
    }

    const newStock = product.stock + quantity;

    if (newStock < 0) {
      throw new BadRequestException(
        `Estoque insuficiente. Estoque atual: ${product.stock}, Tentativa de redução: ${Math.abs(quantity)}`,
      );
    }

    this.validateStock(newStock);

    product.stock = newStock;
    return await this.productRepository.save(product);
  }

  async validateStockAvailability(
    productId: string,
    requestedQuantity: number,
  ): Promise<void> {
    const product = await this.findOne(productId);

    if (product.stock < requestedQuantity) {
      throw new BadRequestException(
        `Estoque insuficiente para o produto ${product.name}. ` +
          `Disponível: ${product.stock}, Solicitado: ${requestedQuantity}`,
      );
    }
  }

  async reserveStock(productId: string, quantity: number): Promise<void> {
    await this.validateStockAvailability(productId, quantity);
    await this.updateStock(productId, -quantity);
  }

  async releaseStock(productId: string, quantity: number): Promise<void> {
    await this.updateStock(productId, quantity);
  }
}
