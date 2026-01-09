import OpenAI from "openai";
import { documentChunkRepository } from "@/repositories/documentChunk.repository";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserRole, hasMinimumRole } from "@/lib/auth/roles";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4o-mini";
const MAX_CHUNKS = 5;
const SIMILARITY_THRESHOLD = 0.3;

// Intent types
type QuestionIntent =
  | "HR_POLICY"
  | "EMPLOYEE_SELF_DATA"
  | "HR_OPERATIONAL_DATA";

// System prompts per intent
const SYSTEM_PROMPTS: Record<QuestionIntent, string> = {
  HR_POLICY: `Anda adalah asisten HR profesional berbahasa Indonesia.
Jawab pertanyaan tentang kebijakan HR berdasarkan dokumen yang diberikan.
Gunakan bahasa Indonesia yang formal dan profesional.
Jika kebijakan tidak ditemukan dalam dokumen, jawab: "Kebijakan tersebut tidak ditemukan dalam dokumen HR yang tersedia."`,

  EMPLOYEE_SELF_DATA: `Anda adalah asisten HR profesional berbahasa Indonesia.
Jawab pertanyaan karyawan tentang data pribadi mereka (absensi, cuti, lembur).
Data karyawan sudah disediakan dalam konteks - GUNAKAN data tersebut untuk menjawab.
Berikan jawaban yang ringkas dan langsung ke poin.
Jangan pernah menjawab "informasi tidak tersedia" jika data sudah ada dalam konteks.`,

  HR_OPERATIONAL_DATA: `Anda adalah asisten HR profesional berbahasa Indonesia.
Jawab pertanyaan tentang data operasional HR (statistik tim, tren kehadiran, dll).
Gunakan data yang disediakan untuk memberikan insight.
Jika akses tidak diizinkan, jelaskan batasan akses dengan sopan.`,
};

export type ChatResponse = {
  answer: string;
  documentIds: string[];
  chunkCount: number;
  processingTimeMs: number;
  intent?: QuestionIntent;
};

