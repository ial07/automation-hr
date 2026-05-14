"use client";

import { useState } from "react";
import { useOvertime, useSubmitOvertime } from "@/hooks/useOvertime";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function OvertimePage() {
  const { data, isLoading, refetch } = useOvertime();
  const submitMutation = useSubmitOvertime();

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("20:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await submitMutation.mutateAsync({
        date,
        start_time: startTime,
        end_time: endTime,
        reason,
      });
      setDate("");
      setReason("");
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan lembur");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pengajuan Lembur</h1>
          <p className="text-muted-foreground">
            Ajukan dan kelola permintaan lembur Anda
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">
            {data?.monthlyTotal || 0} jam
          </div>
          <div className="text-sm text-muted-foreground">Total bulan ini</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Ajukan Lembur Baru</CardTitle>
            <CardDescription>
              Pastikan Anda sudah check-out sebelum mengajukan lembur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Jam Mulai</Label>
                  <Input
                    id="start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">Jam Selesai</Label>
                  <Input
                    id="end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Alasan Lembur</Label>
                <Input
                  id="reason"
                  placeholder="Contoh: Deadline project"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? "Memproses..." : "Ajukan Lembur"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pengajuan</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Memuat...</p>
            ) : data?.requests && data.requests.length > 0 ? (
              <div className="space-y-4">
                {data.requests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <div className="font-medium">
                        {new Date(req.date).toLocaleDateString("id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {req.start_time.slice(0, 5)} -{" "}
                        {req.end_time.slice(0, 5)} ({req.hours} jam)
                      </div>
                    </div>
                    <Badge className={OVERTIME_COLORS[req.status]}>
                      {OVERTIME_STATUS[req.status]}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Belum ada pengajuan lembur.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
