"use client";

import { useState } from "react";
import {
  useLeaveRequests,
  useLeaveBalance,
  useSubmitLeave,
} from "@/hooks/useLeave";
import {
  LEAVE_TYPES,
  LEAVE_STATUSES,
  LEAVE_STATUS_COLORS,
  LeaveType,
} from "@/types/leave";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LeavePage() {
  const { data, isLoading, refetch } = useLeaveRequests();
  const { data: balanceData } = useLeaveBalance();
  const submitMutation = useSubmitLeave();

  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await submitMutation.mutateAsync({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason || undefined,
      });
      setShowForm(false);
      setLeaveType("annual");
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan cuti");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pengajuan Cuti</h1>
          <p className="text-muted-foreground">Kelola pengajuan cuti Anda</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Batal" : "Ajukan Cuti"}
          </Button>
        </div>
      </div>

      {/* Leave Balance Cards */}
      {balanceData && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Cuti Tahunan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balanceData.remaining.annual} /{" "}
                {balanceData.balance.annual_total}
              </div>
              <p className="text-xs text-muted-foreground">hari tersisa</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cuti Sakit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {balanceData.remaining.sick} / {balanceData.balance.sick_total}
              </div>
              <p className="text-xs text-muted-foreground">hari tersisa</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave Request Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Formulir Pengajuan Cuti</CardTitle>
            <CardDescription>Isi detail pengajuan cuti Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Jenis Cuti *</Label>
                  <Select
                    value={leaveType}
                    onValueChange={(v) => setLeaveType(v as LeaveType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis cuti" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAVE_TYPES).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Tanggal Mulai *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Tanggal Selesai *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Alasan (opsional)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Keperluan keluarga"
                />
              </div>

              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Mengajukan..." : "Ajukan Cuti"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pengajuan</CardTitle>
          <CardDescription>Pengajuan cuti Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Memuat...</p>
          ) : data?.requests && data.requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Jenis</th>
                    <th className="text-left py-2 px-4">Tanggal</th>
                    <th className="text-left py-2 px-4">Hari</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Diajukan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.requests.map((req) => (
                    <tr key={req.id} className="border-b">
                      <td className="py-2 px-4">
                        {LEAVE_TYPES[req.leave_type]}
                      </td>
                      <td className="py-2 px-4">
                        {req.start_date} - {req.end_date}
                      </td>
                      <td className="py-2 px-4">{req.total_days}</td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            LEAVE_STATUS_COLORS[req.status]
                          }`}
                        >
                          {LEAVE_STATUSES[req.status]}
                        </span>
                      </td>
                      <td className="py-2 px-4">
                        {new Date(req.created_at).toLocaleDateString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">Belum ada pengajuan cuti.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
