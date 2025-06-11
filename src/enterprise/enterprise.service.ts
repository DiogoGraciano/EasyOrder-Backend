import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enterprise } from './entities/enterprise.entity';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';
import { FileUploadService } from '../shared/services/file-upload.service';

@Injectable()
export class EnterpriseService {
  constructor(
    @InjectRepository(Enterprise)
    private enterpriseRepository: Repository<Enterprise>,
    private fileUploadService: FileUploadService,
  ) {}

  async create(createEnterpriseDto: CreateEnterpriseDto): Promise<Enterprise> {
    // Validações personalizadas
    await this.validateEnterpriseCreation(createEnterpriseDto);

    const enterprise = this.enterpriseRepository.create(createEnterpriseDto);
    return await this.enterpriseRepository.save(enterprise);
  }

  private async validateEnterpriseCreation(
    createEnterpriseDto: CreateEnterpriseDto,
  ): Promise<void> {
    // Validar dados básicos
    this.validateBasicData(createEnterpriseDto);

    // Validar CNPJ
    this.validateCNPJ(createEnterpriseDto.cnpj);

    // Validar data de fundação
    this.validateFoundationDate(createEnterpriseDto.foundationDate);

    // Validar unicidade
    await this.validateUniqueness(createEnterpriseDto);
  }

  private validateBasicData(
    enterpriseDto: CreateEnterpriseDto | UpdateEnterpriseDto,
  ): void {
    // Validar razão social
    if (enterpriseDto.legalName) {
      if (enterpriseDto.legalName.trim().length < 3) {
        throw new BadRequestException(
          'A razão social deve ter pelo menos 3 caracteres',
        );
      }

      if (enterpriseDto.legalName.length > 255) {
        throw new BadRequestException(
          'A razão social não pode ter mais de 255 caracteres',
        );
      }
    }

    // Validar nome fantasia
    if (enterpriseDto.tradeName) {
      if (enterpriseDto.tradeName.trim().length < 2) {
        throw new BadRequestException(
          'O nome fantasia deve ter pelo menos 2 caracteres',
        );
      }

      if (enterpriseDto.tradeName.length > 255) {
        throw new BadRequestException(
          'O nome fantasia não pode ter mais de 255 caracteres',
        );
      }
    }

    // Validar endereço
    if (enterpriseDto.address) {
      if (enterpriseDto.address.trim().length < 10) {
        throw new BadRequestException(
          'O endereço deve ter pelo menos 10 caracteres',
        );
      }

      if (enterpriseDto.address.length > 500) {
        throw new BadRequestException(
          'O endereço não pode ter mais de 500 caracteres',
        );
      }
    }
  }

  private validateCNPJ(cnpj: string): void {
    if (!cnpj) return;

    // Remover caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Validar formato
    if (cleanCNPJ.length !== 14) {
      throw new BadRequestException('CNPJ deve ter 14 dígitos');
    }

    // Validar se não são todos os dígitos iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
      throw new BadRequestException('CNPJ inválido');
    }

