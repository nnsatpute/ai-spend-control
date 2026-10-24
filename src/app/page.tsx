import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/lib/constants";

const noDeploy = [
  {
    title: "No proxy",
    body: "Your AI tools keep talking to their vendors directly. We read spend from vendor admin APIs, so nothing sits in the request path.",
  },
  {
    title: "Nothing on laptops",
    body: "No agent, no extension rollout, no IT ticket. One admin pastes one key and you see the whole team.",
  },
  {
    title: "Read-only to start",
    body: "Day one is pure visibility. Policies run in monitor mode first, so you see what would happen before anything is enforced.",
  },
];

const budgetSteps = [
  {
    pct: "80%",
    title: "The person hears first",
    body: "A friendly email with their spend, their budget, and the date they'll hit it at the current pace.",
  },
  {
    pct: "90%",
    title: "The manager joins in",
    body: "The same note goes to their manager, with the projected breach date.",
  },
  {
    pct: "100%",
    title: "Your call, enforced",
    body: "Email only, or a hard cap on Cursor on-demand spend. Monitor mode shows what would happen first.",
  },
  {
    pct: "+",
    title: "Raise it in one click",
    body: "A manager sets a higher budget on the Budgets page. The Cursor cap moves up with it, and Slack gets the alert.",
  },
];

const security = [
  {
    title: "Prompts never leave",
    body: "We store spend, request counts and model names. Never prompts, code or completions.",
  },
  {
    title: "Keys encrypted at rest",
    body: "Admin keys are checked with the vendor, encrypted with AES-256-GCM, and shown back only as the last four characters.",
  },
  {
    title: "Audit trail by default",
    body: "Connecting, disconnecting and every future enforcement action is written to an audit log.",
  },
];

const previewRows = [
  { name: "Priya S.", spend: "$412", pct: 103, tone: "bg-mc-danger", tag: "Capped" },
  { name: "Marcus L.", spend: "$268", pct: 89, tone: "bg-mc-warn", tag: "89%" },
  { name: "Ana R.", spend: "$171", pct: 57, tone: "bg-mc-accent", tag: "57%" },
  { name: "Dev K.", spend: "$64", pct: 21, tone: "bg-mc-cyan", tag: "21%" },
];

function ProductPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-mc-signal/20 via-transparent to-mc-accent/20 blur-2xl" />
      <div className="relative rounded-[24px] bg-mc-surface p-6 shadow-[0_30px_80px_-40px_rgba(46,36,107,0.6)]">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-wide text-mc-ink-soft uppercase">
            Cursor · this cycle
          </p>
          <span className="rounded-full bg-mc-cyan/12 px-2.5 py-0.5 text-[11px] font-semibold text-mc-cyan">
            Synced 4 min ago
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-mc-ink p-4 text-white">
            <p className="text-[11px] tracking-wide text-white/70 uppercase">On-demand</p>
            <p className="mt-1 font-display text-2xl font-semibold">$3,284</p>
          </div>
          <div className="rounded-2xl bg-mc-elevated p-4">
            <p className="text-[11px] tracking-wide text-mc-ink-soft uppercase">Projected</p>
            <p className="mt-1 font-display text-2xl font-semibold text-mc-ink">$5,910</p>
          </div>
        </div>
        <ul className="mt-5 space-y-3.5">
          {previewRows.map((row) => (
            <li key={row.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-mc-ink">{row.name}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono-mc text-xs text-mc-ink-soft">{row.spend}</span>
                  <span className="rounded-full bg-mc-mist px-2 py-0.5 text-[10px] font-semibold text-mc-ink">
                    {row.tag}
                  </span>
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-mc-mist">
                <div
                  className={`mc-bar h-full rounded-full ${row.tone}`}
                  style={{ width: `${Math.min(row.pct, 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl bg-mc-elevated px-3.5 py-2.5 text-xs text-mc-ink-soft">
          Illustration with sample data.
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-mc-paper text-mc-ink">
      <header className="sticky top-0 z-30 border-b border-mc-line/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="flex items-center gap-2 font-display text-sm font-medium sm:gap-6">
            <a href="#how" className="hidden text-mc-ink-soft hover:text-mc-ink sm:inline">
              How it works
            </a>
            <a href="#security" className="hidden text-mc-ink-soft hover:text-mc-ink sm:inline">
              Security
            </a>
            <Link href="/login" className="px-2 text-mc-ink-soft hover:text-mc-ink">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-mc-signal px-4 py-2 text-white shadow-[0_6px_20px_-6px_rgba(241,90,58,0.6)] hover:bg-mc-signal-deep"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full bg-mc-signal/12 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 left-[-15%] h-[520px] w-[520px] rounded-full bg-mc-accent/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
            <div className="mc-rise">
              <p className="font-display text-xs font-semibold tracking-[0.16em] text-mc-signal uppercase">
                AI spend governance for growing teams
              </p>
              <h1 className="mt-5 font-display text-4xl leading-[1.12] font-normal tracking-tight sm:text-5xl lg:text-[56px]">
                <span className="font-accent">Every</span> AI dollar, mapped to a person.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-mc-ink-soft">
                See who is spending what on Cursor today, with OpenAI and Anthropic next. Set
                budgets, warn people before they hit them, and cap overruns. Nothing in the
                request path; your team keeps working the way they do.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-lg bg-mc-signal px-6 py-3.5 font-display text-sm font-medium text-white shadow-[0_10px_30px_-10px_rgba(241,90,58,0.7)] transition hover:bg-mc-signal-deep"
                >
                  Connect Cursor free
                </Link>
                <a
                  href="#how"
                  className="rounded-lg border border-mc-ink/70 px-6 py-3.5 font-display text-sm font-medium text-mc-ink transition hover:bg-mc-ink hover:text-white"
                >
                  See how it works
                </a>
              </div>
              <p className="mt-5 text-xs text-mc-ink-soft">
                Two-minute setup · Monitor mode first · For Cursor Enterprise teams
              </p>
            </div>
            <div className="mc-rise mc-rise-delay-2">
              <ProductPreview />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center font-display text-3xl font-normal tracking-tight sm:text-4xl">
            Really. <span className="font-accent">Deploy</span> nothing.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {noDeploy.map((item) => (
              <div key={item.title} className="rounded-[20px] bg-white p-7 shadow-[0_16px_40px_-28px_rgba(46,36,107,0.5)]">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-mc-signal/12 text-mc-signal">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4 4L19 6" />
                  </svg>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mc-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="font-display text-xs font-semibold tracking-[0.16em] text-mc-signal uppercase">
              How it works
            </p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-normal tracking-tight sm:text-4xl">
              What happens as a budget <span className="font-accent">fills up</span>
            </h2>
            <p className="mt-4 max-w-2xl text-mc-ink-soft">
              A company default, or a different amount per person. New budgets start in monitor
              mode, so you see who would be capped before anything changes in Cursor.
            </p>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {budgetSteps.map((step) => (
                <div key={step.title} className="rounded-[20px] border border-mc-line bg-white p-6">
                  <span className="font-display text-3xl font-semibold text-mc-signal">{step.pct}</span>
                  <h3 className="mt-4 font-display text-base font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mc-ink-soft">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight sm:text-4xl">
            Sees the spend, <span className="font-accent">blind</span> to every word your team types
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {security.map((item) => (
              <div key={item.title} className="rounded-[20px] bg-mc-surface p-7 shadow-[0_16px_40px_-28px_rgba(46,36,107,0.5)]">
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mc-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-mc-ink px-8 py-14 text-center text-white sm:px-16">
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-mc-signal/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-mc-accent/40 blur-3xl" />
            <h2 className="relative font-display text-3xl font-normal tracking-tight sm:text-4xl">
              Connected in <span className="font-accent">minutes</span>. Your real number on day one.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/75">
              Bring a Cursor admin key. Leave the gateways and rollout plans behind.
            </p>
            <Link
              href="/signup"
              className="relative mt-8 inline-block rounded-lg bg-mc-signal px-7 py-3.5 font-display text-sm font-medium text-white transition hover:bg-mc-signal-deep"
            >
              Start free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-mc-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-mc-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {APP_NAME}</span>
          <span>No prompts stored · Keys encrypted at rest</span>
          <Link href="/security" className="font-semibold text-mc-signal hover:underline">
            Security
          </Link>
        </div>
      </footer>
    </div>
  );
}