export const ragService = {
  /**
   * Classify question intent
   */
  classifyIntent(question: string): QuestionIntent {
    const lower = question.toLowerCase();

    // Employee self-data keywords (personal questions)
    const selfDataKeywords = [
      "aku",
      "saya",
      "ku",
      "gue",
      "gw",
      "berapa kali",
      "berapa hari",
      "sisa cuti",
      "apakah aku",
      "apakah saya",
      "terlambat",
      "telat",
      "absen",
      "hadir",
      "cuti saya",
      "lembur saya",
      "cuti ku",
    ];

    if (selfDataKeywords.some((kw) => lower.includes(kw))) {
      return "EMPLOYEE_SELF_DATA";
    }

    // HR operational data keywords (org-wide questions)
    const operationalKeywords = [
      "tim",
      "team",
      "departemen",
      "semua karyawan",
      "total",
      "statistik",
      "trend",
      "rata-rata",
      "siapa yang",
      "karyawan mana",
    ];

    if (operationalKeywords.some((kw) => lower.includes(kw))) {
      return "HR_OPERATIONAL_DATA";
    }

    // Default to HR policy
    return "HR_POLICY";
  },

  /**
   * Generate embedding for a query
   */
  async embedQuery(query: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    return response.data[0].embedding;
  },

  /**
   * Search for relevant document chunks
   */
  async searchRelevantChunks(
    queryEmbedding: number[],
    limit: number = MAX_CHUNKS
  ) {
    return documentChunkRepository.searchSimilar(
      queryEmbedding,
      SIMILARITY_THRESHOLD,
      limit
    );
  },

  /**
   * Get employee self data context
   */
  async getEmployeeSelfDataContext(userId: string): Promise<string> {
    const { attendanceRepository } = await import(
      "@/repositories/attendance.repository"
    );
    const { leaveService } = await import("@/services/leave.service");
    const { overtimeRepository } = await import(
      "@/repositories/overtime.repository"
    );

    const [stats, history, balance, overtimeTotal] = await Promise.all([
      attendanceRepository.getMonthlyStats(userId),
      attendanceRepository.getHistory(userId, 10),
      leaveService.getBalance(userId),
      overtimeRepository.getMonthlyTotal(userId),
    ]);

    const annualRemaining = balance.annual_total - balance.annual_used;
    const sickRemaining = balance.sick_total - balance.sick_used;

    let context = `
DATA KARYAWAN INI (BULAN INI):

STATISTIK KEHADIRAN:
- Hadir tepat waktu: ${stats.present} hari
- Terlambat: ${stats.late} hari
- WFH: ${stats.wfh} hari
- Cuti: ${stats.leave} hari

SALDO CUTI:
- Cuti Tahunan tersisa: ${annualRemaining} dari ${balance.annual_total} hari (terpakai: ${balance.annual_used})
- Cuti Sakit tersisa: ${sickRemaining} dari ${balance.sick_total} hari (terpakai: ${balance.sick_used})

LEMBUR BULAN INI:
- Total jam lembur disetujui: ${overtimeTotal} jam
`;

    if (history.length > 0) {
      context += "\nRIWAYAT KEHADIRAN TERAKHIR:\n";
      history.forEach((h) => {
        const checkIn = h.check_in_time
          ? new Date(h.check_in_time).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-";
        const checkOut = h.check_out_time
          ? new Date(h.check_out_time).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "-";
        const statusLabel =
          h.status === "present"
            ? "Hadir"
            : h.status === "late"
            ? "Terlambat"
            : h.status;
        context += `- ${h.date}: ${statusLabel} (Masuk: ${checkIn}, Pulang: ${checkOut})\n`;
      });
    }

    return context;
  },

  /**
   * Generate answer using LLM
   */
  async generateAnswer(
    question: string,
    context: string,
    intent: QuestionIntent
  ): Promise<string> {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS[intent] },
        {
          role: "user",
          content: `KONTEKS:\n${context}\n\nPERTANYAAN:\n${question}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return (
      response.choices[0]?.message?.content ||
      "Maaf, tidak dapat menghasilkan jawaban."
    );
  },

  /**
   * Full RAG pipeline with intent classification
   */
  async chat(
    question: string,
    userId: string,
    userRole?: UserRole
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    // Step 1: Classify intent
    const intent = this.classifyIntent(question);
    console.log(
      `[RAG] Intent: ${intent} for question: "${question.substring(0, 50)}..."`
    );

    let context = "";
    let chunks: { content: string; document_id: string }[] = [];

    // Step 2: Build context based on intent
    switch (intent) {
      case "EMPLOYEE_SELF_DATA":
        // Get personal data - always allowed for own data
        context = await this.getEmployeeSelfDataContext(userId);
        break;

      case "HR_OPERATIONAL_DATA":
        // Check role access
        if (!userRole || !hasMinimumRole(userRole, "manager")) {
          return {
            answer:
              "Maaf, Anda tidak memiliki akses untuk melihat data operasional HR. Fitur ini hanya tersedia untuk Manager, HR, dan Owner.",
            documentIds: [],
            chunkCount: 0,
            processingTimeMs: Date.now() - startTime,
            intent,
          };
        }
        // Get org-wide stats
        const { intelligenceService } = await import(
          "@/services/intelligence.service"
        );
        const insights = await intelligenceService.getComprehensiveInsights();
        context = `DATA OPERASIONAL HR (30 HARI TERAKHIR):
- Total kehadiran tepat waktu: ${insights.attendance.totalPresent}
- Total keterlambatan: ${insights.attendance.totalLate}
- Compliance rate: ${insights.attendance.complianceRate}%
- Total cuti diambil: ${insights.leave.totalDaysTaken} hari
- Total lembur disetujui: ${insights.overtime.totalHours} jam
- Karyawan butuh perhatian: ${insights.flags.length} orang`;
        break;

      case "HR_POLICY":
      default:
        // Search documents
        const queryEmbedding = await this.embedQuery(question);
        chunks = await this.searchRelevantChunks(queryEmbedding);

        if (chunks.length > 0) {
          context = chunks
            .map((c, i) => `[Dokumen ${i + 1}]\n${c.content}`)
            .join("\n\n---\n\n");
        } else {
          context = "Tidak ada dokumen HR yang relevan ditemukan.";
        }
        break;
    }

    // Step 3: Generate answer
    const answer = await this.generateAnswer(question, context, intent);

    // Step 4: Get unique document IDs
    const documentIds = [...new Set(chunks.map((c) => c.document_id))];
    const processingTimeMs = Date.now() - startTime;

    // Step 5: Log interaction
    await this.logInteraction({
      userId,
      question,
      answer,
      documentIds,
      chunkCount: chunks.length,
      processingTimeMs,
    });

    return {
      answer,
      documentIds,
      chunkCount: chunks.length,
      processingTimeMs,
      intent,
    };
  },

  /**
   * Log chat interaction for audit
   */
  async logInteraction(data: {
    userId: string;
    question: string;
    answer: string;
    documentIds: string[];
    chunkCount: number;
    processingTimeMs: number;
  }): Promise<void> {
    const supabase = createAdminClient();

    await supabase.from("chat_logs").insert({
      user_id: data.userId,
      question: data.question,
      answer: data.answer,
      document_ids: data.documentIds,
      chunk_count: data.chunkCount,
      processing_time_ms: data.processingTimeMs,
    });
  },
};