    // Validar dígitos verificadores
    if (!this.isValidCNPJ(cleanCNPJ)) {
      throw new BadRequestException('CNPJ inválido');
    }
  }

  private isValidCNPJ(cnpj: string): boolean {
    // Primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;

    // Segundo dígito verificador
    sum = 0;
    weight = 6;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    return (
      digit1 === parseInt(cnpj.charAt(12)) &&
      digit2 === parseInt(cnpj.charAt(13))
    );
  }

  private validateFoundationDate(foundationDate: string): void {
    if (!foundationDate) return;

    const date = new Date(foundationDate);
    const today = new Date();

    // Não permitir datas futuras
    if (date > today) {
      throw new BadRequestException(
        'A data de fundação não pode ser no futuro',
      );
    }

    // Não permitir datas muito antigas (mais de 200 anos)
    const maxYearsOld = 200;
    const diffYears = today.getFullYear() - date.getFullYear();

    if (diffYears > maxYearsOld) {
      throw new BadRequestException(
        `A data de fundação não pode ser anterior a ${maxYearsOld} anos`,
      );
    }

    // Não permitir datas muito recentes (pelo menos 1 dia)
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      throw new BadRequestException(
        'A data de fundação deve ser pelo menos 1 dia no passado',
      );
    }
  }

  private async validateUniqueness(
    enterpriseDto: CreateEnterpriseDto,
  ): Promise<void> {
    // Verificar CNPJ único
    if (enterpriseDto.cnpj) {
      const existingByCNPJ = await this.enterpriseRepository.findOne({
        where: { cnpj: enterpriseDto.cnpj },
      });

      if (existingByCNPJ) {
        throw new ConflictException('Já existe uma empresa com este CNPJ');
      }
    }

    // Verificar razão social única
    if (enterpriseDto.legalName) {
      const existingByLegalName = await this.enterpriseRepository.findOne({
        where: { legalName: enterpriseDto.legalName },
      });

      if (existingByLegalName) {
        throw new ConflictException(
          'Já existe uma empresa com esta razão social',
        );
      }
    }
  }

  async findAll(): Promise<Enterprise[]> {
    return await this.enterpriseRepository.find();
  }

  async findOne(id: string): Promise<Enterprise> {
    if (!id) {
      throw new BadRequestException('ID da empresa é obrigatório');
    }

    const enterprise = await this.enterpriseRepository.findOne({
      where: { id },
      relations: ['orders', 'products'],
    });

    if (!enterprise) {
      throw new NotFoundException(`Empresa com ID ${id} não encontrada`);
    }

    return enterprise;
  }

  async update(
    id: string,
    updateEnterpriseDto: UpdateEnterpriseDto,
  ): Promise<Enterprise> {
    const enterprise = await this.findOne(id);

    // Validações para atualização
    await this.validateEnterpriseUpdate(enterprise, updateEnterpriseDto);

    Object.assign(enterprise, updateEnterpriseDto);
    return await this.enterpriseRepository.save(enterprise);
  }

  private async validateEnterpriseUpdate(
    existingEnterprise: Enterprise,
    updateEnterpriseDto: UpdateEnterpriseDto,
  ): Promise<void> {
    // Validar dados básicos
    this.validateBasicData(updateEnterpriseDto);

    // Validar CNPJ se alterado
    if (
      updateEnterpriseDto.cnpj &&
      updateEnterpriseDto.cnpj !== existingEnterprise.cnpj
    ) {
      this.validateCNPJ(updateEnterpriseDto.cnpj);
      await this.validateCNPJUniqueness(
        updateEnterpriseDto.cnpj,
        existingEnterprise.id,
      );
    }

    // Validar razão social se alterada
    if (
      updateEnterpriseDto.legalName &&
      updateEnterpriseDto.legalName !== existingEnterprise.legalName
    ) {
      await this.validateLegalNameUniqueness(
        updateEnterpriseDto.legalName,
        existingEnterprise.id,
      );
    }

    // Validar data de fundação se alterada
    if (updateEnterpriseDto.foundationDate) {
      this.validateFoundationDate(updateEnterpriseDto.foundationDate);
    }
  }

  private async validateCNPJUniqueness(
    cnpj: string,
    excludeId: string,
  ): Promise<void> {
    const existingEnterprise = await this.enterpriseRepository.findOne({
      where: { cnpj },
    });

    if (existingEnterprise && existingEnterprise.id !== excludeId) {
      throw new ConflictException('Já existe uma empresa com este CNPJ');
    }
  }

  private async validateLegalNameUniqueness(
    legalName: string,
    excludeId: string,
  ): Promise<void> {
    const existingEnterprise = await this.enterpriseRepository.findOne({
      where: { legalName },
    });

    if (existingEnterprise && existingEnterprise.id !== excludeId) {
      throw new ConflictException(
        'Já existe uma empresa com esta razão social',
      );
    }
  }

  async remove(id: string): Promise<void> {
    const enterprise = await this.findOne(id);

    // Verificar se a empresa tem produtos
    if (enterprise.products && enterprise.products.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma empresa que possui produtos',
      );
    }

    // Verificar se a empresa tem pedidos
    if (enterprise.orders && enterprise.orders.length > 0) {
      throw new BadRequestException(
        'Não é possível excluir uma empresa que possui pedidos',
      );
    }

    if (enterprise.logo) {
      await this.fileUploadService.deleteFile(enterprise.logo);
    }

    await this.enterpriseRepository.remove(enterprise);
  }

  async uploadLogo(id: string, file: Express.Multer.File): Promise<Enterprise> {
    const enterprise = await this.findOne(id);

    // Validar arquivo
    this.validateLogoFile(file);

    if (enterprise.logo) {
      await this.fileUploadService.deleteFile(enterprise.logo);
    }

    const logoUrl = await this.fileUploadService.uploadFile(
      file,
      'enterprises',
    );
    enterprise.logo = logoUrl;

    return await this.enterpriseRepository.save(enterprise);
  }

  private validateLogoFile(file: Express.Multer.File): void {
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Tipo de arquivo inválido. Permitidos: JPEG, PNG, WebP',
      );
    }

    // Validar tamanho (10MB para logos)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Arquivo muito grande. Máximo: 10MB');
    }

    // Validar nome do arquivo
    if (file.originalname.length > 255) {
      throw new BadRequestException(
        'Nome do arquivo muito longo. Máximo: 255 caracteres',
      );
    }
  }
}
