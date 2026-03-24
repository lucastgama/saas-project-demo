"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, addSale } from "@/lib/store";
import { Product, SaleItem } from "@/lib/types";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Select from "@/components/Select";
import Toast from "@/components/Toast";
import {
  MdQrCode2,
  MdAttachMoney,
  MdCreditCard,
  MdCheckCircle,
  MdShoppingCart,
  MdAddShoppingCart,
} from "react-icons/md";
import type { IconType } from "react-icons";

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type PaymentMethod = "cash" | "card" | "pix";
const paymentOptions: { value: PaymentMethod; label: string; Icon: IconType }[] = [
  { value: "pix",  label: "Pix",      Icon: MdQrCode2 },
  { value: "cash", label: "Dinheiro", Icon: MdAttachMoney },
  { value: "card", label: "Cartao",   Icon: MdCreditCard },
];

export default function VendasPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [selId, setSelId] = useState("");
  const [qty, setQty] = useState(1);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saleTotal, setSaleTotal] = useState(0);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    getProducts().then((prods) => {
      setProducts(prods);
      if (prods.length > 0) setSelId(prods[0].id);
    });
  }, []);

  const selectedProduct = products.find((p) => p.id === selId);
  const total = items.reduce((s, i) => s + i.total, 0);

  function addItem() {
    if (!selectedProduct || qty <= 0) return;
    const existing = items.find((i) => i.productId === selectedProduct.id);
    const newQty = existing ? existing.quantity + qty : qty;
    if (newQty > selectedProduct.stock) {
      setToast({
        msg:
          "Estoque insuficiente: " +
          selectedProduct.stock +
          " " +
          selectedProduct.unit +
          " disponivel.",
        type: "error",
      });
      return;
    }
    if (existing) {
      setItems(
        items.map((i) =>
          i.productId === selectedProduct.id
            ? { ...i, quantity: newQty, total: newQty * i.unitPrice }
            : i,
        ),
      );
    } else {
      setItems([
        ...items,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity: qty,
          unitPrice: selectedProduct.price,
          unitCost: selectedProduct.cost ?? 0,
          total: qty * selectedProduct.price,
        },
      ]);
    }
    setQty(1);
  }

  async function handleFinish() {
    if (items.length === 0) return;
    setBusy(true);
    try {
      await addSale({
        items,
        total,
        paymentMethod: payment,
        note: note || undefined,
      });
      setSaleTotal(total);
      setSuccess(true);
      setItems([]);
      setNote("");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao registrar venda.";
      setToast({ msg, type: "error" });
    } finally {
      setBusy(false);
    }
  }

  function handleNew() {
    setSuccess(false);
    getProducts().then((prods) => {
      setProducts(prods);
      if (prods.length > 0) setSelId(prods[0].id);
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
          <MdCheckCircle size={48} className="text-emerald-500" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Venda registrada!
          </h2>
          <p className="text-slate-500 mt-1">
            Total: <strong>{fmt(saleTotal)}</strong>
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/historico")}>
            Ver Historico
          </Button>
          <Button onClick={handleNew} size="lg">
            <MdAddShoppingCart size={18} />
            Nova Venda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Nova Venda</h1>
        <p className="text-slate-500 text-sm">
          Adicione produtos e finalize a venda.
        </p>
      </div>

      <Card>
        <h2 className="font-semibold text-slate-700 mb-4">Adicionar Produto</h2>
        <div className="space-y-3">
          <Select
            id="product"
            label="Produto"
            value={selId}
            onChange={(e) => setSelId(e.target.value)}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id} disabled={p.stock === 0}>
                {p.name} — {fmt(p.price)} (estoque: {p.stock} {p.unit})
                {p.stock === 0 ? " — Sem estoque" : ""}
              </option>
            ))}
          </Select>

          {selectedProduct && (
            <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm">
              <span className="font-medium text-blue-700">
                {selectedProduct.name}
              </span>
              <span className="text-slate-500 ml-2">
                · {fmt(selectedProduct.price)} por {selectedProduct.unit}
              </span>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-slate-700 block mb-1">
                Quantidade
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-16 text-center px-2 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-400"
                />
                <button
                  onClick={() => setQty(qty + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            <Button
              onClick={addItem}
              size="lg"
              disabled={!selectedProduct || selectedProduct.stock === 0}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </Card>

      {items.length > 0 && (
        <Card>
          <h2 className="font-semibold text-slate-700 mb-3">Itens da Venda</h2>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between py-3 gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {item.quantity} x {fmt(item.unitPrice)}
                  </p>
                </div>
                <span className="font-bold text-slate-800 text-sm">
                  {fmt(item.total)}
                </span>
                <button
                  onClick={() =>
                    setItems(
                      items.filter((i) => i.productId !== item.productId),
                    )
                  }
                  className="text-red-400 hover:text-red-600 p-1 rounded transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 mt-2 pt-3 flex justify-between items-center">
            <span className="font-semibold text-slate-700">Total</span>
            <span className="text-xl font-bold text-blue-600">
              {fmt(total)}
            </span>
          </div>
        </Card>
      )}

      {items.length > 0 && (
        <Card>
          <h2 className="font-semibold text-slate-700 mb-4">Pagamento</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {paymentOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPayment(opt.value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-colors font-medium text-sm ${
                  payment === opt.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <opt.Icon size={28} />
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 block mb-1">
              Observacao (opcional)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex: cliente levou entrega..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-sm outline-none"
            />
          </div>
          <Button
            variant="success"
            size="lg"
            className="w-full"
            onClick={handleFinish}
            disabled={busy}
          >
            {busy ? "Registrando..." : "Finalizar Venda · " + fmt(total)}
          </Button>
        </Card>
      )}

      {items.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          <MdShoppingCart size={48} className="mx-auto mb-3 opacity-40" />
          <p>Nenhum produto adicionado ainda.</p>
        </div>
      )}
    </div>
  );
}
