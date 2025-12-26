"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Trophy,
    DollarSign,
    Wallet,
    Rocket,
    Settings,
    Tv
} from "lucide-react"

interface SidebarProps {
    tenantSlug: string
    tenantName: string
}

const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Trophy, label: "Ranking", href: "/ranking" },
    { icon: DollarSign, label: "Vendas", href: "/vendas" },
    { icon: Wallet, label: "Pagamentos", href: "/pagamentos" },
    { icon: Rocket, label: "Lançamentos", href: "/lancamentos" },
    { icon: Settings, label: "Configurações", href: "/configuracoes" },
    { icon: Tv, label: "Modo TV", href: "/tv" },
]

export function Sidebar({ tenantSlug, tenantName }: SidebarProps) {
    const pathname = usePathname()

    // Split tenant name to display first word in gold
    const nameParts = tenantName.split(' ')
    const firstWord = nameParts[0]
    const restOfName = nameParts.slice(1).join(' ')

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0a0e27] border-r border-zinc-800 flex flex-col">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-zinc-800">
                <h1 className="text-xl font-bold text-white leading-tight">
                    <span className="text-emerald-500 uppercase">{firstWord}</span>
                    <br />
                    {restOfName && <span className="text-xs text-zinc-400">{restOfName}</span>}
                    {restOfName && <br />}
                    <span className="text-xs text-emerald-500">Ranking 2025</span>
                </h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const href = `/${tenantSlug}${item.href}`
                    const isActive = pathname === href

                    return (
                        <Link
                            key={item.href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-emerald-500 text-[#0a0e27]"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
