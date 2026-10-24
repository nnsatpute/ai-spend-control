import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function SignupPage() {
  return (
    <AuthShell
      accent="Start"
      title="seeing your AI spend"
      subtitle="Connect Cursor in the next step. Nothing to install."
    >
      <SignupForm />
    </AuthShell>
  );
}
