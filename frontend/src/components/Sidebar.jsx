"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/products", label: "Products", icon: "📦" },
    { href: "/customers", label: "Customers", icon: "👥" },
    { href: "/orders", label: "Orders", icon: "🧾" },
  ];

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-6 z-50">
      <div>
        {/* Brand/Logo */}
        <div className="mb-8 border-b border-slate-100 pb-4">
          <span className="font-bold text-lg tracking-tight text-slate-900">Inventory Management</span>
        </div>

        {/* Menu Navigation */}
        <nav>
          <ul className="flex flex-col gap-1.5">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent"
                    }`}
                  >
                    <span className="text-base flex items-center justify-center w-5 h-5 leading-none select-none">
                      {link.icon}
                    </span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

    </aside>
  );
}
