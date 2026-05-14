import { ragService } from "./rag.service";
import { leaveService } from "./leave.service";
import { LeaveType, LEAVE_TYPES } from "@/types/leave";

export type PolicyCheckResult = {
  eligible: boolean;
  message: string;
  balance_before: number;
  balance_after: number;
  details?: string;
};

const POLICY_CHECK_PROMPT = `Anda adalah sistem validasi cuti HR.

Berdasarkan konteks dokumen HR yang diberikan, periksa apakah pengajuan cuti berikut sesuai kebijakan:

DETAIL PENGAJUAN:
- Jenis Cuti: {leaveType}
- Tanggal: {startDate} sampai {endDate}
- Total Hari Kerja: {totalDays}
- Sisa Cuti Tersedia: {remainingDays}

INSTRUKSI:
1. Jika sisa cuti MENCUKUPI dan sesuai kebijakan, jawab: "ELIGIBLE: [penjelasan singkat]"
2. Jika sisa cuti TIDAK MENCUKUPI atau melanggar kebijakan, jawab: "NOT_ELIGIBLE: [alasan penolakan]"
3. Jika informasi kebijakan tidak tersedia, jawab: "ELIGIBLE: Kebijakan detail tidak ditemukan, pengajuan diteruskan untuk review manual."

Jawab dalam Bahasa Indonesia formal dan singkat.`;

export const leavePolicyService = {
  /**
   * Validate leave request against HR policies using RAG
   */
  async validateRequest(
    userId: string,
    leaveType: LeaveType,
    startDate: string,
    endDate: string
  ): Promise<PolicyCheckResult> {
    const totalDays = leaveService.calculateWorkingDays(startDate, endDate);

    // Get current balance
    let remainingDays = 0;
    let balanceBefore = 0;

    if (leaveType === "annual" || leaveType === "sick") {
      remainingDays = await leaveService.getRemainingDays(userId, leaveType);
      balanceBefore = remainingDays;
    } else {
      // Special and maternity leave - no balance limit
      remainingDays = 999;
      balanceBefore = 0;
    }

    // Quick balance check
    if (
      totalDays > remainingDays &&
      (leaveType === "annual" || leaveType === "sick")
    ) {
      return {
        eligible: false,
        message: `Sisa cuti ${LEAVE_TYPES[leaveType]} tidak mencukupi. Tersedia: ${remainingDays} hari, diajukan: ${totalDays} hari.`,
        balance_before: balanceBefore,
        balance_after: balanceBefore,
      };
    }

    // Build prompt for RAG
    const prompt = POLICY_CHECK_PROMPT.replace(
      "{leaveType}",
      LEAVE_TYPES[leaveType]
    )
      .replace("{startDate}", startDate)
      .replace("{endDate}", endDate)
      .replace("{totalDays}", String(totalDays))
      .replace("{remainingDays}", String(remainingDays));

    try {
      // Query RAG for policy context
      const queryEmbedding = await ragService.embedQuery(
        `kebijakan ${LEAVE_TYPES[leaveType]} prosedur pengajuan cuti`
      );
      const chunks = await ragService.searchRelevantChunks(queryEmbedding);

      // Build context from chunks
      let context = "Tidak ada dokumen HR yang relevan.";
      if (chunks.length > 0) {
        context = chunks
          .map((c, i) => `[Dokumen ${i + 1}]\n${c.content}`)
          .join("\n\n---\n\n");
      }

      // Generate policy-aware response
      const response = await ragService.generateAnswer(
        prompt,
        context,
        "HR_POLICY"
      );

      // Parse response
      const isEligible =
        response.toUpperCase().includes("ELIGIBLE:") &&
        !response.toUpperCase().includes("NOT_ELIGIBLE:");

      return {
        eligible: isEligible,
        message: response.replace(/^(ELIGIBLE:|NOT_ELIGIBLE:)\s*/i, "").trim(),
        balance_before: balanceBefore,
        balance_after: isEligible ? balanceBefore - totalDays : balanceBefore,
        details:
          chunks.length > 0
            ? `Berdasarkan ${chunks.length} dokumen HR.`
            : undefined,
      };
    } catch (error) {
      console.error("Policy check error:", error);
      // Fallback: allow if balance check passed
      return {
        eligible:
          totalDays <= remainingDays ||
          leaveType === "maternity" ||
          leaveType === "special",
        message:
          "Validasi kebijakan otomatis tidak tersedia. Pengajuan akan direview manual.",
        balance_before: balanceBefore,
        balance_after: balanceBefore - totalDays,
      };
    }
  },

  /**
   * Answer leave-related questions using RAG
   */
  async answerQuestion(userId: string, question: string): Promise<string> {
    // Get user's balance for context
    const balance = await leaveService.getBalance(userId);
    const annualRemaining = balance.annual_total - balance.annual_used;
    const sickRemaining = balance.sick_total - balance.sick_used;

    const contextPrefix = `INFO KARYAWAN:
- Sisa Cuti Tahunan: ${annualRemaining} dari ${balance.annual_total} hari
- Sisa Cuti Sakit: ${sickRemaining} dari ${balance.sick_total} hari

`;

    // Use existing RAG chat
    const result = await ragService.chat(contextPrefix + question, userId);
    return result.answer;
  },
};
