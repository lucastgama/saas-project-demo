"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const navItems: {
  href: string;
  label: string;
  iconImg?: string;
  icon?: string;
}[] = [
  { href: "/dashboard", label: "Dashboard", iconImg: "/icons/dashboard.png" },
  { href: "/produtos", label: "Produtos", iconImg: "/icons/box.png" },
  { href: "/vendas", label: "Nova Venda", iconImg: "/icons/sellers.png" },
  { href: "/historico", label: "Historico", iconImg: "/icons/pencil.png" },
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
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {item.iconImg ? (
                <Image
                  src={item.iconImg}
                  width={22}
                  height={22}
                  alt={item.label}
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <span className="text-lg">{item.icon}</span>
              )}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
              pathname.startsWith(item.href)
                ? "text-blue-600"
                : "text-slate-500"
            }`}
          >
            {item.iconImg ? (
              <Image
                src={item.iconImg}
                width={24}
                height={24}
                alt={item.label}
                className="w-6 h-6 mb-0.5 object-contain"
              />
            ) : (
              <span className="text-xl mb-0.5">{item.icon}</span>
            )}
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
