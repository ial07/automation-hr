import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

// Debug endpoint to check documents and chunks status
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session) {
    return NextResponse.json({ error: "Please login first" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Count documents by status
  const { data: docStats } = await supabase.from("documents").select("status");

  const documentStats = {
    total: docStats?.length || 0,
    pending: docStats?.filter((d) => d.status === "pending").length || 0,
    processing: docStats?.filter((d) => d.status === "processing").length || 0,
    ready: docStats?.filter((d) => d.status === "ready").length || 0,
    failed: docStats?.filter((d) => d.status === "failed").length || 0,
  };

  // Count chunks
  const { count: chunkCount } = await supabase
    .from("document_chunks")
    .select("*", { count: "exact", head: true });

  // Sample chunks (first 3)
  const { data: sampleChunks } = await supabase
    .from("document_chunks")
    .select("id, document_id, content, token_count")
    .limit(3);

  return NextResponse.json({
    documents: documentStats,
    chunks: {
      total: chunkCount || 0,
      samples:
        sampleChunks?.map((c) => ({
          id: c.id,
          docId: c.document_id,
          preview: c.content?.substring(0, 100) + "...",
          tokens: c.token_count,
        })) || [],
    },
  });
}
