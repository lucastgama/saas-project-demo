import { Product, Sale, SaleItem, Expense } from "./types";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}

function isSameMonth(iso: string, year: number, month: number): boolean {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() === month;
}

export function saleItemProfit(item: SaleItem): number {
  return (item.unitPrice - (item.unitCost ?? 0)) * item.quantity;
}

export function saleProfit(sale: Sale): number {
  return sale.items.reduce((sum, item) => sum + saleItemProfit(item), 0);
}

export type KPIs = {
  todayRevenue: number;
  todayProfit: number;
  todaySalesCount: number;
  monthRevenue: number;
  monthProfit: number;
  monthSalesCount: number;
  monthExpenses: number;
  realMonthProfit: number;
  prevMonthRevenue: number;
};

export function computeKPIs(sales: Sale[], expenses: Expense[]): KPIs {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const todaySales = sales.filter((s) => isToday(s.createdAt));
  const monthSales = sales.filter((s) => isSameMonth(s.createdAt, year, month));
  const prevMonthSales = sales.filter((s) => isSameMonth(s.createdAt, prevYear, prevMonth));

  const todayRevenue = todaySales.reduce((s, v) => s + v.total, 0);
  const todayProfit = todaySales.reduce((s, v) => s + saleProfit(v), 0);
  const monthRevenue = monthSales.reduce((s, v) => s + v.total, 0);
  const monthProfit = monthSales.reduce((s, v) => s + saleProfit(v), 0);
  const prevMonthRevenue = prevMonthSales.reduce((s, v) => s + v.total, 0);

  const monthExpenses = expenses
    .filter((e) => isSameMonth(e.date, year, month))
    .reduce((s, e) => s + e.value, 0);

  return {
    todayRevenue,
    todayProfit,
    todaySalesCount: todaySales.length,
    monthRevenue,
    monthProfit,
    monthSalesCount: monthSales.length,
    monthExpenses,
    realMonthProfit: monthProfit - monthExpenses,
    prevMonthRevenue,
  };
}

export type AlertSeverity = "warning" | "critical";

export type Alert = {
  id: string;
  type: "low_stock" | "idle_product" | "sales_drop";
  message: string;
  severity: AlertSeverity;
};

export function computeAlerts(products: Product[], sales: Sale[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  for (const p of products) {
    console.log(`Produto ${p.name}: stock=${p.stock}, minStock=${p.minStock}`);
    if (p.stock === 0) {
      alerts.push({
        id: `low_${p.id}`,
        type: "low_stock",
        message: `Sem estoque: ${p.name}`,
        severity: "critical",
      });
    } else if (p.stock < p.minStock) {
      alerts.push({
        id: `low_${p.id}`,
        type: "low_stock",
        message: `Estoque crítico: ${p.name} (${p.stock} ${p.unit})`,
        severity: "warning",
      });
    }
  }

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const hasSalesHistory = sales.some((s) => new Date(s.createdAt) < fourteenDaysAgo);

  if (hasSalesHistory) {
    const recentSoldIds = new Set(
      sales
        .filter((s) => new Date(s.createdAt) >= fourteenDaysAgo)
        .flatMap((s) => s.items.map((i) => i.productId)),
    );
    const everSoldIds = new Set(sales.flatMap((s) => s.items.map((i) => i.productId)));

    for (const p of products) {
      if (everSoldIds.has(p.id) && !recentSoldIds.has(p.id)) {
        alerts.push({
          id: `idle_${p.id}`,
          type: "idle_product",
          message: `Produto parado há +14 dias: ${p.name}`,
          severity: "warning",
        });
      }
    }
  }

  const year = now.getFullYear();
  const month = now.getMonth();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const currentRevenue = sales
    .filter((s) => isSameMonth(s.createdAt, year, month))
    .reduce((s, v) => s + v.total, 0);
  const prevRevenue = sales
    .filter((s) => isSameMonth(s.createdAt, prevYear, prevMonth))
    .reduce((s, v) => s + v.total, 0);

  if (prevRevenue > 0 && currentRevenue < prevRevenue * 0.8) {
    const drop = Math.round((1 - currentRevenue / prevRevenue) * 100);
    alerts.push({
      id: "sales_drop",
      type: "sales_drop",
      message: `Queda de ${drop}% nas vendas em relação ao mês anterior`,
      severity: "critical",
    });
  }

  return alerts;
}

export type Insight = {
  label: string;
  productName: string;
  detail: string;
  value: number;
};

export function computeInsights(sales: Sale[]): {
  mostSold: Insight | null;
  mostProfitable: Insight | null;
  lowPerformer: Insight | null;
} {
  const revenueByProduct: Record<string, number> = {};
  const profitByProduct: Record<string, number> = {};
  const countByProduct: Record<string, number> = {};

  for (const sale of sales) {
    for (const item of sale.items) {
      revenueByProduct[item.productName] = (revenueByProduct[item.productName] ?? 0) + item.total;
      profitByProduct[item.productName] =
        (profitByProduct[item.productName] ?? 0) + saleItemProfit(item);
      countByProduct[item.productName] =
        (countByProduct[item.productName] ?? 0) + item.quantity;
    }
  }

  const byCount = Object.entries(countByProduct).sort(([, a], [, b]) => b - a);
  const byProfit = Object.entries(profitByProduct).sort(([, a], [, b]) => b - a);
  const byRevenue = Object.entries(revenueByProduct).sort(([, a], [, b]) => a - b);

  const mostSold = byCount[0]
    ? { label: "Mais Vendido", productName: byCount[0][0], detail: `${byCount[0][1]} unidades`, value: byCount[0][1] }
    : null;

  const mostProfitable = byProfit[0]
    ? { label: "Mais Lucrativo", productName: byProfit[0][0], detail: byProfit[0][1].toLocaleString("pt-BR", { style: "currency", currency: "BRL" }), value: byProfit[0][1] }
    : null;

  const lowPerformer =
    byRevenue[0] && byRevenue.length >= 3
      ? { label: "Baixo Desempenho", productName: byRevenue[0][0], detail: byRevenue[0][1].toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) + " em receita", value: byRevenue[0][1] }
      : null;

  return { mostSold, mostProfitable, lowPerformer };
}

export type Suggestion = {
  id: string;
  message: string;
  type: "restock" | "review" | "promote";
};

export function computeSuggestions(alerts: Alert[], insights: ReturnType<typeof computeInsights>): Suggestion[] {
  const suggestions: Suggestion[] = [];

  for (const alert of alerts) {
    if (alert.type === "low_stock") {
      const name = alert.message.split(": ")[1]?.split(" (")[0];
      if (name) {
        suggestions.push({ id: `restock_${name}`, message: `Repor estoque de "${name}"`, type: "restock" });
      }
    }
    if (alert.type === "idle_product") {
      const name = alert.message.split(": ")[1];
      if (name) {
        suggestions.push({ id: `promote_${name}`, message: `Faça uma promoção ou revise o preço de "${name}"`, type: "promote" });
      }
    }
    if (alert.type === "sales_drop") {
      suggestions.push({ id: "sales_drop", message: "Revise sua estratégia de vendas deste mês", type: "review" });
    }
  }

  if (insights.lowPerformer) {
    suggestions.push({
      id: `review_${insights.lowPerformer.productName}`,
      message: `Avalie parar de vender "${insights.lowPerformer.productName}" ou ajustar o preço`,
      type: "review",
    });
  }

  return suggestions;
}
