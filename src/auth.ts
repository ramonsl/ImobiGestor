import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { users, tenants } from "@/db/schema"
import { eq } from "drizzle-orm"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db),
    session: { strategy: "jwt" },
    secret: process.env.AUTH_SECRET,
    trustHost: true,
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("🔐 Authorize called with:", { email: credentials?.email, hasPassword: !!credentials?.password })

                if (!credentials?.email || !credentials?.password) {
                    console.log("❌ Missing credentials")
                    return null
                }

                const user = await db.select({
                    id: users.id,
                    name: users.name,
                    email: users.email,
                    password: users.password,
                    role: users.role,
                    tenantId: users.tenantId
                })
                    .from(users)
                    .where(eq(users.email, credentials.email as string))
                    .then(res => res[0])

                console.log("👤 User found:", { found: !!user, email: user?.email, hasPassword: !!user?.password })

                if (!user || !user.password) {
                    console.log("❌ User not found or no password")
                    return null
                }

                const isValidPassword = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                console.log("🔑 Password valid:", isValidPassword)

                if (!isValidPassword) {
                    console.log("❌ Invalid password")
                    return null
                }

                console.log("✅ Authentication successful for:", user.email)
                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.tenantId = user.tenantId

                // Fetch tenant slug if exists
                if (user.tenantId) {
                    const tenant = await db.select({ slug: tenants.slug })
                        .from(tenants)
                        .where(eq(tenants.id, user.tenantId))
                        .then(res => res[0])
                    token.tenantSlug = tenant?.slug
                }
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.tenantSlug = token.tenantSlug as string
            }
            return session
        },
        async redirect({ url, baseUrl }) {
            console.log("🔀 Redirect callback:", { url, baseUrl })

            // If it's an absolute URL starting with baseUrl, allow it
            if (url.startsWith(baseUrl)) {
                console.log("✅ Using provided URL:", url)
                return url
            }

            // Relative URLs
            if (url.startsWith("/")) {
                const fullUrl = `${baseUrl}${url}`
                console.log("✅ Converting relative URL:", fullUrl)
                return fullUrl
            }

            console.log("✅ Fallback to baseUrl:", baseUrl)
            return baseUrl
        },
        async signIn({ user }) {
            console.log("🔑 SignIn callback - User:", { email: user.email, tenantId: user.tenantId, role: user.role })
            return true
        }
    },
    pages: {
        signIn: "/login",
    }
})
