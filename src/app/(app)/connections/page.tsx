import { getCursorConnection } from "@/application/connection";
import { canManageConnections, canSyncConnections } from "@/domain/organization";
import { CursorConnectionManager } from "@/components/connections/cursor-connection-manager";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate, formatDateTime } from "@/lib/format";
import { withOrgPage } from "@/lib/with-org-page";

export default async function ConnectionsPage() {
  return withOrgPage(async ({ organization, role }) => {
    const connection = await getCursorConnection(organization.id);

    return (
      <div className="space-y-8">
        <PageHeader
          kicker="Connections"
          title="AI tools"
          description="Connect the tools your team pays for. Keys are encrypted at rest and never shown again. We read spend only; nothing is changed in your account."
        />
        <CursorConnectionManager
          canManage={canManageConnections(role)}
          canSync={canSyncConnections(role)}
          connection={
            connection
              ? {
                  status: connection.status,
                  keyHint: connection.keyHint,
                  memberCount: connection.memberCount,
                  cycleStartLabel: formatDate(connection.cycleStart),
                  lastSyncedLabel: formatDateTime(connection.lastSyncedAt),
                  lastError: connection.lastError,
                }
              : null
          }
        />
        <p className="text-sm text-mc-ink-soft">
          OpenAI and Anthropic are coming next.
        </p>
      </div>
    );
  });
}
