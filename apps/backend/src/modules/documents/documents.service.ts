import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

dotenv.config({ override: true });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAllDocuments() {
    return this.prisma.document.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async deleteDocument(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
  }

  async processAndStoreDocument(file: Express.Multer.File, title: string, category?: string) {
    // 1. Create Document Record with pending status
    const document = await this.prisma.document.create({
      data: {
        title: title || file.originalname,
        category: category || null,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        status: 'processing',
      },
    });

    try {
      // 2. Extract Text
      let extractedText = '';
      if (file.mimetype === 'application/pdf') {
        const data = await pdfParse(file.buffer);
        extractedText = data.text;
      } else if (
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.mimetype === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value;
      } else if (file.mimetype === 'text/plain' || file.mimetype === 'text/csv' || file.mimetype === 'application/json') {
        extractedText = file.buffer.toString('utf-8');
      } else {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      if (!extractedText.trim()) {
        throw new Error('Could not extract text from document');
      }

      // 3. Chunk the Text
      const chunks = this.chunkText(extractedText, 1000); // ~1000 chars per chunk
      
      this.logger.log(`Extracted ${chunks.length} chunks from ${file.originalname}`);

      // 4. Generate Embeddings and Store
      for (const chunk of chunks) {
        if (!chunk.trim()) continue;

        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        });

        const embedding = response.data[0].embedding;
        const vectorStr = JSON.stringify(embedding);

        // Calculate a rough token count based on words (can be optimized)
        const tokenCount = Math.ceil(chunk.split(' ').length * 1.3);

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO document_chunks (document_id, content, token_count, embedding) 
          VALUES ('${document.id}', $1, $2, '${vectorStr}')
        `, chunk, tokenCount);
      }

      // 5. Update Status to Ready
      return await this.prisma.document.update({
        where: { id: document.id },
        data: { status: 'ready' },
      });

    } catch (error: any) {
      this.logger.error(`Failed to process document ${document.id}`, error.stack);
      
      // Update Status to Failed
      await this.prisma.document.update({
        where: { id: document.id },
        data: { 
          status: 'failed',
          error_message: error.message || 'Unknown error during processing',
        },
      });

      throw new InternalServerErrorException(error.message || 'Failed to process document');
    }
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const words = text.split(/\\s+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const word of words) {
      if (currentChunk.length + word.length > chunkSize) {
        chunks.push(currentChunk.trim());
        currentChunk = word + ' ';
      } else {
        currentChunk += word + ' ';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}
