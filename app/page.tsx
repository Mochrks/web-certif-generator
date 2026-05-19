import CertificateGenerator from "../components/demo/CertificateGenerator"
import Footer from "../components/demo/Footer"
import { Navbar } from "../components/demo/Navbar"
import { Toaster } from "../components/ui/toaster"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CertifyDraft - Bulk Certificate Generator",
  description: "Create and download professional certificates in bulk easily.",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-outfit selection:bg-primary/20">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 lg:pt-32">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-6">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-playfair tracking-tight text-foreground">
            Generate Certificates <br />
            <span className="text-muted-foreground italic">In Seconds.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            Upload your template, add your names, and download everything in a single ZIP file.
            No logins, no watermarks, completely free.
          </p>
        </div>
        <div className="max-w-6xl mx-auto">
            <CertificateGenerator />
        </div>
      </main>
      <Footer />
      <Toaster />
    </div>
  )
}

