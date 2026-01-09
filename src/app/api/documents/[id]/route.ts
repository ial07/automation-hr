import { NextResponse } from "next/server";
import { getSessionFromCookie } from "@/lib/auth/jwt";
import { hasMinimumRole } from "@/lib/auth/roles";
import { documentRepository } from "@/repositories/document.repository";
import { documentService } from "@/services/document.service";

type RouteParams = { params: Promise<{ id: string }> };

// GET - Get document details
export async function GET(request: Request, { params }: RouteParams) {
  const session = await getSessionFromCookie();

  if (!session || !hasMinimumRole(session.role, "hr")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const document = await documentRepository.findById(id);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Get signed URL for file access
    const signedUrl = await documentService.getSignedUrl(document.file_path);

    return NextResponse.json({ document, signedUrl });
  } catch (error) {
    console.error("Get document error:", error);
    return NextResponse.json(
      { error: "Failed to get document" },
      { status: 500 }
    );
  }
}

// DELETE - Delete document and chunks
export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getSessionFromCookie();

  if (!session || !hasMinimumRole(session.role, "hr")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await documentService.deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
