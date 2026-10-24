import { Resend } from "resend";
import { getServerEnv } from "@/lib/env";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends via Resend when RESEND_API_KEY is set.
 * Otherwise logs the message (local/dev) so flows stay testable at $0.
 */
export async function sendEmail(input: SendEmailInput): Promise<"sent" | "logged"> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.info("[email:dev]", {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return "logged";
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM?.trim() || "AI Spend Control <onboarding@resend.dev>";

  const result = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (result.error) {
    console.error("[email] Resend error", result.error);
    throw new Error(result.error.message || "Failed to send email");
  }

  return "sent";
}

export function appBaseUrl(): string {
  return getServerEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}
