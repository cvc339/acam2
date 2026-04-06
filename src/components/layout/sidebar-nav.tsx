"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, CreditCard, TreePine, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Início", icon: LayoutDashboard },
  { href: "/compensacoes", label: "Compensações", icon: TreePine },
  { href: "/consultas", label: "Consultas", icon: FileText },
  { href: "/creditos", label: "Créditos", icon: CreditCard },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-white/10 text-white font-medium"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
