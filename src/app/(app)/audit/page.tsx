import { listAuditLogs } from "@/infrastructure/repositories/audit.repository";
import { DataRow, DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { formatDateTime } from "@/lib/format";
import { withOrgPage } from "@/lib/with-org-page";

export default async function AuditPage() {
  return withOrgPage(async ({ organization }) => {
    const rows = await listAuditLogs(organization.id);

    return (
      <div className="space-y-8">
        <PageHeader
          kicker="Audit"
          title="What changed"
          description="Connect, disconnect, budget changes, manager imports, and usage spikes. Keys are never written here."
        />
        <Panel title="Recent events" bodyClassName="!px-0 !pb-0">
          <DataTable
            headers={["When", "Action", "Detail"]}
            empty={rows.length === 0}
            emptyMessage="Nothing recorded yet."
          >
            {rows.map((row) => (
              <DataRow key={row.id}>
                <td className="px-6 py-3.5 whitespace-nowrap text-mc-ink-soft">
                  {formatDateTime(row.createdAt)}
                </td>
                <td className="px-6 py-3.5 font-mono-mc text-mc-ink">{row.action}</td>
                <td className="px-6 py-3.5 text-mc-ink-soft">{row.detail ?? "—"}</td>
              </DataRow>
            ))}
          </DataTable>
        </Panel>
      </div>
    );
  });
}
