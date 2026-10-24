import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell accent="Welcome" title="back" subtitle="See your team's AI spend.">
      <Suspense fallback={<p className="text-sm text-mc-ink-soft">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
