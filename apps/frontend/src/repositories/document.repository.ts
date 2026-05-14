import { createAdminClient } from "@/lib/supabase/admin";

export type Document = {
  id: string;
  title: string;
  category: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  status: "pending" | "processing" | "ready" | "failed";
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateDocumentInput = {
  title: string;
  category?: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by: string;
};

const supabase = createAdminClient();

export const documentRepository = {
  async create(input: CreateDocumentInput): Promise<Document> {
    const { data, error } = await supabase
      .from("documents")
      .insert(input)
      .select()
      .single();

    if (error) throw new Error(`Failed to create document: ${error.message}`);
    return data;
  },

  async findById(id: string): Promise<Document | null> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data;
  },

  async findAll(): Promise<Document[]> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to fetch documents: ${error.message}`);
    return data || [];
  },

  async updateStatus(
    id: string,
    status: Document["status"],
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase
      .from("documents")
      .update({ status, error_message: errorMessage || null })
      .eq("id", id);

    if (error)
      throw new Error(`Failed to update document status: ${error.message}`);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("documents").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);
  },
};
