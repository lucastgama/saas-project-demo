"use client";

import { useEffect, useRef, useState } from "react";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/store";
import { Expense } from "@/lib/types";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Toast from "@/components/Toast";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdAttachMoney,
} from "react-icons/md";

type FormData = Omit<Expense, "id">;

const today = new Date().toISOString().split("T")[0];

const empty: FormData = { name: "", value: 0, date: today };

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthLabel(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function isSameMonth(date: string, ref: string) {
  return date.slice(0, 7) === ref.slice(0, 7);
}

export default function FinanceiroPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (formOpen) setTimeout(() => nameRef.current?.focus(), 100);
  }, [formOpen]);

  async function refresh() {
    setLoading(true);
    setExpenses(await getExpenses());
    setLoading(false);
  }

  function openCreate() {
    setForm({ ...empty, date: today });
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(e: Expense) {
    const { id, ...rest } = e;
    setForm(rest);
    setEditingId(id);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || form.value <= 0) return;
    setBusy(true);
    try {
      if (editingId) {
        await updateExpense(editingId, form);
        setToast({ msg: "Despesa atualizada!", type: "success" });
      } else {
        await addExpense(form);
        setToast({ msg: "Despesa registrada!", type: "success" });
      }
      setFormOpen(false);
      await refresh();
    } catch {
      setToast({ msg: "Erro ao salvar despesa.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setBusy(true);
    try {
      await deleteExpense(deleteId);
      setDeleteId(null);
      setToast({ msg: "Despesa removida.", type: "success" });
      await refresh();
    } catch {
      setToast({ msg: "Erro ao remover despesa.", type: "error" });
    } finally {
      setBusy(false);
    }
  }

  function setField(field: keyof FormData, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Group by month
  const now = new Date().toISOString();
  const thisMonthExpenses = expenses.filter((e) => isSameMonth(e.date, now));
  const thisMonthTotal = thisMonthExpenses.reduce((s, e) => s + e.value, 0);
  const expenseToDelete = expenses.find((e) => e.id === deleteId);

  // Group all expenses by month for display
  const byMonth: Record<string, Expense[]> = {};
  for (const e of expenses) {
    const key = e.date.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(e);
  }
  const sortedMonths = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

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
          <h1 className="text-2xl font-bold text-slate-800">Financeiro</h1>
          <p className="text-slate-500 text-sm">Controle de despesas</p>
        </div>
        <Button
          onClick={openCreate}
          size="lg"
          className="flex items-center gap-2"
        >
          <MdAdd size={20} />
          Nova Despesa
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <MdAttachMoney size={28} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Despesas este Mês
            </p>
            <p className="text-2xl font-bold text-slate-800">
              {fmt(thisMonthTotal)}
            </p>
            <p className="text-xs text-slate-400">
              {thisMonthExpenses.length} lançamento(s)
            </p>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MdAttachMoney size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma despesa registrada.</p>
          <p className="text-sm mt-1">
            Adicione suas despesas para calcular o lucro real.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map((monthKey) => {
            const monthExpenses = byMonth[monthKey];
            const monthTotal = monthExpenses.reduce(
              (s, e) => s + e.value,
              0,
            );
            const label = monthLabel(monthKey + "-01");
            return (
              <Card key={monthKey}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-700 capitalize">
                    {label}
                  </h2>
                  <span className="text-sm font-bold text-red-600">
                    {fmt(monthTotal)}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {monthExpenses.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {e.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(e.date + "T12:00:00").toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800">
                          {fmt(e.value)}
                        </span>
                        <button
                          onClick={() => openEdit(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Editar"
                        >
                          <MdEdit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(e.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Excluir"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <h2 className="text-lg font-bold text-slate-800 mb-5">
              {editingId ? "Editar Despesa" : "Nova Despesa"}
            </h2>
            <div className="space-y-4">
              <Input
                ref={nameRef}
                id="exp-name"
                label="Descrição *"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Ex: Aluguel, Energia..."
              />
              <Input
                id="exp-value"
                label="Valor (R$) *"
                type="number"
                min="0.01"
                step="0.01"
                value={form.value}
                onChange={(e) =>
                  setField("value", parseFloat(e.target.value) || 0)
                }
              />
              <Input
                id="exp-date"
                label="Data"
                type="date"
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
              />
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
                disabled={!form.name.trim() || form.value <= 0 || busy}
              >
                {busy ? "Salvando..." : editingId ? "Salvar" : "Registrar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              Remover despesa?
            </h2>
            <p className="text-slate-500 text-sm mb-6">
              &ldquo;{expenseToDelete?.name}&rdquo; —{" "}
              {expenseToDelete ? fmt(expenseToDelete.value) : ""}. Esta ação
              não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteId(null)}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleDelete}
                disabled={busy}
              >
                {busy ? "Removendo..." : "Remover"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
