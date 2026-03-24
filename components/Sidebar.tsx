"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  MdDashboard,
  MdInventory2,
  MdShoppingCart,
  MdHistory,
  MdBarChart,
  MdSettings,
  MdLogout,
} from "react-icons/md";
import type { IconType } from "react-icons";

type NavItem = { href: string; label: string; Icon: IconType };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: MdDashboard },
  { href: "/produtos", label: "Produtos", Icon: MdInventory2 },
  { href: "/vendas", label: "Nova Venda", Icon: MdShoppingCart },
  { href: "/historico", label: "Historico", Icon: MdHistory },
  { href: "/relatorios", label: "Relatorios", Icon: MdBarChart },
  { href: "/configuracoes", label: "Configuracoes", Icon: MdSettings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <>
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-slate-200 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <span className="text-xl font-bold text-blue-600">
            Nome da Empresa
          </span>
          <p className="text-xs text-slate-400 mt-0.5">Sistema de Vendas</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith(href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <MdLogout size={20} />
            Sair
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex overflow-x-auto">
        {navItems.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-2 px-1 text-xs font-medium transition-colors min-w-16 ${
              pathname.startsWith(href) ? "text-blue-600" : "text-slate-500"
            }`}
          >
            <Icon size={22} className="mb-0.5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
