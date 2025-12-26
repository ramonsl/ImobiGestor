import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
    title: string
    value: string
    icon: LucideIcon
    trend?: string
    iconBgColor?: string
}

export function MetricCard({ title, value, icon: Icon, trend, iconBgColor = "bg-emerald-500/10" }: MetricCardProps) {
    return (
        <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className={cn("p-2 rounded-lg", iconBgColor)}>
                    <Icon className="h-4 w-4 text-emerald-500" />
                </div>
                {trend && (
                    <span className="text-xs text-emerald-400">{trend}</span>
                )}
            </div>
            <h3 className="text-xs text-zinc-400 mb-2 leading-tight">{title}</h3>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    )
}
