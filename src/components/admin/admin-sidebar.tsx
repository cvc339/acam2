"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "◊" },
  { href: "/admin/usuarios", label: "Usuários", icon: "U" },
  { href: "/admin/configuracoes", label: "Configurações", icon: "⚙" },
  { href: "/admin/consultas", label: "Uso e Faturamento", icon: "$" },
  { href: "/admin/consultoria", label: "Consultoria", icon: "◷" },
  { href: "/admin/google", label: "Google Calendar", icon: "G" },
  { href: "/admin/artigos", label: "Artigos", icon: "A" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "N" },
  { href: "/admin/mensagens", label: "Mensagens", icon: "✉" },
  { href: "/admin/leads", label: "Leads", icon: "L" },
]

export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <nav className="acam-admin-sidebar">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`acam-admin-sidebar-item${isActive(item.href) ? " acam-admin-sidebar-item-active" : ""}`}
        >
          <span className="acam-admin-sidebar-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
