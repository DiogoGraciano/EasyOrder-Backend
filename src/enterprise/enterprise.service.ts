import { Injectable, NotFoundException } from '@nestjs/common';
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
    const enterprise = this.enterpriseRepository.create(createEnterpriseDto);
    return await this.enterpriseRepository.save(enterprise);
  }

  async findAll(): Promise<Enterprise[]> {
    return await this.enterpriseRepository.find({
      relations: ['orders', 'products'],
    });
  }

  async findOne(id: string): Promise<Enterprise> {
    const enterprise = await this.enterpriseRepository.findOne({
      where: { id },
      relations: ['orders', 'products'],
    });

    if (!enterprise) {
      throw new NotFoundException(`Enterprise with ID ${id} not found`);
    }

    return enterprise;
  }

  async update(
    id: string,
    updateEnterpriseDto: UpdateEnterpriseDto,
  ): Promise<Enterprise> {
    const enterprise = await this.findOne(id);
    Object.assign(enterprise, updateEnterpriseDto);
    return await this.enterpriseRepository.save(enterprise);
  }

  async remove(id: string): Promise<void> {
    const enterprise = await this.findOne(id);

    if (enterprise.logo) {
      await this.fileUploadService.deleteFile(enterprise.logo);
    }

    await this.enterpriseRepository.remove(enterprise);
  }

  async uploadLogo(id: string, file: Express.Multer.File): Promise<Enterprise> {
    const enterprise = await this.findOne(id);

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
}
