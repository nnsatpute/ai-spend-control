import bcrypt from "bcryptjs";
import { AppError } from "@/domain/common";
import { z } from "zod";
import {
  createUserWithOrganization,
  findDefaultOrgId,
  findUserByEmail,
} from "@/infrastructure/repositories/user.repository";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(256).transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

const registerSchema = credentialsSchema.extend({
  orgName: z
    .string()
    .trim()
    .min(1, "Company name is required")
    .max(80)
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export async function registerUser(input: RegisterInput): Promise<{
  id: string;
  email: string;
  orgId: string;
}> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid registration details";
    throw new AppError("VALIDATION", first, {
      issues: parsed.error.issues,
    });
  }

  const { email, password } = parsed.data;
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new AppError("CONFLICT", "An account with this email already exists");
  }

  const orgName = parsed.data.orgName?.trim() || email.split("@")[1] || "My company";
  const passwordHash = await bcrypt.hash(password, 12);
  const { user, orgId } = await createUserWithOrganization({
    email,
    passwordHash,
    orgName,
  });

  return { id: user.id, email: user.email, orgId };
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; orgId: string } | null> {
  const parsed = credentialsSchema.safeParse({ email, password });
  if (!parsed.success) {
    return null;
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    return null;
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return null;
  }

  const orgId = await findDefaultOrgId(user.id);
  return orgId ? { id: user.id, email: user.email, orgId } : null;
}
