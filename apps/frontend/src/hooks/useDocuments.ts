"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Document = {
  id: string;
  title: string;
  category: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  status: "pending" | "processing" | "ready" | "failed";
  error_message: string | null;
  created_at: string;
};

async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch documents");
  const data = await res.json();
  return data.documents;
}

async function uploadDocument(formData: FormData): Promise<Document> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, { credentials: "include",
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to upload document");
  }
  return (await res.json()).document;
}

async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`, { credentials: "include", method: "DELETE" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete document");
  }
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
