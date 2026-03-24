"use client";

import { useEffect, useState } from "react";
import { getSales } from "@/lib/store";
import { Sale } from "@/lib/types";
import Card from "@/components/Card";
import { MdHistory, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function toInputDate(iso: string) { return iso.slice(0, 10); }

const paymentLabel: Record<string, string> = {
  cash: "Dinheiro", card: "Cartao", pix: "Pix",
};
const paymentColors: Record<string, string> = {
  cash: "bg-yellow-100 text-yellow-700",
  card: "bg-purple-100 text-purple-700",
  pix:  "bg-blue-100 text-blue-700",
};

export default function HistoricoPage() {
  const [sales,         setSales]         = useState<Sale[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [dateFrom,      setDateFrom]      = useState("");
  const [dateTo,        setDateTo]        = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [expanded,      setExpanded]      = useState<string | null>(null);

  useEffect(() => {
    getSales().then((s) => { setSales(s); setLoading(false); }).catch(console.error);
  }, []);

  const filtered = sales.filter((s) => {
    const sDate = toInputDate(s.createdAt);
    if (dateFrom && sDate < dateFrom) return false;
    if (dateTo   && sDate > dateTo)   return false;
    if (paymentFilter !== "all" && s.paymentMethod !== paymentFilter) return false;
    return true;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);
  const hasFilters = dateFrom || dateTo || paymentFilter !== "all";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Historico de Vendas</h1>
        <p className="text-slate-500 text-sm">
          {filtered.length} venda(s) · Total: <strong>{fmt(totalRevenue)}</strong>
        </p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-700 text-sm">Filtros</h2>
          {hasFilters && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setPaymentFilter("all"); }}
              className="text-xs text-blue-600 hover:underline">Limpar filtros</button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">De</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Ate</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Pagamento</label>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 appearance-none cursor-pointer">
              <option value="all">Todos</option>
              <option value="pix">Pix</option>
              <option value="cash">Dinheiro</option>
              <option value="card">Cartao</option>
            </select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MdHistory size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma venda encontrada.</p>
          {hasFilters && <p className="text-sm mt-1">Tente ajustar os filtros.</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((sale) => (
            <Card key={sale.id} className="cursor-pointer">
              <div className="flex items-center justify-between gap-3"
                onClick={() => setExpanded(expanded === sale.id ? null : sale.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${paymentColors[sale.paymentMethod]}`}>
                      {paymentLabel[sale.paymentMethod]}
                    </span>
                    <span className="text-xs text-slate-400">{fmtDate(sale.createdAt)}</span>
                  </div>
                  <p className="text-sm text-slate-500 truncate mt-1">
                    {sale.items.map((i) => i.quantity + "x " + i.productName).join(", ")}
                  </p>
                  {sale.note && <p className="text-xs text-slate-400 mt-0.5 italic">"{sale.note}"</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-800">{fmt(sale.total)}</p>
                  <p className="text-xs text-slate-400 flex justify-end">{expanded === sale.id ? <MdKeyboardArrowUp size={16} /> : <MdKeyboardArrowDown size={16} />}</p>
                </div>
              </div>
              {expanded === sale.id && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Itens</p>
                  <div className="space-y-1.5">
                    {sale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">
                          {item.quantity}x {item.productName}{" "}
                          <span className="text-slate-400">@ {fmt(item.unitPrice)}</span>
                        </span>
                        <span className="font-semibold text-slate-700">{fmt(item.total)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 pt-2 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">Total</span>
                    <span className="font-bold text-blue-600">{fmt(sale.total)}</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
