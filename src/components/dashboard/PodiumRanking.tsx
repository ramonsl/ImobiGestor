"use client"

import { useEffect } from "react"
import { Crown } from "lucide-react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"

interface RankingPerson {
    name: string
    value: string
    percentage: string
    position: 1 | 2 | 3
    avatar?: string
}

interface PodiumRankingProps {
    title: string
    rankings: [RankingPerson, RankingPerson, RankingPerson]
}

export function PodiumRanking({ title, rankings }: PodiumRankingProps) {
    // Sort to get correct positions
    const first = rankings.find(r => r.position === 1)!
    const second = rankings.find(r => r.position === 2)!
    const third = rankings.find(r => r.position === 3)!

    // Display order: 2nd, 1st, 3rd (podium style)
    const podiumOrder = [second, first, third]

    const triggerConfetti = () => {
        const duration = 3000
        const animationEnd = Date.now() + duration
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min
        }

        const interval: NodeJS.Timeout = setInterval(function () {
            const timeLeft = animationEnd - Date.now()

            if (timeLeft <= 0) {
                return clearInterval(interval)
            }

            const particleCount = 50 * (timeLeft / duration)

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.2 },
                colors: ['#10b981', '#14b8a6', '#06b6d4'] // Emerald, Teal, Cyan
            })
        }, 250)
    }

    useEffect(() => {
        // Trigger confetti after animations complete
        const timer = setTimeout(() => {
            triggerConfetti()
        }, 1800)

        return () => clearTimeout(timer)
    }, [])

    const getHeight = (position: number) => {
        switch (position) {
            case 1: return "h-40" // Tallest - 1st place (160px)
            case 2: return "h-32" // Medium - 2nd place (128px)
            case 3: return "h-24" // Shortest - 3rd place (96px)
            default: return "h-24"
        }
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    }

    const getAvatarSize = (position: number) => {
        return position === 1 ? "w-20 h-20" : "w-16 h-16"
    }

    const getMedalColor = (position: number) => {
        switch (position) {
            case 1: return { bg: "bg-gradient-to-br from-yellow-400 to-yellow-600", border: "border-yellow-500" } // Gold
            case 2: return { bg: "bg-gradient-to-br from-gray-300 to-gray-400", border: "border-gray-400" } // Silver
            case 3: return { bg: "bg-gradient-to-br from-amber-600 to-amber-800", border: "border-amber-700" } // Bronze
            default: return { bg: "bg-zinc-700", border: "border-zinc-600" }
        }
    }

    return (
        <div className="bg-[#1a1f3a] border border-zinc-800 rounded-lg p-8">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                <span className="text-emerald-500">🏆</span>
                {title}
            </h2>

            <div className="flex items-end justify-center gap-6 h-52">
                {podiumOrder.map((person, index) => {
                    const isFirst = person.position === 1
                    const delay = index * 0.15

                    return (
                        <motion.div
                            key={person.position}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.8,
                                delay,
                                ease: [0.34, 1.56, 0.64, 1] // Custom easing for smooth bounce
                            }}
                            className="flex flex-col items-center justify-end"
                        >
                            {/* Avatar */}
                            <motion.div
                                className="relative mb-4"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    duration: 0.7,
                                    delay: delay + 0.4,
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15
                                }}
                            >
                                {isFirst && (
                                    <motion.div
                                        initial={{ y: -30, opacity: 0, rotate: -45 }}
                                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                                        transition={{
                                            duration: 0.8,
                                            delay: delay + 1,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 12
                                        }}
                                    >
                                        <Crown className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-8 text-emerald-500" />
                                    </motion.div>
                                )}
                                <div className={`${getAvatarSize(person.position)} rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 border-4 ${getMedalColor(person.position).border} flex items-center justify-center overflow-hidden`}>
                                    {person.avatar ? (
                                        <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-zinc-400">
                                            {getInitials(person.name)}
                                        </span>
                                    )}
                                </div>
                            </motion.div>

                            {/* Podium */}
                            <motion.div
                                initial={{ scaleY: 0, opacity: 0 }}
                                animate={{ scaleY: 1, opacity: 1 }}
                                transition={{
                                    duration: 1,
                                    delay: delay + 0.2,
                                    ease: [0.22, 1, 0.36, 1] // Smooth easeOutCubic
                                }}
                                className={`w-36 ${getHeight(person.position)} ${getMedalColor(person.position).bg} rounded-t-lg p-4 text-center origin-bottom flex flex-col justify-center`}
                            >
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: delay + 0.8 }}
                                    className={`font-bold mb-1 text-sm ${person.position === 1 ? 'text-zinc-900' : 'text-white'}`}
                                >
                                    {person.name}
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: delay + 0.9 }}
                                    className={`text-sm font-semibold ${person.position === 1 ? 'text-zinc-900' : person.position === 2 ? 'text-zinc-700' : 'text-amber-900'}`}
                                >
                                    {person.value}
                                </motion.p>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.5, delay: delay + 1 }}
                                    className={`text-xs ${person.position === 1 ? 'text-zinc-800' : 'text-zinc-300'}`}
                                >
                                    {person.percentage}
                                </motion.p>
                            </motion.div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
