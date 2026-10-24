import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot password" subtitle="We’ll email a reset link if that account exists.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
