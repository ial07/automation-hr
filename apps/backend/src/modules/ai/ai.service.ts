import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AttendanceService } from '../attendance/attendance.service';
import { LeaveService } from '../leave/leave.service';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-4o-mini';
const SIMILARITY_THRESHOLD = 0.3;
const MAX_CHUNKS = 5;

type QuestionIntent =
  | 'HR_POLICY'
  | 'EMPLOYEE_SELF_DATA'
  | 'OTHER_EMPLOYEE_DATA'
  | 'HR_OPERATIONAL_DATA';

const SYSTEM_PROMPTS: Record<QuestionIntent, string> = {
  HR_POLICY: `Anda adalah asisten HR profesional berbahasa Indonesia.
Jawab pertanyaan tentang kebijakan HR berdasarkan informasi yang diberikan.
Gunakan bahasa Indonesia yang formal dan profesional.
Berikan jawaban yang informatif dan membantu.`,

  EMPLOYEE_SELF_DATA: `Anda adalah asisten HR profesional berbahasa Indonesia.
Jawab pertanyaan karyawan tentang data pribadi mereka (absensi, cuti, lembur) ATAU prosedur/kebijakan perusahaan yang berkaitan dengan mereka.
Konteks yang diberikan mungkin berisi "DATA KARYAWAN" dan "REFERENSI KEBIJAKAN HR".
Gunakan kedua sumber data tersebut untuk memberikan jawaban yang akurat, ringkas, dan langsung ke poin.`,

  OTHER_EMPLOYEE_DATA: `Anda adalah asisten HR profesional berbahasa Indonesia.
Jawab pertanyaan tentang data karyawan lain berdasarkan konteks yang diberikan.
Hanya berikan informasi yang relevan dan sesuai kebijakan privasi.
Gunakan bahasa formal dan profesional.`,

  HR_OPERATIONAL_DATA: `Anda adalah asisten HR profesional berbahasa Indonesia.
Jawab pertanyaan tentang data operasional HR (statistik tim, tren kehadiran, dll).
Gunakan data yang disediakan untuk memberikan insight.`,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger('AiService');

  constructor(
    private prisma: PrismaService,
    private attendanceService: AttendanceService,
    private leaveService: LeaveService,
  ) {}

  // ─── Intent Classification ──────────────────────────────────────────────────

  private classifyIntent(question: string): QuestionIntent {
    const lower = question.toLowerCase();

    const selfKeywords = ['saya', 'aku', 'ku', 'gue', 'gw', 'sisa cuti', 'terlambat', 'telat', 'absen saya', 'cuti saya', 'lembur saya'];
    if (selfKeywords.some((kw) => lower.includes(kw))) return 'EMPLOYEE_SELF_DATA';

    const operationalKeywords = ['tim', 'team', 'semua karyawan', 'total', 'statistik', 'trend', 'rata-rata', 'siapa yang'];
    if (operationalKeywords.some((kw) => lower.includes(kw))) return 'HR_OPERATIONAL_DATA';

    return 'HR_POLICY';
  }

  // ─── Employee Self Data Context ─────────────────────────────────────────────

  private async buildSelfDataContext(userId: string): Promise<string> {
    const [attendanceData, balanceData, monthlyStats] = await Promise.all([
      this.attendanceService.getMyAttendance(userId),
      this.leaveService.getBalance(userId),
      this.attendanceService.getMonthlyStats(userId),
    ]);

    const { balance, remaining } = balanceData;

    let context = `
DATA KARYAWAN (BULAN INI):

STATISTIK KEHADIRAN BULAN INI:
- Hadir tepat waktu: ${monthlyStats.present} hari
- Terlambat: ${monthlyStats.late} hari
- WFH: ${monthlyStats.wfh} hari
- Cuti: ${monthlyStats.leave} hari

SALDO CUTI:
- Cuti Tahunan tersisa: ${remaining.annual} dari ${balance.annual_total} hari (terpakai: ${balance.annual_used})
- Cuti Sakit tersisa: ${remaining.sick} dari ${balance.sick_total} hari (terpakai: ${balance.sick_used})
`;

    if (attendanceData.history.length > 0) {
      context += '\nRIWAYAT KEHADIRAN TERAKHIR:\n';
      attendanceData.history.slice(0, 10).forEach((h: any) => {
        const inTime = h.check_in_time
          ? new Date(h.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          : '-';
        const outTime = h.check_out_time
          ? new Date(h.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          : '-';
        const statusLabel = { present: 'Hadir', late: 'Terlambat', wfh: 'WFH', leave: 'Cuti', absent: 'Absen' }[h.status] || h.status;
        context += `- ${h.date}: ${statusLabel} (Masuk: ${inTime}, Pulang: ${outTime})\n`;
      });
    }
    return context;
  }

  // ─── RAG Vector Search ───────────────────────────────────────────────────────

  private async searchDocumentChunks(question: string): Promise<{ content: string; document_id: string }[]> {
    this.logger.log('[RAG] Generating embedding for question...');

    const embeddingResp = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: question,
    });
    const embedding = embeddingResp.data[0].embedding;

    this.logger.log('[RAG] Searching similar chunks in NeonDB...');

    // pgvector cosine similarity via raw query
    const embeddingLiteral = `[${embedding.join(',')}]`;
    const results = await this.prisma.$queryRawUnsafe<
      { id: string; document_id: string; content: string; similarity: number }[]
    >(
      `SELECT id, document_id, content,
              1 - (embedding <=> $1::vector) AS similarity
       FROM document_chunks
       WHERE embedding IS NOT NULL
         AND 1 - (embedding <=> $1::vector) > $2
       ORDER BY embedding <=> $1::vector
       LIMIT $3`,
      embeddingLiteral,
      SIMILARITY_THRESHOLD,
      MAX_CHUNKS,
    );

    this.logger.log(`[RAG] Found ${results.length} relevant chunks`);
    return results;
  }

  // ─── LLM Answer Generation ───────────────────────────────────────────────────

  private async generateAnswer(question: string, context: string, intent: QuestionIntent): Promise<string> {
    this.logger.log(`[AI] Calling OpenAI with intent=${intent}`);
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[intent] },
        { role: 'user', content: `KONTEKS:\n${context}\n\nPERTANYAAN:\n${question}` },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });
    return response.choices[0]?.message?.content || 'Maaf, tidak dapat menghasilkan jawaban.';
  }

  // ─── Logging ─────────────────────────────────────────────────────────────────

  private async logInteraction(data: {
    userId: string;
    question: string;
    answer: string;
    chunkCount: number;
    processingTimeMs: number;
  }) {
    try {
      await this.prisma.chatLog.create({
        data: {
          user_id: data.userId,
          question: data.question,
          answer: data.answer,
          document_ids: [],
          chunk_count: data.chunkCount,
          processing_time_ms: data.processingTimeMs,
        },
      });
    } catch (err) {
      this.logger.warn('[AI] Failed to log interaction: ' + (err as Error).message);
    }
  }

  // ─── Main Chat Handler ───────────────────────────────────────────────────────

  async chat(
    question: string,
    userId: string,
    userRole: string,
  ): Promise<{
    answer: string;
    documentIds: string[];
    chunkCount: number;
    processingTimeMs: number;
    intent: string;
  }> {
    const startTime = Date.now();

    const intent = this.classifyIntent(question);
    this.logger.log(`[AI] Intent=${intent} for question: "${question.substring(0, 60)}..."`);

    let context = '';
    let chunks: { content: string; document_id: string }[] = [];

    switch (intent) {
      case 'EMPLOYEE_SELF_DATA':
        context = await this.buildSelfDataContext(userId);
        try {
          chunks = await this.searchDocumentChunks(question);
          if (chunks.length > 0) {
            const docContext = chunks.map((c, i) => `[Dokumen ${i + 1}]\n${c.content}`).join('\n\n---\n\n');
            context = `${context}\n\nREFERENSI KEBIJAKAN HR:\n${docContext}`;
          }
        } catch (err) {
          this.logger.error('[RAG] Vector search failed: ' + (err as Error).message);
        }
        break;

      case 'OTHER_EMPLOYEE_DATA':
        if (userRole !== 'hr' && userRole !== 'owner') {
          return {
            answer: 'Maaf, Anda tidak memiliki akses untuk melihat data karyawan lain. Silakan hubungi HR.',
            documentIds: [],
            chunkCount: 0,
            processingTimeMs: Date.now() - startTime,
            intent,
          };
        }
        context = 'Data karyawan lain tidak tersedia melalui asisten ini. Silakan gunakan fitur HR Management.';
        break;

      case 'HR_OPERATIONAL_DATA':
        if (userRole === 'employee') {
          return {
            answer: 'Maaf, Anda tidak memiliki akses untuk melihat data operasional HR.',
            documentIds: [],
            chunkCount: 0,
            processingTimeMs: Date.now() - startTime,
            intent,
          };
        }
        context = 'Data operasional dapat dilihat di halaman HR Insights.';
        break;

      case 'HR_POLICY':
      default:
        try {
          chunks = await this.searchDocumentChunks(question);
          if (chunks.length > 0) {
            context = chunks.map((c, i) => `[Dokumen ${i + 1}]\n${c.content}`).join('\n\n---\n\n');
          } else {
            // Fallback: check leave balance for leave-related questions
            if (question.toLowerCase().includes('cuti') || question.toLowerCase().includes('leave')) {
              const balanceData = await this.leaveService.getBalance(userId);
              const { balance, remaining } = balanceData;
              context = `INFORMASI CUTI:
- Cuti Tahunan tersisa: ${remaining.annual} dari ${balance.annual_total} hari
- Cuti Sakit tersisa: ${remaining.sick} dari ${balance.sick_total} hari

Catatan: Tidak ada dokumen kebijakan HR yang ditemukan di sistem untuk saat ini.`;
            } else {
              context = 'Tidak ada dokumen kebijakan HR yang relevan ditemukan. Silakan hubungi departemen HR untuk informasi lebih lanjut.';
            }
          }
        } catch (err) {
          this.logger.error('[RAG] Vector search failed: ' + (err as Error).message);
          context = 'Sistem pencarian dokumen sedang tidak tersedia. Silakan hubungi HR secara langsung.';
        }
        break;
    }

    const answer = await this.generateAnswer(question, context, intent);
    const documentIds = [...new Set(chunks.map((c) => c.document_id))];
    const processingTimeMs = Date.now() - startTime;

    this.logger.log(`[AI] Response generated in ${processingTimeMs}ms, chunks=${chunks.length}`);

    await this.logInteraction({ userId, question, answer, chunkCount: chunks.length, processingTimeMs });

    return { answer, documentIds, chunkCount: chunks.length, processingTimeMs, intent };
  }
}
