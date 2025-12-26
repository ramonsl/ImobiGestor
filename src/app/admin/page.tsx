import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function AdminDashboard() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Verify user is Super Admin (no tenantId)
    if (session.user.tenantSlug) {
        redirect(`/${session.user.tenantSlug}/dashboard`)
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                    ImobiGestor - Super Admin
                </h1>

                <div className="grid gap-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h2 className="text-2xl font-semibold mb-4">Bem-vindo, {session.user.name}!</h2>
                        <p className="text-zinc-400 mb-4">
                            Você está logado como Super Administrador da plataforma ImobiGestor SaaS.
                        </p>
                        <div className="bg-zinc-950 border border-zinc-800 rounded p-4">
                            <p className="text-sm text-zinc-500 mb-2">Informações da Sessão:</p>
                            <ul className="space-y-1 text-sm">
                                <li><span className="text-zinc-500">Email:</span> <span className="text-emerald-400">{session.user.email}</span></li>
                                <li><span className="text-zinc-500">Role:</span> <span className="text-emerald-400">{session.user.role}</span></li>
                                <li><span className="text-zinc-500">Tenant:</span> <span className="text-zinc-400">N/A (Super Admin)</span></li>
                            </ul>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Imobiliárias</h3>
                            <p className="text-3xl font-bold text-emerald-400">0</p>
                            <p className="text-sm text-zinc-500">Total de clientes</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">Usuários</h3>
                            <p className="text-3xl font-bold text-teal-400">2</p>
                            <p className="text-sm text-zinc-500">Total de usuários</p>
                        </div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-2">MRR</h3>
                            <p className="text-3xl font-bold text-blue-400">R$ 0</p>
                            <p className="text-sm text-zinc-500">Receita mensal</p>
                        </div>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <h3 className="text-xl font-semibold mb-4">Próximos Passos</h3>
                        <ul className="space-y-2 text-zinc-400">
                            <li>✅ Autenticação implementada</li>
                            <li>⏳ Criar CRUD de Imobiliárias</li>
                            <li>⏳ Implementar gestão de usuários</li>
                            <li>⏳ Integrar Stripe para pagamentos</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
