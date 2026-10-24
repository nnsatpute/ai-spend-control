import { AppError, rethrowSafe } from "@/domain/common";
import type { MemberRole, Organization } from "@/domain/organization";
import { auth } from "@/auth";
import {
  findMembershipRole,
  findOrganizationById,
} from "@/infrastructure/repositories/organization.repository";

export type OrgContext = {
  organization: Organization;
  userId: string;
  role: MemberRole;
};

/** Org + caller role from the signed-in session. Role is re-read from the DB on every call. */
export async function getOrgContext(): Promise<OrgContext> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const orgId = session?.user?.orgId;
    if (!userId || !orgId) {
      throw new AppError("UNAUTHORIZED", "Sign in required");
    }

    const [organization, role] = await Promise.all([
      findOrganizationById(orgId),
      findMembershipRole(userId, orgId),
    ]);
    if (!organization || !role) {
      throw new AppError("UNAUTHORIZED", "Organization not found");
    }

    return { organization, userId, role };
  } catch (error) {
    rethrowSafe(error);
  }
}
