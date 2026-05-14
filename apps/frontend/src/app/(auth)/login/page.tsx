"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BriefcaseBusiness, User, Users, CheckCircle2, Building2, Sparkles } from "lucide-react";

const DEMO_ACCOUNTS = [
  { name: "Sarah", role: "HR Manager", email: "hr@company.com", password: "password123", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
  { name: "Michael", role: "Engineering Manager", email: "manager@company.com", password: "password123", icon: BriefcaseBusiness, color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "John Doe", role: "Employee", email: "employee@company.com", password: "password123", icon: User, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const selectDemoAccount = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setShowDemoModal(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:mix-blend-screen" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000 dark:mix-blend-screen" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000 dark:mix-blend-screen" />

      <Card className="w-full max-w-md z-10 glass border-white/20 dark:border-white/10 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-primary/20 shadow-inner">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">AutomationHR</CardTitle>
          <CardDescription className="text-base mt-2">Sign in to your workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Password</Label>
                <Link href="#" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 bg-background/50 focus:bg-background transition-colors"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-medium shadow-md shadow-primary/20" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background/80 px-2 text-muted-foreground backdrop-blur-sm">Investor Demo</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-12 border-dashed border-2 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all group"
              onClick={() => setShowDemoModal(true)}
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-500 group-hover:animate-pulse" />
              View Demo Accounts
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pt-2 pb-6">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>

      {/* Demo Accounts Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md shadow-2xl border-primary/20 animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                Select Demo Role
              </CardTitle>
              <CardDescription>Choose a persona to explore the platform capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {DEMO_ACCOUNTS.map((account, idx) => {
                const Icon = account.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                    onClick={() => selectDemoAccount(account)}
                  >
                    <div className={`p-3 rounded-lg ${account.bg}`}>
                      <Icon className={`w-6 h-6 ${account.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{account.role}</div>
                      <div className="text-sm text-muted-foreground">{account.name} &middot; {account.email}</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" className="w-full" onClick={() => setShowDemoModal(false)}>
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
