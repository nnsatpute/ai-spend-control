import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AppError } from "@/domain/common";
import { APP_NAME } from "@/lib/constants";
import { appBaseUrl, sendEmail } from "@/infrastructure/email/resend";
import {
  createPasswordResetToken,
  deleteResetTokenById,
  deleteResetTokensForUser,
  findValidResetToken,
} from "@/infrastructure/repositories/password-reset.repository";
import {
  findUserByEmail,
  findUserById,
  updateUserPassword,
} from "@/infrastructure/repositories/user.repository";

const emailSchema = z.string().trim().email().max(256).transform((v) => v.toLowerCase());
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128);

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Always succeeds from the caller's perspective (anti-enumeration).
 * Sends email when the account exists and mail is configured.
 */
export async function requestPasswordReset(emailRaw: string): Promise<{
  message: string;
}> {
  const parsed = emailSchema.safeParse(emailRaw);
  const message =
    "If an account exists for that email, we sent a reset link.";

  if (!parsed.success) {
    return { message };
  }

  const user = await findUserByEmail(parsed.data);
  if (!user) {
    return { message };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await deleteResetTokensForUser(user.id);
  await createPasswordResetToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${appBaseUrl()}/reset-password?token=${rawToken}`;
  const subject = `Reset your ${APP_NAME} password`;
  const text = `Reset your password (link expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `
    <p>Reset your ${APP_NAME} password. This link expires in <strong>1 hour</strong>.</p>
    <p><a href="${resetUrl}">Choose a new password</a></p>
    <p style="color:#666;font-size:12px;">If you did not request this, ignore this email.</p>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });
  } catch (error) {
    console.error("[password-reset] email failed", error);
    // Still return generic success — avoid leaking mail infra status to attackers.
  }

  return { message };
}

export async function resetPasswordWithToken(
  tokenRaw: string,
  passwordRaw: string,
): Promise<{ message: string }> {
  const passwordParsed = passwordSchema.safeParse(passwordRaw);
  if (!passwordParsed.success) {
    throw new AppError(
      "VALIDATION",
      passwordParsed.error.issues[0]?.message ?? "Invalid password",
    );
  }

  if (typeof tokenRaw !== "string" || tokenRaw.length < 32) {
    throw new AppError("VALIDATION", "Invalid or expired reset link");
  }

  const record = await findValidResetToken(hashToken(tokenRaw));
  if (!record) {
    throw new AppError("VALIDATION", "Invalid or expired reset link");
  }

  const user = await findUserById(record.userId);
  if (!user) {
    throw new AppError("VALIDATION", "Invalid or expired reset link");
  }

  const passwordHash = await bcrypt.hash(passwordParsed.data, 12);
  await updateUserPassword(user.id, passwordHash);
  await deleteResetTokenById(record.id);
  await deleteResetTokensForUser(user.id);

  return { message: "Password updated. You can sign in now." };
}
