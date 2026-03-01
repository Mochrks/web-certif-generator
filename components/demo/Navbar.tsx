"use client"

import Link from "next/link"
import { Moon, Sun, Github, ShieldCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function Navbar() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        <Link href="/" className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                            CertifyDraft
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex flex-col items-end mr-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">System Status</span>
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" /> Ready
                            </span>
                        </div>

                        <Separator orientation="vertical" className="h-8 hidden lg:block" />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-full hover:bg-primary/10"
                        >
                            <Sun className="h-[1.2rem] w-[1.2rem] transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] transition-all rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
                        </Button>

                        <Link
                            href="https://github.com/Mochrks/web-certif-generator"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 rounded-full border-primary/20 hover:border-primary/50 transition-all">
                                <Github size={16} />
                                <span className="font-bold">v1.2</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
