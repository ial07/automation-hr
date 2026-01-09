import {
  documentRepository,
  CreateDocumentInput,
  Document,
} from "@/repositories/document.repository";
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();
const BUCKET_NAME = "hr-documents";

export const documentService = {
  async uploadFile(
    file: File,
    userId: string,
    title: string,
    category?: string
  ): Promise<Document> {
    // Generate unique file path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${userId}/${timestamp}_${safeName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Create document record
    const input: CreateDocumentInput = {
      title,
      category,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: userId,
    };

    return documentRepository.create(input);
  },

  async getSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // 1 hour

    if (error) throw new Error(`Failed to get signed URL: ${error.message}`);
    return data.signedUrl;
  },

  async getFileBuffer(filePath: string): Promise<ArrayBuffer> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (error) throw new Error(`Failed to download file: ${error.message}`);
    return data.arrayBuffer();
  },

  async deleteDocument(id: string): Promise<void> {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new Error("Document not found");

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([doc.file_path]);

    if (storageError) {
      console.error("Failed to delete file from storage:", storageError);
    }

    // Delete document (chunks cascade deleted)
    await documentRepository.delete(id);
  },

  listDocuments: documentRepository.findAll,
  getDocument: documentRepository.findById,
};
