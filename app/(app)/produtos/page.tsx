"use client";

import { useEffect, useRef, useState } from "react";
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from "@/lib/store";
import { Product } from "@/lib/types";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import {
  MdAdd,
  MdSearch,
  MdEdit,
  MdDelete,
  MdWarning,
  MdInventory2,
} from "react-icons/md";
const UNITS = ["un", "pct", "kg", "L", "cx"];

type FormData = Omit<Product, "id">;
const empty: FormData = {
  name: "",
  category: "",
  price: 0,
  cost: 0,
  stock: 0,
  minStock: 3,
  unit: "un",
};

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refresh();
    getCategories().then((cats) => {
      setCategories(cats);
      setForm((f) => ({ ...f, category: cats[0] ?? "" }));
    });
  }, []);

  useEffect(() => {
    if (formOpen) setTimeout(() => nameRef.current?.focus(), 100);
  }, [formOpen]);

  async function refresh() {
    setLoading(true);
    setProducts(await getProducts());
    setLoading(false);
  }

  function openCreate() {
    setForm(empty);
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(p: Product) {
    const { id, ...rest } = p;
    setForm(rest);
    setEditingId(id);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      if (editingId) {
        await updateProduct(editingId, form);
        setToast({ msg: "Produto atualizado!", type: "success" });
      } else {
        await addProduct(form);
        setToast({ msg: "Produto criado!", type: "success" });
      }
      setFormOpen(false);
      await refresh();
    } catch {
      setToast({ msg: "Erro ao salvar produto.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await deleteProduct(deleteId);
      setDeleteId(null);
      setToast({ msg: "Produto removido.", type: "success" });
      await refresh();
    } catch {
      setToast({ msg: "Erro ao remover produto.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  function set(field: keyof FormData, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()),
  );

  const productToDelete = products.find((p) => p.id === deleteId);

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Produtos</h1>
          <p className="text-slate-500 text-sm">
            {products.length} produto(s) no catalogo
          </p>
        </div>
        <Button onClick={openCreate} size="lg" className="flex items-center gap-2">
          <MdAdd size={20} />
          Novo Produto
        </Button>
      </div>

      <div className="relative">
        <MdSearch size={20} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Buscar produto ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MdInventory2 size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isLow = p.stock <= p.minStock;
            return (
              <Card
                key={p.id}
                className={`flex flex-col gap-3 ${isLow ? "border-orange-200" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 leading-tight">
                      {p.name}
                    </h3>
                    <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600 whitespace-nowrap block">
                      {fmt(p.price)}
                    </span>
                    {p.cost > 0 && (
                      <span className="text-xs text-slate-400">
                        margem:{" "}
                        {Math.round(((p.price - p.cost) / p.price) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${isLow ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {isLow && <MdWarning size={14} />}
                    {p.stock} {p.unit}
                  </span>
                  <span className="text-xs text-slate-400">
                    min: {p.minStock}
                  </span>
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-1"
                    onClick={() => openEdit(p)}
                  >
                    <MdEdit size={16} />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteId(p.id)}
                  >
                    <MdDelete size={16} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              {editingId ? "Editar Produto" : "Novo Produto"}
            </h2>
            <div className="space-y-4">
              <Input
                ref={nameRef}
                id="name"
                label="Nome *"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex: Arroz 5kg"
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  id="category"
                  label="Categoria"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
                <Select
                  id="unit"
                  label="Unidade"
                  value={form.unit}
                  onChange={(e) => set("unit", e.target.value)}
                >
                  {UNITS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </Select>
              </div>
              <Input
                id="price"
                label="Preco de Venda (R$) *"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
              />
              <Input
                id="cost"
                label="Custo (R$)"
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) => set("cost", parseFloat(e.target.value) || 0)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="stock"
                  label="Qtd em Estoque"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => set("stock", parseInt(e.target.value) || 0)}
                />
                <Input
                  id="minStock"
                  label="Estoque Minimo"
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) =>
                    set("minStock", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={!form.name.trim() || busy}
              >
                {busy ? "Salvando..." : editingId ? "Salvar" : "Criar Produto"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!deleteId}
        title="Remover Produto"
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        confirmLabel={busy ? "Removendo..." : "Remover"}
        confirmVariant="danger"
      >
        Tem certeza que deseja remover <strong>{productToDelete?.name}</strong>?
      </Modal>
    </div>
  );
}
