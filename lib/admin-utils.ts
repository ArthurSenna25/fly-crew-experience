import * as XLSX from 'xlsx';

export const STATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
  new: { label: "Novo", bgColor: "#60A5FA", textColor: "#60A5FA", borderColor: "#60A5FA" },
  contacted: { label: "Contatado", bgColor: "#FBBF24", textColor: "#FBBF24", borderColor: "#FBBF24" },
  converted: { label: "Ativo", bgColor: "#10B981", textColor: "#10B981", borderColor: "#10B981" },
  archived: { label: "Desativado", bgColor: "#AEB7C1", textColor: "#AEB7C1", borderColor: "#AEB7C1" },
  active: { label: "Ativo", bgColor: "#10B981", textColor: "#10B981", borderColor: "#10B981" },
};

export const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Baixa", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
  normal: { label: "Normal", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  high: { label: "Alta", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  urgent: { label: "Urgente", color: "bg-red-500/20 text-red-300 border-red-500/30" },
};

export const TAG_COLORS: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  green: "bg-green-500/20 text-green-300 border-green-500/30",
  yellow: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  red: "bg-red-500/20 text-red-300 border-red-500/30",
  purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  pink: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
};

export function exportToCSV(
  data: any[],
  filename: string,
  columns: { key: string; label: string }[]
) {
  if (!data || data.length === 0) {
    alert("Nenhum dado para exportar");
    return;
  }
  const headers = columns.map((c) => c.label).join(",");
  const rows = data.map((item) =>
    columns
      .map((c) => {
        let value: any = item[c.key];
        if (value === null || value === undefined) value = "";
        if (typeof value === "string") {
          value = value.replace(/"/g, '""');
          if (value.includes(",") || value.includes("\n") || value.includes('"')) value = `"${value}"`;
        }
        return value;
      })
      .join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function exportToExcel(
  data: any[],
  filename: string,
  columns: { key: string; label: string }[]
) {
  if (!data || data.length === 0) {
    alert("Nenhum dado para exportar");
    return;
  }

  // Prepare data for Excel
  const excelData = data.map((item) => {
    const row: any = {};
    columns.forEach((col) => {
      let value: any = item[col.key];

      // Format dates
      if (col.key.includes('Date') || col.key.includes('At')) {
        value = value ? formatDate(value) : '';
      }

      // Format arrays (tags)
      if (Array.isArray(value)) {
        value = ', ';
      }

      if (value === null || value === undefined) {
        value = '';
      }

      row[col.label] = value || '';
    });
    return row;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = columns.map((col) => ({
    wch: Math.max(col.label.length, 15)
  }));
  ws['!cols'] = colWidths;

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');

  // Generate file
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

export function filterByDateRange<T extends { createdAt: any }>(items: T[], range: string): T[] {
  if (!range || range === "all") return items;
  const now = new Date();
  let startDate: Date;
  switch (range) {
    case "today":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "7days":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30days":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90days":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      return items;
  }
  return items.filter((item) => new Date(item.createdAt) >= startDate);
}

export function searchFilter<T extends Record<string, any>>(items: T[], query: string, fields: string[]): T[] {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter((item) => fields.some((f) => item[f] && String(item[f]).toLowerCase().includes(q)));
}

export function formatDate(dateString: any): string {
  try {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return String(dateString);
  }
}

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function filterByTags<T extends { tags?: string[] }>(items: T[], selectedTags: string[]): T[] {
  if (!selectedTags || selectedTags.length === 0) return items;
  return items.filter((item) => {
    if (!item.tags || !Array.isArray(item.tags)) return false;
    return selectedTags.some(tag => item.tags!.includes(tag));
  });
}

export function filterByPriority<T extends { priority?: string }>(items: T[], priority: string): T[] {
  if (!priority || priority === "all") return items;
  return items.filter((item) => (item.priority || "normal") === priority);
}

export function filterByReadStatus<T extends { isRead?: boolean }>(items: T[], status: string): T[] {
  if (!status || status === "all") return items;
  if (status === "read") return items.filter((item) => item.isRead === true);
  if (status === "unread") return items.filter((item) => item.isRead !== true);
  return items;
}