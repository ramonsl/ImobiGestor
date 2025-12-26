import { signIn, auth } from "@/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Building2, TrendingUp, Users, Trophy, BarChart3, Zap, Star, Quote } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-emerald-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              ImobiFlow
            </span>
          </div>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                🚀 Plataforma SaaS para Imobiliárias
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
              Gerencie sua <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                imobiliária
              </span>{" "}
              <br />
              com inteligência
            </h1>

            <p className="text-xl text-zinc-400 leading-relaxed">
              Controle vendas, comissões e motive sua equipe com rankings em tempo real.
              Tudo em uma plataforma moderna e intuitiva.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Gestão Financeira</h3>
                  <p className="text-sm text-zinc-500">Comissões automáticas</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                  <Trophy className="h-5 w-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Rankings</h3>
                  <p className="text-sm text-zinc-500">Gamificação</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Zap className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">WhatsApp</h3>
                  <p className="text-sm text-zinc-500">Integração nativa</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">TV Mode</h3>
                  <p className="text-sm text-zinc-500">Visualização ao vivo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/50 backdrop-blur-xl text-zinc-100 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                  Acesse sua conta
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Entre com seu e-mail e senha para acessar o sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  action={async (formData) => {
                    "use server"
                    const email = formData.get("email") as string
                    const password = formData.get("password") as string

                    // Authenticate first
                    const result = await signIn("credentials", {
                      email,
                      password,
                      redirect: false
                    })

                    if (result?.error) {
                      throw new Error("Invalid credentials")
                    }

                    // Get session to determine redirect
                    const session = await auth()

                    // Redirect based on user type
                    if (!session?.user?.tenantSlug) {
                      // Super Admin - redirect to SaaS admin panel
                      await signIn("credentials", {
                        email,
                        password,
                        redirectTo: "/admin"
                      })
                    } else {
                      // Tenant user - redirect to their dashboard
                      await signIn("credentials", {
                        email,
                        password,
                        redirectTo: `/${session.user.tenantSlug}/dashboard`
                      })
                    }
                  }}
                  className="grid gap-4"
                >
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-zinc-300">
                      Email Corporativo
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu.nome@imobiliaria.com"
                      required
                      className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-12"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-zinc-300">
                      Senha
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-12"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 font-medium h-12 text-base shadow-lg shadow-emerald-500/20"
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Entrar no Sistema
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-xs text-zinc-500">
                    Ao continuar, você concorda com nossos{" "}
                    <a href="#" className="text-emerald-400 hover:underline">
                      Termos de Serviço
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mt-32">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            O que dizem nossos <span className="text-emerald-400">parceiros</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Ricardo Silva",
                role: "Diretor Comercial, ImobiNet",
                content: "O ImobiFlow transformou a forma como acompanhamos nossas metas. O TV Mode na sala de vendas criou uma competição saudável incrível.",
                avatar: "RS"
              },
              {
                name: "Ana Oliveira",
                role: "Dona de Imobiliária, Prime Imóveis",
                content: "Finalmente uma plataforma que entende a nossa dor com comissões. O dashboard é limpo e a integração com WhatsApp agilizou tudo.",
                avatar: "AO"
              },
              {
                name: "Marcos Santos",
                role: "Gerente de Equipe, Elite Houses",
                content: "A gamificação através dos rankings motivou meus corretores de uma forma que eu nunca tinha visto antes. Resultados subiram 30%.",
                avatar: "MS"
              }
            ].map((testimonial, i) => (
              <Card key={i} className="border-zinc-800 bg-zinc-900/30 backdrop-blur-sm text-zinc-100 border-t-2 border-t-emerald-500/50">
                <CardContent className="pt-8">
                  <Quote className="h-8 w-8 text-emerald-500/20 mb-4" />
                  <p className="text-zinc-300 italic mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{testimonial.name}</h4>
                      <p className="text-xs text-zinc-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">100+</div>
            <div className="text-zinc-500">Imobiliárias</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">5k+</div>
            <div className="text-zinc-500">Corretores</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">R$ 2B+</div>
            <div className="text-zinc-500">Em Vendas</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">99.9%</div>
            <div className="text-zinc-500">Uptime</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-24">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-500" />
              <span className="text-zinc-400">© 2025 ImobiFlow SaaS</span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500">
              <a href="#" className="hover:text-emerald-400 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Termos</a>
              <a href="#" className="hover:text-emerald-400 transition-colors">Suporte</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
