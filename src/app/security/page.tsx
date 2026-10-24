import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/lib/constants";

const points = [
  {
    title: "No prompts, no code",
    body: "We never ask Cursor for chat transcripts, files, or code. Spend and daily request counts are the only usage data we store.",
  },
  {
    title: "Admin keys stay on the server",
    body: "Cursor admin keys are encrypted with AES-256-GCM before they are written to the database. The encryption key lives only in the server environment. The browser never receives a key, and logs never include one.",
  },
  {
    title: "Slack webhooks are encrypted the same way",
    body: "An optional incoming-webhook URL is stored encrypted. Clearing it deletes the stored value.",
  },
  {
    title: "Budgets do not change models",
    body: "Enforce mode can set a Cursor on-demand spend cap for a person. It cannot change which model they use.",
  },
  {
    title: "Access is per workspace",
    body: "Each account belongs to one workspace. Owners and admins connect providers. Managers can set budgets and sync. Viewers can read.",
  },
  {
    title: "Hourly sync is authenticated",
    body: "The sync endpoint accepts only a bearer secret that is not the user session. Without that secret it returns unauthorized.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-mc-paper text-mc-ink">
      <header className="border-b border-mc-line bg-white/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Logo />
          <Link href="/login" className="text-sm font-semibold text-mc-signal">
            Sign in
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
        <div>
          <p className="text-xs font-semibold tracking-wide text-mc-ink-soft uppercase">Security</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">How {APP_NAME} handles keys and usage</h1>
          <p className="mt-3 text-mc-ink-soft">
            Built for a finance or IT owner who will not install anything on laptops, and will not put a proxy in front of Cursor.
          </p>
        </div>
        <ul className="space-y-4">
          {points.map((point) => (
            <li key={point.title} className="rounded-[20px] border border-mc-line bg-white p-5">
              <h2 className="font-display text-lg font-semibold">{point.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-mc-ink-soft">{point.body}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
