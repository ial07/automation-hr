// pdf-parse doesn't have proper ESM exports, use dynamic import
import mammoth from "mammoth";
import { getEncoding } from "js-tiktoken";
import OpenAI from "openai";
import { documentRepository } from "@/repositories/document.repository";
import {
  documentChunkRepository,
  CreateChunkInput,
} from "@/repositories/documentChunk.repository";
import { documentService } from "./document.service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CHUNK_SIZE = 400; // tokens
const CHUNK_OVERLAP = 50; // tokens
const EMBEDDING_MODEL = "text-embedding-3-small";

export const ingestionService = {
  /**
   * Process a document: extract text, chunk, embed, store
   */
  async processDocument(documentId: string): Promise<void> {
    try {
      // Update status to processing
      await documentRepository.updateStatus(documentId, "processing");

      // Get document
      const doc = await documentRepository.findById(documentId);
      if (!doc) throw new Error("Document not found");

      // Download file
      const buffer = await documentService.getFileBuffer(doc.file_path);

      // Extract text based on mime type
      let text: string;
      if (doc.mime_type === "application/pdf") {
        text = await this.extractPdfText(buffer);
      } else if (
        doc.mime_type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        text = await this.extractDocxText(buffer);
      } else {
        throw new Error(`Unsupported file type: ${doc.mime_type}`);
      }

      // Clean and normalize text
      text = this.cleanText(text);

      if (!text || text.length < 10) {
        throw new Error("Could not extract meaningful text from document");
      }

      // Split into chunks
      const chunks = this.chunkText(text);

      // Generate embeddings
      const embeddings = await this.generateEmbeddings(
        chunks.map((c) => c.content)
      );

      // Store chunks with embeddings
      const chunkInputs: CreateChunkInput[] = chunks.map((chunk, index) => ({
        document_id: documentId,
        content: chunk.content,
        embedding: embeddings[index],
        token_count: chunk.tokenCount,
        chunk_index: index,
      }));

      await documentChunkRepository.createMany(chunkInputs);

      // Update status to ready
      await documentRepository.updateStatus(documentId, "ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await documentRepository.updateStatus(documentId, "failed", message);
      throw error;
    }
  },

  async extractPdfText(buffer: ArrayBuffer): Promise<string> {
    // pdf-parse ESM compatibility workaround
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = (await import("pdf-parse")) as any;
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const data = await pdfParse(Buffer.from(buffer));
    return data.text;
  },

  async extractDocxText(buffer: ArrayBuffer): Promise<string> {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    return result.value;
  },

  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/\s+/g, " ")
      .replace(/[^\S\n]+/g, " ")
      .trim();
  },

  chunkText(text: string): { content: string; tokenCount: number }[] {
    const enc = getEncoding("cl100k_base"); // GPT-4 compatible encoding
    const tokens = enc.encode(text);
    const chunks: { content: string; tokenCount: number }[] = [];

    let start = 0;
    while (start < tokens.length) {
      const end = Math.min(start + CHUNK_SIZE, tokens.length);
      const chunkTokens = tokens.slice(start, end);
      // js-tiktoken decode returns string directly
      const content = enc.decode(chunkTokens);

      chunks.push({
        content: content.trim(),
        tokenCount: chunkTokens.length,
      });

      start = end - CHUNK_OVERLAP;
      if (start >= tokens.length - CHUNK_OVERLAP) break;
    }

    return chunks;
  },

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    const batchSize = 20;

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: batch,
      });

      embeddings.push(...response.data.map((d) => d.embedding));

      // Rate limiting: small delay between batches
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return embeddings;
  },

  async generateQueryEmbedding(query: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    return response.data[0].embedding;
  },
};
