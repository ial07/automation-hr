import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { documentRepository } from "@/repositories/document.repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestionService } from "@/services/ingestion.service";

const BUCKET_NAME = "hr-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// GET - List all documents
export async function GET() {
  const session = await getSessionFromCookie();

  if (!session || !hasMinimumRole(session.role, "hr")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const documents = await documentRepository.findAll();
    return NextResponse.json({ documents });
  } catch (error) {
    console.error("List documents error:", error);
    return NextResponse.json(
      { error: "Failed to list documents" },
      { status: 500 }
    );
  }
}

// POST - Upload document
export async function POST(request: Request) {
  const session = await getSessionFromCookie();

  if (!session || !hasMinimumRole(session.role, "hr")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const category = formData.get("category") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX are allowed." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Generate unique file path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${session.userId}/${timestamp}_${safeName}`;

    // Upload to storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Create document record
    const document = await documentRepository.create({
      title,
      category: category || undefined,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: session.userId,
    });

    // Start ingestion in background (don't await)
    ingestionService.processDocument(document.id).catch((err) => {
      console.error("Ingestion error for document", document.id, err);
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Upload document error:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}
