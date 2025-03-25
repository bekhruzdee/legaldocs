import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  Delete,
  Get,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/role.guard';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { name: string; userId: number; placeholders: string },
  ) {
    const placeholders = JSON.parse(body.placeholders);
    return this.templatesService.createTemplate(
      body.name,
      file.path,
      body.userId,
      placeholders,
    );
  }

  @Get('all')
  @UseGuards(AuthGuard)
  async getAllTemplates() {
    return this.templatesService.getAllTemplates();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getTemplateById(@Param('id') id: number) {
    return this.templatesService.getTemplateById(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  async deleteTemplate(@Param('id') id: number) {
    return this.templatesService.deleteTemplate(id);
  }
}
