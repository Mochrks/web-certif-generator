import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export default function Footer() {
    return (
        <footer className="border-t bg-muted/30 backdrop-blur-xl mt-20">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-2 text-center md:text-left">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            CertifyDraft
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium">
                            Bulk certificate generation made easy.
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-2">
                        <div className="flex items-center gap-4 text-sm font-bold">
                            <span className="text-muted-foreground opacity-50">v2.1.0</span>
                            <Separator orientation="vertical" className="h-4" />
                            <Link href="https://github.com/Mochrks" target="_blank" className="hover:text-primary transition-colors">
                                DEVELOPER PORTFOLIO
                            </Link>
                        </div>
                        <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
                            © {new Date().getFullYear()} Mochrks Engineering. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
