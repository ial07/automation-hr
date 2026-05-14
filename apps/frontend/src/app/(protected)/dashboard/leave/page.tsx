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
import { CalendarDays, Plus, Activity, Stethoscope, Clock } from "lucide-react";

// Helper component for circular progress
function CircularProgress({ value, max, label, colorClass }: { value: number, max: number, label: string, colorClass: string }) {
  const percentage = Math.round((value / max) * 100);
  const strokeDashoffset = 125.6 - (125.6 * percentage) / 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
          <circle
            className="text-muted/50 stroke-current"
            strokeWidth="4"
            cx="24"
            cy="24"
            r="20"
            fill="transparent"
          ></circle>
          <circle
            className={`${colorClass} stroke-current transition-all duration-1000 ease-in-out`}
            strokeWidth="4"
            strokeLinecap="round"
            cx="24"
            cy="24"
            r="20"
            fill="transparent"
            strokeDasharray="125.6"
            strokeDashoffset={strokeDashoffset}
          ></circle>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-xl font-bold">{value}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

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
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-primary" /> Pengajuan Cuti
          </h1>
          <p className="text-muted-foreground mt-1">Kelola dan pantau sisa cuti Anda</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} className="shadow-sm">
            Refresh Data
          </Button>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className={`shadow-md transition-all ${showForm ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-primary hover:bg-primary/90'}`}
          >
            {showForm ? "Batal Pengajuan" : <><Plus className="w-4 h-4 mr-1" /> Ajukan Cuti</>}
          </Button>
        </div>
      </div>

      {/* Leave Balance Cards */}
      {balanceData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm border-indigo-500/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Cuti Tahunan
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  {balanceData.remaining.annual} <span className="text-lg text-muted-foreground font-normal">hari</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Total kuota: {balanceData.balance.annual_total} hari
                </p>
              </div>
              <CircularProgress 
                value={balanceData.remaining.annual} 
                max={balanceData.balance.annual_total} 
                label="Tersisa" 
                colorClass="text-indigo-500" 
              />
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-rose-500/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
            <CardHeader className="pb-2 relative z-10">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-rose-500" />
                Cuti Sakit
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  {balanceData.remaining.sick} <span className="text-lg text-muted-foreground font-normal">hari</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Total kuota: {balanceData.balance.sick_total} hari
                </p>
              </div>
              <CircularProgress 
                value={balanceData.remaining.sick} 
                max={balanceData.balance.sick_total} 
                label="Tersisa" 
                colorClass="text-rose-500" 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leave Request Form */}
      {showForm && (
        <Card className="border-primary/20 shadow-lg animate-in slide-in-from-top-4 fade-in duration-300">
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-4">
            <CardTitle className="text-lg">Formulir Pengajuan Cuti Baru</CardTitle>
            <CardDescription>Isi detail di bawah ini untuk mengajukan permohonan cuti</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="leaveType" className="text-xs uppercase font-semibold text-muted-foreground">Jenis Cuti <span className="text-destructive">*</span></Label>
                  <Select
                    value={leaveType}
                    onValueChange={(v) => setLeaveType(v as LeaveType)}
                  >
                    <SelectTrigger className="h-12 bg-background">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="text-xs uppercase font-semibold text-muted-foreground">Tanggal Mulai <span className="text-destructive">*</span></Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="h-12 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate" className="text-xs uppercase font-semibold text-muted-foreground">Tanggal Selesai <span className="text-destructive">*</span></Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="h-12 bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-xs uppercase font-semibold text-muted-foreground">Alasan (Opsional)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Keperluan keluarga mendesak"
                  className="h-12 bg-background"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={submitMutation.isPending} className="px-8 shadow-md">
                  {submitMutation.isPending ? "Mengajukan..." : "Kirim Pengajuan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests List */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Riwayat Pengajuan Cuti
        </h2>
        
        {isLoading ? (
          <div className="flex justify-center p-12 bg-card rounded-xl border border-border">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : data?.requests && data.requests.length > 0 ? (
          <div className="space-y-3">
            {data.requests.map((req) => {
              // Custom colors for full badge instead of just text
              let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300";
              if (req.status === 'approved_hr' || req.status === 'approved_manager') badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400";
              else if (req.status === 'rejected_hr' || req.status === 'rejected_manager') badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400";
              else if (req.status === 'submitted') badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400";

              return (
                <div key={req.id} className="bg-card p-4 rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-muted p-3 rounded-lg flex-shrink-0">
                      <CalendarDays className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{LEAVE_TYPES[req.leave_type]}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {req.total_days} Hari
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {new Date(req.start_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })} 
                        {" — "} 
                        {new Date(req.end_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      {req.reason && <div className="text-sm mt-2 italic text-muted-foreground">"{req.reason}"</div>}
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
                      {LEAVE_STATUSES[req.status]}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Diajukan: {new Date(req.created_at).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-12 bg-card border border-dashed rounded-xl text-muted-foreground">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium text-foreground mb-1">Belum Ada Pengajuan</p>
            <p>Anda belum pernah mengajukan cuti sejauh ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
