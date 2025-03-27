import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './entities/template.entity';
import { readFile, writeFile } from 'fs/promises';
import { PDFDocument, rgb } from 'pdf-lib';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as path from 'path';

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
    if (!userId) throw new BadRequestException('User ID is required.');

    const userExists = await this.templatesRepository.manager.findOne('users', {
      where: { id: userId },
    });
    if (!userExists)
      throw new NotFoundException(`User with ID ${userId} not found.`);

    const template = this.templatesRepository.create({
      name,
      filePath,
      user: { id: userId },
      placeholders,
    });
    await this.templatesRepository.save(template);
    return { message: 'Template created successfully.', template };
  }

  async getAllTemplates() {
    const templates = await this.templatesRepository.find({
      relations: ['user'],
    });
    if (!templates.length) throw new NotFoundException('No templates found.');
    return { message: 'Templates retrieved successfully.', templates };
  }

  async getTemplateById(id: number) {
    const template = await this.templatesRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!template)
      throw new NotFoundException(`Template with ID ${id} not found.`);
    return { message: 'Template retrieved successfully.', template };
  }

  async deleteTemplate(id: number) {
    const result = await this.templatesRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(
        `Template with ID ${id} could not be deleted.`,
      );
    return { message: `Template with ID ${id} deleted successfully.` };
  }

  async extractText(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') return this.extractTextFromPDF(filePath);
    if (ext === '.docx') return this.extractTextFromDocx(filePath);
    throw new BadRequestException('Unsupported file format.');
  }

  private async extractTextFromPDF(filePath: string) {
    const parsedData = await pdfParse(await readFile(filePath));
    return {
      message: 'PDF text extracted successfully.',
      text: parsedData.text,
      pages: parsedData.numpages,
    };
  }

  private async extractTextFromDocx(filePath: string) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const estimatedPages = Math.ceil(result.value.length / 2500) || 1;
      return {
        message: 'DOCX text extracted successfully.',
        text: result.value,
        pages: estimatedPages,
      };
    } catch (error) {
      console.error('Error extracting text from DOCX:', error);
      throw new BadRequestException('Failed to extract text from DOCX file.');
    }
  }

  async redactFile(filePath: string, edits: { page?: number; text: string }[]) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') return this.redactPDF(filePath, edits);
    if (ext === '.docx') return this.redactDocx(filePath, edits);
    throw new BadRequestException('Unsupported file format.');
  }

  private async redactPDF(
    filePath: string,
    edits: { page?: number; text: string }[],
  ) {
    const pdfDoc = await PDFDocument.load(await readFile(filePath));
    edits.forEach((edit) => {
      const page = pdfDoc.getPage((edit.page ?? 1) - 1);
      const { height } = page.getSize();
      page.drawRectangle({
        x: 50,
        y: height - 150,
        width: 200,
        height: 100,
        color: rgb(1, 0, 0),
      });
    });
    const newFilePath = filePath.replace('.pdf', '_redacted.pdf');
    await writeFile(newFilePath, await pdfDoc.save());
    return { message: 'Redacted PDF created successfully.', newFilePath };
  }

  private async redactDocx(filePath: string, edits: { text: string }[]) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      let modifiedText = result.value;
      edits.forEach((edit) => {
        modifiedText = modifiedText.replace(
          new RegExp(edit.text, 'gi'),
          '[REDACTED]',
        );
      });
      const newFilePath = filePath.replace('.docx', '_redacted.docx');
      await writeFile(newFilePath, modifiedText, 'utf-8');
      return { message: 'Redacted DOCX created successfully.', newFilePath };
    } catch (error) {
      console.error('Error redacting DOCX:', error);
      throw new BadRequestException('Failed to redact DOCX file.');
    }
  }
}