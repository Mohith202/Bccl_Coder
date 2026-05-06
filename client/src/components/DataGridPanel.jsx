import { useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { Card } from "./Card.jsx";

function toCsv(rows) {
  if (!rows || rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const head = cols.join(",");
  const body = rows.map(r => cols.map(c => {
    const v = r[c];
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(",")).join("\n");
  return head + "\n" + body;
}

export default function DataGridPanel({ title, rows = [], columns, height = 360 }) {
  const ref = useRef(null);
  const cols = useMemo(() => {
    if (columns) return columns;
    const sample = rows[0] || {};
    return Object.keys(sample).map(k => ({ field: k, sortable: true, filter: true, resizable: true }));
  }, [columns, rows]);

  const exportCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(title || "table").replace(/\s+/g, "_")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-ink-800">{title}</h3>
        <button
          onClick={exportCsv}
          className="text-xs px-2.5 py-1.5 rounded-md border border-ink-200 hover:bg-ink-50 transition mono"
        >
          Export CSV
        </button>
      </div>
      <div className="ag-theme-quartz" style={{ height, width: "100%" }}>
        <AgGridReact
          ref={ref}
          rowData={rows}
          columnDefs={cols}
          defaultColDef={{ sortable: true, filter: true, resizable: true, flex: 1, minWidth: 120 }}
          animateRows
          pagination
          paginationPageSize={25}
        />
      </div>
    </Card>
  );
}
