"use client";

import { useEffect, useState, useMemo } from "react";
import { getSales } from "@/lib/store";
import { Sale } from "@/lib/types";
import Card from "@/components/Card";
import { Chart } from "react-google-charts";
import {
  MdBarChart,
  MdPictureAsPdf,
  MdTrendingUp,
  MdShoppingCart,
  MdAttachMoney,
} from "react-icons/md";

type Period = "dia" | "semana" | "mes" | "ano";

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function startOf(period: Period): Date {
  const now = new Date();
  if (period === "dia") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "semana") {
    const day = now.getDay();
    const d = new Date(now);
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "mes") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(now.getFullYear(), 0, 1);
}

function groupByDay(sales: Sale[]): [string, number][] {
  const map: Record<string, number> = {};
  for (const s of sales) {
    const key = s.createdAt.slice(0, 10);
    map[key] = (map[key] ?? 0) + s.total;
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

const paymentLabel: Record<string, string> = {
  cash: "Dinheiro",
  card: "Cartao",
  pix: "Pix",
};

export default function RelatoriosPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("mes");
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    getSales()
      .then((s) => setSales(s))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const start = startOf(period);
    return sales.filter((s) => new Date(s.createdAt) >= start);
  }, [sales, period]);

  const totalRevenue = filtered.reduce((s, v) => s + v.total, 0);
  const avgTicket = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  const revenueByDay = useMemo(() => groupByDay(filtered), [filtered]);
  const revenueChartData: (string | number)[][] = [
    ["Data", "Receita (R$)"],
    ...revenueByDay.map(([date, val]) => [date.slice(5), val]),
  ];

  const paymentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of filtered) {
      const k = paymentLabel[s.paymentMethod] ?? s.paymentMethod;
      map[k] = (map[k] ?? 0) + 1;
    }
    return map;
  }, [filtered]);
  const paymentChartData: (string | number)[][] = [
    ["Pagamento", "Quantidade"],
    ...Object.entries(paymentCounts),
  ];

  const categoryRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of filtered) {
      for (const item of s.items) {
        map[item.productName] = (map[item.productName] ?? 0) + item.total;
      }
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);
  }, [filtered]);
  const topProductsData: (string | number)[][] = [
    ["Produto", "Receita (R$)"],
    ...categoryRevenue,
  ];

  async function handleDownloadPdf() {
    setGeneratingPdf(true);
    try {
      const res = await fetch("/api/relatorio-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sales: filtered, period }),
      });
      if (!res.ok) throw new Error("Erro ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-vendas-${period}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGeneratingPdf(false);
    }
  }

  const periods: { value: Period; label: string }[] = [
    { value: "dia",    label: "Hoje" },
    { value: "semana", label: "Esta Semana" },
    { value: "mes",    label: "Este Mes" },
    { value: "ano",    label: "Este Ano" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MdBarChart size={28} className="text-blue-600" />
            Relatorios
          </h1>
          <p className="text-slate-500 text-sm mt-1">Analise o desempenho do seu negocio.</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={generatingPdf || filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <MdPictureAsPdf size={20} />
          {generatingPdf ? "Gerando..." : "Exportar PDF"}
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              period === p.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <MdAttachMoney size={28} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Receita Total</p>
                <p className="text-2xl font-bold text-slate-800">{fmt(totalRevenue)}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <MdShoppingCart size={28} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Vendas</p>
                <p className="text-2xl font-bold text-slate-800">{filtered.length}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <MdTrendingUp size={28} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Ticket Medio</p>
                <p className="text-2xl font-bold text-slate-800">{fmt(avgTicket)}</p>
              </div>
            </Card>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <p className="text-center text-slate-400 py-8">Nenhuma venda no periodo selecionado.</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h2 className="font-semibold text-slate-700 mb-4">Receita por Dia</h2>
                  <Chart
                    chartType="ColumnChart"
                    data={revenueChartData}
                    width="100%"
                    height="260px"
                    options={{
                      legend: "none",
                      colors: ["#3b82f6"],
                      chartArea: { width: "85%", height: "75%" },
                      hAxis: { textStyle: { fontSize: 11 } },
                      vAxis: { textStyle: { fontSize: 11 }, format: "R$#,###" },
                      bar: { groupWidth: "60%" },
                    }}
                  />
                </Card>

                <Card>
                  <h2 className="font-semibold text-slate-700 mb-4">Vendas por Metodo de Pagamento</h2>
                  <Chart
                    chartType="PieChart"
                    data={paymentChartData}
                    width="100%"
                    height="260px"
                    options={{
                      colors: ["#3b82f6", "#10b981", "#f59e0b"],
                      chartArea: { width: "80%", height: "80%" },
                      legend: { position: "bottom" },
                      pieHole: 0.4,
                    }}
                  />
                </Card>
              </div>

              {categoryRevenue.length > 0 && (
                <Card>
                  <h2 className="font-semibold text-slate-700 mb-4">Top Produtos por Receita</h2>
                  <Chart
                    chartType="BarChart"
                    data={topProductsData}
                    width="100%"
                    height="280px"
                    options={{
                      legend: "none",
                      colors: ["#8b5cf6"],
                      chartArea: { width: "65%", height: "80%" },
                      hAxis: { format: "R$#,###", textStyle: { fontSize: 11 } },
                      vAxis: { textStyle: { fontSize: 11 } },
                    }}
                  />
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
