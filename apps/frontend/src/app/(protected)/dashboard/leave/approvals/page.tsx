"use client";

import { useState } from "react";
import { useLeaveApprovals, useApproveLeave } from "@/hooks/useLeave";
import { LEAVE_TYPES, LEAVE_STATUSES, LeaveRequest } from "@/types/leave";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ApprovalCard({
  request,
  onAction,
  isLoading,
}: {
  request: LeaveRequest;
  onAction: (id: string, action: "approve" | "reject", notes?: string) => void;
  isLoading: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">
              {request.employee?.full_name || "Karyawan"}
            </CardTitle>
            <CardDescription>{request.employee?.email}</CardDescription>
          </div>
          <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
            {LEAVE_STATUSES[request.status]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Jenis:</span>
            <p className="font-medium">{LEAVE_TYPES[request.leave_type]}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Tanggal:</span>
            <p className="font-medium">
              {request.start_date} - {request.end_date}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Total:</span>
            <p className="font-medium">{request.total_days} hari</p>
          </div>
        </div>

        {request.reason && (
          <div className="text-sm">
            <span className="text-muted-foreground">Alasan:</span>
            <p>{request.reason}</p>
          </div>
        )}

        {showNotes && (
          <div className="space-y-2">
            <Label htmlFor={`notes-${request.id}`}>Catatan (opsional)</Label>
            <Input
              id={`notes-${request.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan..."
            />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {!showNotes ? (
            <>
              <Button
                size="sm"
                onClick={() => onAction(request.id, "approve")}
                disabled={isLoading}
              >
                Setujui
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowNotes(true)}
                disabled={isLoading}
              >
                Tolak
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onAction(request.id, "reject", notes);
                  setShowNotes(false);
                  setNotes("");
                }}
                disabled={isLoading}
              >
                Konfirmasi Tolak
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowNotes(false);
                  setNotes("");
                }}
              >
                Batal
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ApprovalsPage() {
  const { data, isLoading, refetch } = useLeaveApprovals();
  const approveMutation = useApproveLeave();
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (
    id: string,
    action: "approve" | "reject",
    notes?: string
  ) => {
    setError(null);
    try {
      await approveMutation.mutateAsync({ id, action, notes });
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Persetujuan Cuti</h1>
          <p className="text-muted-foreground">
            Review dan setujui pengajuan cuti karyawan
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Memuat...</p>
      ) : (
        <>
          {/* Manager Pending */}
          {data?.managerPending && data.managerPending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Menunggu Persetujuan Manager ({data.managerPending.length})
              </h2>
              {data.managerPending.map((req) => (
                <ApprovalCard
                  key={req.id}
                  request={req}
                  onAction={handleAction}
                  isLoading={approveMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* HR Pending */}
          {data?.hrPending && data.hrPending.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Menunggu Persetujuan HR ({data.hrPending.length})
              </h2>
              {data.hrPending.map((req) => (
                <ApprovalCard
                  key={req.id}
                  request={req}
                  onAction={handleAction}
                  isLoading={approveMutation.isPending}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!data?.managerPending?.length && !data?.hrPending?.length && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Tidak ada pengajuan cuti yang menunggu persetujuan.
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
