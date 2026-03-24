"use client";

import { useEffect, useState } from "react";
import { getProducts, getSales } from "@/lib/store";
import { Product, Sale } from "@/lib/types";
import Card from "@/components/Card";
import Link from "next/link";
import {
  MdTrendingUp,
  MdInventory2,
  MdWarning,
  MdShoppingCart,
  MdAddCircle,
} from "react-icons/md";

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [prods, sls] = await Promise.all([getProducts(), getSales()]);
      setProducts(prods);
      setSales(sls);
      setLoading(false);
    }
    load().catch(console.error);
  }, []);

  const todaySales = sales.filter((s) => isToday(s.createdAt));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const lowStock = products.filter((p) => p.stock <= p.minStock);
  const recentSales = sales.slice(0, 5);

  const paymentLabel: Record<string, string> = {
    cash: "Dinheiro",
    card: "Cartao",
    pix: "Pix",
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Vendas de hoje</h1>
        <p className="text-slate-500 text-sm mt-1">
          Aqui esta o resumo do seu negocio hoje.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <MdTrendingUp size={28} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Vendas Hoje
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {fmt(todayRevenue)}
            </p>
            <p className="text-xs text-slate-400">
              {todaySales.length} {todaySales.length === 1 ? "venda" : "vendas"}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <MdInventory2 size={28} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Produtos
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {products.length}
            </p>
            <p className="text-xs text-slate-400">no catalogo</p>
          </div>
        </Card>

        <Card
          className={`flex items-center gap-4 ${lowStock.length > 0 ? "border-orange-200 bg-orange-50" : ""}`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${lowStock.length > 0 ? "bg-orange-100" : "bg-slate-100"}`}
          >
            <MdWarning size={28} className={lowStock.length > 0 ? "text-orange-500" : "text-slate-400"} />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Estoque Baixo
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {lowStock.length}
            </p>
            <p className="text-xs text-slate-400">
              {lowStock.length > 0 ? "produto(s) precisam atencao" : "tudo ok"}
            </p>
          </div>
        </Card>
      </div>

      {lowStock.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <MdWarning size={18} className="text-orange-500" />
              Alertas de Estoque
            </h2>
            <Link
              href="/produtos"
              className="text-sm text-blue-600 hover:underline"
            >
              Ver produtos →
            </Link>
          </div>
          <div className="space-y-2">
            {lowStock.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-2.5"
              >
                <span className="text-sm font-medium text-slate-700">
                  {p.name}
                </span>
                <span className="text-sm font-bold text-orange-600">
                  {p.stock} {p.unit} restantes
                </span>
              </div>
            ))}
          </div>
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
        <Link href="/produtos">
          <div className="bg-emerald-500 hover:bg-emerald-600 transition-colors rounded-2xl p-5 text-white text-center cursor-pointer shadow-sm">
            <div className="flex justify-center mb-2">
              <MdAddCircle size={40} />
            </div>
            <p className="font-semibold text-sm">Adicionar Produto</p>
          </div>
        </Link>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-700">Ultimas Vendas</h2>
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
                    · {paymentLabel[sale.paymentMethod]}
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
