import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  isAppError,
  isDatabaseUnavailable,
  rethrowSafe,
} from "@/domain/common";
import { getOrgContext, type OrgContext } from "@/lib/org";
import { ServiceUnavailable } from "@/components/ui/service-unavailable";

/**
 * Loads the organization and renders the page.
 * On DB outage, returns a clean "Service unavailable" UI — never Prisma text.
 */
export async function withOrgPage(
  render: (context: OrgContext) => Promise<ReactNode> | ReactNode,
): Promise<ReactNode> {
  try {
    const context = await getOrgContext();
    return await render(context);
  } catch (error) {
    if (isAppError(error) && error.code === "UNAUTHORIZED") {
      redirect("/login");
    }

    if (
      (isAppError(error) && error.code === "SERVICE_UNAVAILABLE") ||
      isDatabaseUnavailable(error)
    ) {
      console.error("[db] unavailable", error);
      return <ServiceUnavailable />;
    }

    rethrowSafe(error);
  }
}
