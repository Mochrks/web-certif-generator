
import CertificateGenerator from "@/components/demo/CertificateGenerator"
import { Footer } from "@/components/demo/Footer"
import { Navbar } from "@/components/demo/Navbar"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Certificate Generator",
  description: "Generate custom certificates with your template and names",
}

export default function Home() {
  return (

    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <CertificateGenerator />
      </main>
      <Footer />
    </div>
  )
}

