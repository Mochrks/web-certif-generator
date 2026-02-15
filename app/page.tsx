import CertificateGenerator from "@/components/demo/CertificateGenerator"
import Footer from "@/components/demo/Footer"
import { Navbar } from "@/components/demo/Navbar"
import { Toaster } from "@/components/ui/toaster"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CertifyDraft - Bulk Certificate Generator",
  description: "Create and download professional certificates in bulk easily.",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32">
        <div className="max-w-4xl mx-auto text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Generate Certificates <br />
            <span className="text-primary">In Seconds.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your template, add your names, and download everything in a single ZIP file.
            No logins, no watermarks, completely free.
          </p>
        </div>
        <CertificateGenerator />
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}

