"use client";

import { useState } from "react";
import { useOvertimeApprovals, useApproveOvertime } from "@/hooks/useOvertime";
import { OVERTIME_STATUS, OVERTIME_COLORS } from "@/types/overtime";
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
import { Badge } from "@/components/ui/badge";

export default function OvertimeApprovalsPage() {
  const { data, isLoading, refetch } = useOvertimeApprovals();
  const approveMutation = useApproveOvertime();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      await approveMutation.mutateAsync({ id, action, notes: notes[id] });
      refetch();
    } catch (error) {
      console.error("Action failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Persetujuan Lembur</h1>
        <p className="text-muted-foreground">
          Setujui atau tolak permintaan lembur karyawan
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permintaan Pending</CardTitle>
          <CardDescription>Menunggu persetujuan Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Memuat...</p>
          ) : data?.requests && data.requests.length > 0 ? (
            <div className="space-y-4">
              {data.requests.map((req) => (
                <div key={req.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {req.employee?.full_name || "Unknown"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(req.date).toLocaleDateString("id-ID")} •
                        {req.start_time.slice(0, 5)} -{" "}
                        {req.end_time.slice(0, 5)} ({req.hours} jam)
                      </div>
                      <div className="text-sm mt-1">{req.reason}</div>
                    </div>
                    <Badge className={OVERTIME_COLORS[req.status]}>
                      {OVERTIME_STATUS[req.status]}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Catatan (opsional)</Label>
                    <Input
                      placeholder="Tambahkan catatan..."
                      value={notes[req.id] || ""}
                      onChange={(e) =>
                        setNotes({ ...notes, [req.id]: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAction(req.id, "approve")}
                      disabled={approveMutation.isPending}
                    >
                      Setujui
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleAction(req.id, "reject")}
                      disabled={approveMutation.isPending}
                    >
                      Tolak
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              Tidak ada permintaan pending.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
