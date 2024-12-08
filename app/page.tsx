'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, Plus, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Navbar } from '@/components/demo/Navbar'
import { Footer } from '@/components/demo/Footer'

export default function Home() {
  const [certificateImage, setCertificateImage] = useState<string | null>(null)
  const [names, setNames] = useState<string[]>([])
  const [currentName, setCurrentName] = useState('')
  const [generatedCertificates, setGeneratedCertificates] = useState<{ name: string, url: string }[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isGenerating) {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          const newProgress = oldProgress + 10
          if (newProgress === 100) {
            clearInterval(timer)
          }
          return newProgress
        })
      }, 500)
      return () => clearInterval(timer)
    }
  }, [isGenerating])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => setCertificateImage(e.target?.result as string)
      reader.readAsDataURL(file)
      toast.success('Certificate template uploaded successfully!')
      setActiveTab('recipients')
    }
  }

  const addName = () => {
    if (currentName && names.length < 5) {
      setNames([...names, currentName])
      setCurrentName('')
      toast.success(`${currentName} added to the list`)
    } else if (names.length >= 5) {
      toast.error('Maximum 5 names allowed')
    }
  }

  const removeName = (index: number) => {
    const removedName = names[index]
    setNames(names.filter((_, i) => i !== index))
    toast.success(`${removedName} removed from the list`)
  }

  const generateCertificates = async () => {
    if (!certificateImage) {
      toast.error('Please upload a certificate template first')
      return
    }
    setIsGenerating(true)
    setProgress(0)
    try {
      const generated = await Promise.all(
        names.map(async (name) => {
          const response = await fetch('/api/generate-certificate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ templateUrl: certificateImage, name }),
          })
          const data = await response.json()
          if (data.error) throw new Error(data.error)
          return { name, url: data.certificateUrl }
        })
      )
      setGeneratedCertificates(generated)
      toast.success('Certificates generated successfully!')
      setActiveTab('download')
    } catch (error) {
      toast.error('Failed to generate certificates')
    } finally {
      setIsGenerating(false)
      setProgress(100)
    }
  }

  const downloadCertificate = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url
    a.download = `certificate_${name.replace(' ', '_')}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" />
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center ">Advanced Certificate Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Upload Template</TabsTrigger>
                <TabsTrigger value="recipients">Add Recipients</TabsTrigger>
                <TabsTrigger value="download">Generate & Download</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="mt-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold ">Upload Certificate Template</h2>
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer transition-colors duration-300">
                      {certificateImage ? (
                        <Image src={certificateImage} alt="Certificate Template" width={300} height={200} className="object-contain rounded-lg shadow-md" />
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-gray-400 animate-bounce" />
                          <p className="mb-2 text-sm "><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs ">PNG, JPG or GIF (MAX. 800x400px)</p>
                        </div>
                      )}
                      <input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={fileInputRef}
                      />
                    </label>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="recipients" className="mt-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold ">Add Recipients (Max. 5)</h2>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Enter name"
                      value={currentName}
                      onChange={(e) => setCurrentName(e.target.value)}
                      className="flex-grow"
                    />
                    <Button onClick={addName} disabled={names.length >= 5 || !currentName}>
                      <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                  </div>
                  <AnimatePresence>
                    {names.map((name, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between bg-gray-100 p-2 rounded"
                      >
                        <span className='dark:text-black'>{name}</span>
                        <Button variant="destructive" size="sm" onClick={() => removeName(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </TabsContent>
              <TabsContent value="download" className="mt-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold ">Generate and Download Certificates</h2>
                  <div className="flex space-x-4">
                    <Button onClick={generateCertificates} disabled={!certificateImage || names.length === 0 || isGenerating} className="flex-grow">
                      {isGenerating ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Certificates'
                      )}
                    </Button>
                  </div>
                  {isGenerating && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  )}
                  {generatedCertificates.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      {generatedCertificates.map((cert, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardContent className="p-4">
                            <Image src={cert.url} alt={`Certificate for ${cert.name}`} width={300} height={200} className="w-full h-auto object-contain mb-2 rounded-lg shadow-sm" />
                            <p className="text-sm font-medium text-gray-600 mb-2">{cert.name}</p>
                            <Button onClick={() => downloadCertificate(cert.url, cert.name)} size="sm" className="w-full">
                              <Download className="mr-2 h-4 w-4" /> Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  )
}

