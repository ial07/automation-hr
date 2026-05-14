import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  Body,
  BadRequestException,
  ForbiddenException,
  Req
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard, JwtPayload } from '../../core/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  private checkHrOrManager(req: Request) {
    const user = (req as any).user as JwtPayload;
    if (user.role !== 'hr' && user.role !== 'owner') {
      throw new ForbiddenException('Only HR and Owners can manage documents');
    }
    return user;
  }

  @Get()
  async getAllDocuments(@Req() req: Request) {
    this.checkHrOrManager(req);
    const documents = await this.documentsService.getAllDocuments();
    return { documents };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
    @Body('category') category?: string,
  ) {
    this.checkHrOrManager(req);
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const document = await this.documentsService.processAndStoreDocument(file, title || file.originalname, category);
    return { document };
  }

  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @Req() req: Request) {
    this.checkHrOrManager(req);
    await this.documentsService.deleteDocument(id);
    return { message: 'Document deleted successfully' };
  }
}
