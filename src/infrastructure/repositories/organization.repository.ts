import { prisma } from "@/infrastructure/db";
import type { MemberRole, Organization } from "@/domain/organization";

export async function findOrganizationById(orgId: string): Promise<Organization | null> {
  return prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, createdAt: true },
  });
}

export async function findMembershipRole(
  userId: string,
  orgId: string,
): Promise<MemberRole | null> {
  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId, orgId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}
