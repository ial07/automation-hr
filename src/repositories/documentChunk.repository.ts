import { createAdminClient } from "@/lib/supabase/admin";

export type DocumentChunk = {
  id: string;
  document_id: string;
  content: string;
  embedding: number[] | null;
  token_count: number | null;
  chunk_index: number;
  created_at: string;
};

export type CreateChunkInput = {
  document_id: string;
  content: string;
  embedding: number[];
  token_count: number;
  chunk_index: number;
};

const supabase = createAdminClient();

export const documentChunkRepository = {
  async createMany(chunks: CreateChunkInput[]): Promise<void> {
    const { error } = await supabase.from("document_chunks").insert(chunks);

    if (error) throw new Error(`Failed to create chunks: ${error.message}`);
  },

  async findByDocumentId(documentId: string): Promise<DocumentChunk[]> {
    const { data, error } = await supabase
      .from("document_chunks")
      .select("*")
      .eq("document_id", documentId)
      .order("chunk_index", { ascending: true });

    if (error) throw new Error(`Failed to fetch chunks: ${error.message}`);
    return data || [];
  },

  async deleteByDocumentId(documentId: string): Promise<void> {
    const { error } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    if (error) throw new Error(`Failed to delete chunks: ${error.message}`);
  },

  async searchSimilar(
    queryEmbedding: number[],
    matchThreshold: number = 0.7,
    matchCount: number = 5
  ): Promise<
    { id: string; document_id: string; content: string; similarity: number }[]
  > {
    // Format embedding as string for pgvector
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    console.log(
      "[searchSimilar] Calling RPC with threshold:",
      matchThreshold,
      "count:",
      matchCount
    );

    const { data, error } = await supabase.rpc("match_document_chunks", {
      query_embedding: embeddingStr,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error("[searchSimilar] RPC error:", error);
      throw new Error(`Failed to search chunks: ${error.message}`);
    }

    console.log("[searchSimilar] Found chunks:", data?.length || 0);
    return data || [];
  },
};
