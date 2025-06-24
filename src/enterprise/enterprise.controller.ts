import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { EnterpriseService } from './enterprise.service';
import { CreateEnterpriseDto } from './dto/create-enterprise.dto';
import { UpdateEnterpriseDto } from './dto/update-enterprise.dto';

@Controller('enterprises')
export class EnterpriseController {
  constructor(private readonly enterpriseService: EnterpriseService) {}

  @Post()
  @UseInterceptors(FileInterceptor('logo'))
  create(
    @Body(ValidationPipe) createEnterpriseDto: CreateEnterpriseDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.enterpriseService.create(createEnterpriseDto, file);
  }

  @Get()
  findAll() {
    return this.enterpriseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enterpriseService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('logo'))
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateEnterpriseDto: UpdateEnterpriseDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.enterpriseService.update(id, updateEnterpriseDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enterpriseService.remove(id);
  }

  @Post(':id/logo')
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.enterpriseService.uploadLogo(id, file);
  }
}
