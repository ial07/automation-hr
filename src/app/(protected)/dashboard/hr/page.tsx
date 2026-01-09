import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HRPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">HR Management</h1>
        <p className="text-muted-foreground">Kelola karyawan dan proses HR</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Persetujuan Cuti</CardTitle>
            <CardDescription>Review permintaan cuti karyawan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/leave/approvals">Lihat Permintaan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Persetujuan Lembur</CardTitle>
            <CardDescription>Review permintaan lembur karyawan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/overtime/approvals">Lihat Permintaan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HR Documents</CardTitle>
            <CardDescription>Kelola dokumen kebijakan HR</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/hr/documents">Kelola Dokumen</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>HR Insights</CardTitle>
            <CardDescription>Analisis kehadiran dan cuti</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/hr/insights">Lihat Insights</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Asisten HR</CardTitle>
            <CardDescription>Tanya AI tentang kebijakan HR</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/chat">Mulai Chat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
