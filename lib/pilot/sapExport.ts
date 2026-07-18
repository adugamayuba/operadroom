import type { WorkOrderDraft } from "@/lib/demo/scenarios";
import { PILOT_TENANT } from "./tenant";

/** SAP PM CSV export v1 — pilot sandbox (not live SAP post) */

export function exportSapPmCsv(
  workOrder: WorkOrderDraft,
  opts: { sapNumber: string; engineerNotes?: string }
): void {
  const rows = [
    ["Field", "Value"],
    ["OrderType", workOrder.orderType],
    ["Priority", workOrder.priority],
    ["Equipment", workOrder.equipment],
    ["FunctionalLocation", workOrder.functionalLocation],
    ["ShortText", workOrder.shortText],
    ["PlannerGroup", workOrder.plannerGroup],
    ["WorkCenter", workOrder.workCenter],
    ["EstimatedHours", String(workOrder.estimatedHours)],
    ["RequiredStart", workOrder.requiredStart],
    ["RequiredEnd", workOrder.requiredEnd],
    ["SAPNumber", opts.sapNumber],
    ["Plant", PILOT_TENANT.facilityCode],
    ["Unit", PILOT_TENANT.unit],
    ["ReelinID", workOrder.reelinId],
    ["EngineerNotes", opts.engineerNotes ?? ""],
    ...workOrder.operations.map((o) => [`Operation_${o.op}`, `${o.description} (${o.duration}h)`]),
    ...workOrder.spareParts.map((p, i) => [`Material_${i + 1}`, `${p.material} x${p.qty} · ${p.status}`]),
  ];

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `SAP-PM-${opts.sapNumber}-CDU1.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
