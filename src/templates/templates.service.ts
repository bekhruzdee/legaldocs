import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
  ) {}

  async createTemplate(
    name: string,
    filePath: string,
    userId: number,
    placeholders: Record<string, string>,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required❌');
    }

    const userExists = await this.templatesRepository.manager.findOne('users', {
      where: { id: userId },
    });

    if (!userExists) {
      throw new NotFoundException(`User with ID ${userId} not found❌`);
    }

    const template = this.templatesRepository.create({
      name,
      filePath,
      user: { id: userId },
      placeholders,
    });

    await this.templatesRepository.save(template);
    return { message: 'Template created successfully✅', template };
  }

  async getAllTemplates() {
    const templates = await this.templatesRepository.find({
      relations: ['user'],
    });
    if (!templates.length) {
      throw new NotFoundException('No templates found❌');
    }
    return { message: 'Templates retrieved successfully✅', templates };
  }

  async getTemplateById(id: number) {
    const template = await this.templatesRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found❌`);
    }
    return { message: 'Template retrieved successfully✅', template };
  }

  async deleteTemplate(id: number) {
    const result = await this.templatesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Unable to delete template with ID ${id}❌`);
    }
    return { message: `Template with ID ${id} deleted successfully✅` };
  }
}
