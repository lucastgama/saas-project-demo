"use client";

import { useEffect, useState } from "react";
import { getProducts, getSales, getExpenses } from "@/lib/store";
import {
  computeKPIs,
  computeAlerts,
  computeInsights,
  computeSuggestions,
  type Alert,
  type Insight,
  type Suggestion,
} from "@/lib/analytics";
import { Product, Sale, Expense } from "@/lib/types";
import Card from "@/components/Card";
import Link from "next/link";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdWarning,
  MdShoppingCart,
  MdAttachMoney,
  MdLightbulb,
  MdBarChart,
} from "react-icons/md";

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <Card className="flex flex-col gap-1">
      <p className={`text-xs font-medium uppercase tracking-wide ${accent}`}>
        {label}
      </p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{sub}</p>
    </Card>
  );
}

const paymentLabel: Record<string, string> = {
  cash: "Dinheiro",
  card: "Cartão",
  pix: "Pix",
};

const suggestionEmoji: Record<Suggestion["type"], string> = {
  restock: "📦",
  review: "📊",
  promote: "🏷️",
};

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prods, sls, exps] = await Promise.all([
        getProducts(),
        getSales(),
        getExpenses(),
      ]);
      setProducts(prods);
      setSales(sls);
      setExpenses(exps);
      setLoading(false);
    }
    load().catch(console.error);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const kpis = computeKPIs(sales, expenses);
  const alerts = computeAlerts(products, sales);
  const insights = computeInsights(sales);
  const suggestions = computeSuggestions(alerts, insights);
  const recentSales = sales.slice(0, 5);
  const trendUp =
    kpis.prevMonthRevenue === 0 || kpis.monthRevenue >= kpis.prevMonthRevenue;

  const insightList: (Insight | null)[] = [
    insights.mostSold,
    insights.mostProfitable,
    insights.lowPerformer,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Visão geral do seu negócio
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${
            trendUp
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {trendUp ? <MdTrendingUp size={18} /> : <MdTrendingDown size={18} />}
          {trendUp ? "Acima do mês anterior" : "Abaixo do mês anterior"}
        </span>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Hoje
        </p>
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            label="Vendas Hoje"
            value={fmt(kpis.todayRevenue)}
            sub={`${kpis.todaySalesCount} ${kpis.todaySalesCount === 1 ? "venda" : "vendas"}`}
            accent="text-blue-500"
          />
          <KpiCard
            label="Lucro Hoje"
            value={fmt(kpis.todayProfit)}
            sub="após custo dos produtos"
            accent="text-emerald-500"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Este Mês
        </p>
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            label="Receita do Mês"
            value={fmt(kpis.monthRevenue)}
            sub={`${kpis.monthSalesCount} ${kpis.monthSalesCount === 1 ? "venda" : "vendas"}`}
            accent="text-blue-500"
          />
          <KpiCard
            label="Lucro Real"
            value={fmt(kpis.realMonthProfit)}
            sub={`${fmt(kpis.monthExpenses)} em despesas`}
            accent={kpis.realMonthProfit >= 0 ? "text-emerald-500" : "text-red-500"}
          />
        </div>
      </div>

      {alerts.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <MdWarning className="text-amber-500" size={20} />
            <h2 className="font-semibold text-slate-700">Alertas</h2>
            <span className="ml-auto text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {alerts.length}
            </span>
          </div>
          <div className="space-y-2">
            {alerts.map((a: Alert) => (
              <div
                key={a.id}
                className={`flex items-start gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ${
                  a.severity === "critical"
                    ? "bg-red-50 text-red-800"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                <MdWarning
                  size={16}
                  className={`mt-0.5 shrink-0 ${a.severity === "critical" ? "text-red-500" : "text-amber-500"}`}
                />
                {a.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      {insightList.some(Boolean) && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <MdBarChart className="text-blue-500" size={20} />
            <h2 className="font-semibold text-slate-700">
              Insights de Produtos
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {insightList
              .filter((ins): ins is Insight => ins !== null)
              .map((ins) => (
                <div
                  key={ins.label}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="text-xs text-slate-500">{ins.label}</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {ins.productName}
                    </p>
                  </div>
                  <span className="text-sm text-slate-500">{ins.detail}</span>
                </div>
              ))}
          </div>
        </Card>
      )}

      {suggestions.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <MdLightbulb className="text-yellow-500" size={20} />
            <h2 className="font-semibold text-slate-700">Sugestões</h2>
          </div>
          <ul className="space-y-2">
            {suggestions.map((s: Suggestion) => (
              <li
                key={s.id}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                <span className="shrink-0">{suggestionEmoji[s.type]}</span>
                {s.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/vendas">
          <div className="bg-blue-500 hover:bg-blue-600 transition-colors rounded-2xl p-5 text-white text-center cursor-pointer shadow-sm">
            <div className="flex justify-center mb-2">
              <MdShoppingCart size={40} />
            </div>
            <p className="font-semibold text-sm">Nova Venda</p>
          </div>
        </Link>
        <Link href="/financeiro">
          <div className="bg-emerald-500 hover:bg-emerald-600 transition-colors rounded-2xl p-5 text-white text-center cursor-pointer shadow-sm">
            <div className="flex justify-center mb-2">
              <MdAttachMoney size={40} />
            </div>
            <p className="font-semibold text-sm">Despesas</p>
          </div>
        </Link>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-700">Últimas Vendas</h2>
          <Link
            href="/historico"
            className="text-sm text-blue-600 hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            Nenhuma venda registrada.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {sale.items.map((i) => i.productName).join(", ")}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(sale.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {paymentLabel[sale.paymentMethod] ?? sale.paymentMethod}
                  </p>
                </div>
                <span className="font-bold text-slate-800 text-sm">
                  {fmt(sale.total)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
