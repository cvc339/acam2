"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TreePine } from "lucide-react"
import { styleguideNav } from "./navigation"
import { cn } from "@/lib/utils"

export default function StyleguideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-6 hidden md:block">
        <Link href="/styleguide" className="flex items-center gap-2 mb-8">
          <TreePine className="h-5 w-5 text-primary" />
          <span className="font-bold">ACAM Styleguide</span>
        </Link>

        <nav className="space-y-6">
          {styleguideNav.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "block px-3 py-1.5 text-sm rounded-md transition-colors",
                        pathname === item.href
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 max-w-4xl">
        {children}
      </main>
    </div>
  )
}
