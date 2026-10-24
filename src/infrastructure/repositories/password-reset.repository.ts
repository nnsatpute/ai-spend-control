import { prisma } from "@/infrastructure/db";

export async function deleteResetTokensForUser(userId: string): Promise<void> {
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
}

export async function createPasswordResetToken(input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> {
  await prisma.passwordResetToken.create({
    data: {
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    },
  });
}

export async function findValidResetToken(tokenHash: string): Promise<{
  id: string;
  userId: string;
  expiresAt: Date;
} | null> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record) {
    return null;
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } });
    return null;
  }

  return {
    id: record.id,
    userId: record.userId,
    expiresAt: record.expiresAt,
  };
}

export async function deleteResetTokenById(id: string): Promise<void> {
  await prisma.passwordResetToken.delete({ where: { id } }).catch(() => undefined);
}
