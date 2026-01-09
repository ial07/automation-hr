import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "check_in"
  | "check_out";

export type AuditEntityType =
  | "leave_request"
  | "overtime_request"
  | "attendance_record"
  | "document"
  | "user";

export const auditRepository = {
  async log(params: {
    userId?: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string;
    oldValue?: object;
    newValue?: object;
    metadata?: object;
  }): Promise<void> {
    try {
      await supabase.from("audit_logs").insert({
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        old_value: params.oldValue,
        new_value: params.newValue,
        metadata: params.metadata,
      });
    } catch (error) {
      console.error("[Audit] Failed to log:", error);
    }
  },

  async getByEntity(entityType: string, entityId: string) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Failed to get audit logs: ${error.message}`);
    return data || [];
  },

  async getRecent(limit: number = 50) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*, user:users!user_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get audit logs: ${error.message}`);
    return data || [];
  },
};
