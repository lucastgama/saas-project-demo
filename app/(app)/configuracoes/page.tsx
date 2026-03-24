"use client";

import { useEffect, useState } from "react";
import { getSettings, saveSettings } from "@/lib/store";
import { Settings } from "@/lib/types";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Toast from "@/components/Toast";
import {
  MdSettings,
  MdAdd,
  MdDelete,
  MdStorefront,
  MdCategory,
  MdSave,
} from "react-icons/md";

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<Settings>({
    businessName: "",
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    getSettings()
      .then((s) => setSettings(s))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await saveSettings(settings);
      setToast({ msg: "Configuracoes salvas!", type: "success" });
    } catch {
      setToast({ msg: "Erro ao salvar configuracoes.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed || settings.categories.includes(trimmed)) return;
    setSettings((s) => ({ ...s, categories: [...s.categories, trimmed] }));
    setNewCategory("");
  }

  function removeCategory(cat: string) {
    setSettings((s) => ({ ...s, categories: s.categories.filter((c) => c !== cat) }));
  }

  function handleCategoryKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCategory();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {toast && (
        <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MdSettings size={28} className="text-blue-600" />
          Configuracoes
        </h1>
        <p className="text-slate-500 text-sm mt-1">Gerencie as preferencias do seu negocio.</p>
      </div>

      <Card>
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <MdStorefront size={20} className="text-slate-500" />
          Dados da Empresa
        </h2>
        <Input
          id="businessName"
          label="Nome da Empresa"
          value={settings.businessName}
          onChange={(e) => setSettings((s) => ({ ...s, businessName: e.target.value }))}
          placeholder="Ex: Mercadinho do Joao"
        />
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <MdCategory size={20} className="text-slate-500" />
          Categorias de Produtos
        </h2>

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <Input
              id="newCategory"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={handleCategoryKeyDown}
              placeholder="Nova categoria..."
            />
          </div>
          <Button
            onClick={addCategory}
            disabled={!newCategory.trim()}
            className="flex items-center gap-1 self-end"
          >
            <MdAdd size={20} />
            Adicionar
          </Button>
        </div>

        {settings.categories.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            Nenhuma categoria cadastrada.
          </p>
        ) : (
          <div className="space-y-2">
            {settings.categories.map((cat) => (
              <div
                key={cat}
                className="flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100"
              >
                <span className="text-sm font-medium text-slate-700">{cat}</span>
                <button
                  onClick={() => removeCategory(cat)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors rounded"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="flex items-center gap-2">
          <MdSave size={20} />
          {saving ? "Salvando..." : "Salvar Configuracoes"}
        </Button>
      </div>
    </div>
  );
}
