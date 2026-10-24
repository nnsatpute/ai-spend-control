import { prisma } from "@/infrastructure/db";

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  return prisma.user.findUnique({ where: { id } });
}

/** The org a user lands in after sign-in: their oldest membership. */
export async function findDefaultOrgId(userId: string): Promise<string | null> {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { orgId: true },
  });
  return membership?.orgId ?? null;
}

/** Signup: new user, new organization, owner membership — all or nothing. */
export async function createUserWithOrganization(input: {
  email: string;
  passwordHash: string;
  orgName: string;
}): Promise<{ user: UserRecord; orgId: string }> {
  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: { name: input.orgName },
    });
    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
      },
    });
    await tx.membership.create({
      data: { userId: user.id, orgId: organization.id, role: "OWNER" },
    });
    return { user, orgId: organization.id };
  });
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
