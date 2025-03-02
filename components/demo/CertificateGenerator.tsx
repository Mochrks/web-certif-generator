"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Download, Plus, Trash2, RefreshCw, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"

export default function CertificateGenerator() {
    const [certificateImage, setCertificateImage] = useState<string | null>(null)
    const [names, setNames] = useState<string[]>([])
    const [currentName, setCurrentName] = useState("")
    const [generatedCertificates, setGeneratedCertificates] = useState<{ name: string; url: string }[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [activeTab, setActiveTab] = useState("upload")
    const [previewName, setPreviewName] = useState("Preview Name")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [progress, setProgress] = useState(0)
    const { toast } = useToast()

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "Error",
                    description: "File size too large. Maximum size is 5MB.",
                    variant: "destructive",
                })
                return
            }

            try {
                const base64 = await fileToBase64(file)
                setCertificateImage(base64)
                toast({
                    title: "Success",
                    description: "Certificate template uploaded successfully!",
                })
                setActiveTab("recipients")
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to read file",
                    variant: "destructive",
                })
            }
        }
    }

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = (error) => reject(error)
        })
    }

    const addName = () => {
        if (!currentName.trim()) {
            toast({
                title: "Error",
                description: "Please enter a name",
                variant: "destructive",
            })
            return
        }

        if (names.includes(currentName.trim())) {
            toast({
                title: "Error",
                description: "This name is already in the list",
                variant: "destructive",
            })
            return
        }

        if (names.length < 10) {
            setNames([...names, currentName.trim()])
            setCurrentName("")
            toast({
                title: "Success",
                description: `${currentName} added to the list`,
            })
        } else {
            toast({
                title: "Error",
                description: "Maximum 10 names allowed",
                variant: "destructive",
            })
        }
    }

    const removeName = (index: number) => {
        const removedName = names[index]
        setNames(names.filter((_, i) => i !== index))
        toast({
            title: "Success",
            description: `${removedName} removed from the list`,
        })
    }

    const generateCertificates = async () => {
        if (!certificateImage) {
            toast({
                title: "Error",
                description: "Please upload a certificate template first",
                variant: "destructive",
            })
            return
        }

        if (names.length === 0) {
            toast({
                title: "Error",
                description: "Please add at least one name",
                variant: "destructive",
            })
            return
        }

        setIsGenerating(true)
        setProgress(0)
        setGeneratedCertificates([])

        try {
            const results = []
            for (let i = 0; i < names.length; i++) {
                const name = names[i]
                setProgress(Math.floor((i / names.length) * 90))

                const response = await fetch("/api/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        templateUrl: certificateImage,
                        name,
                    }),
                })

                if (!response.ok) {
                    throw new Error(`Failed to generate certificate for ${name}`)
                }

                const data = await response.json()
                if (data.error) throw new Error(data.error)
                results.push({ name, url: data.certificateUrl })
            }

            setGeneratedCertificates(results)
            toast({
                title: "Success",
                description: "All certificates generated successfully!",
            })
            setActiveTab("download")
        } catch (error) {
            console.error("Generation error:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to generate certificates",
                variant: "destructive",
            })
        } finally {
            setIsGenerating(false)
            setProgress(100)
        }
    }

    const generatePreview = async () => {
        if (!certificateImage) return

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    templateUrl: certificateImage,
                    name: previewName,
                    isPreview: true,
                }),
            })

            if (!response.ok) throw new Error("Failed to generate preview")

            const data = await response.json()
            if (data.error) throw new Error(data.error)

            setGeneratedCertificates([{ name: previewName, url: data.certificateUrl }])
        } catch (error) {
            console.error("Preview error:", error)
            toast({
                title: "Error",
                description: "Failed to generate preview",
                variant: "destructive",
            })
        }
    }

    const downloadCertificate = (url: string, name: string) => {
        try {
            const a = document.createElement("a")
            a.href = url
            a.download = `certificate_${name.replace(/\s+/g, "_")}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to download certificate",
                variant: "destructive",
            })
        }
    }

    const downloadAllCertificates = () => {
        if (generatedCertificates.length === 0) {
            toast({
                title: "Error",
                description: "No certificates to download",
                variant: "destructive",
            })
            return
        }

        generatedCertificates.forEach((cert, index) => {
            setTimeout(() => {
                downloadCertificate(cert.url, cert.name)
            }, index * 300) // Stagger downloads to prevent browser issues
        })

        toast({
            title: "Success",
            description: "Downloading all certificates",
        })
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <Card className="w-full max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold text-center">Certificate Generator</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="upload">Upload Template</TabsTrigger>
                            <TabsTrigger value="recipients" disabled={!certificateImage}>
                                Add Recipients
                            </TabsTrigger>
                            <TabsTrigger value="download" disabled={!certificateImage || names.length === 0}>
                                Generate & Download
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="mt-6">
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold">Upload Certificate Template</h2>

                                <div className="flex flex-col space-y-4">
                                    <div className="flex items-center justify-center w-full">
                                        <label
                                            htmlFor="dropzone-file"
                                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors duration-300"
                                        >
                                            {certificateImage ? (
                                                <div className="relative w-full h-full flex items-center justify-center p-4">
                                                    <Image
                                                        src={certificateImage || "/placeholder.svg"}
                                                        alt="Certificate Template"
                                                        width={400}
                                                        height={300}
                                                        className="object-contain max-h-56 rounded-lg shadow-md"
                                                    />
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="absolute top-2 right-2"
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            setCertificateImage(null)
                                                            if (fileInputRef.current) {
                                                                fileInputRef.current.value = ""
                                                            }
                                                        }}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                                    <p className="mb-2 text-sm">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">PNG, JPG or GIF (Max 5MB)</p>
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

                                    {certificateImage && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">Preview with Sample Name</h3>
                                            <div className="flex space-x-2">
                                                <Input
                                                    type="text"
                                                    placeholder="Enter a name for preview"
                                                    value={previewName}
                                                    onChange={(e) => setPreviewName(e.target.value)}
                                                    className="flex-grow"
                                                />
                                                <Button onClick={generatePreview}>Preview</Button>
                                            </div>

                                            {generatedCertificates.length > 0 && (
                                                <div className="mt-4">
                                                    <Image
                                                        src={generatedCertificates[0].url || "/placeholder.svg"}
                                                        alt="Preview Certificate"
                                                        width={500}
                                                        height={350}
                                                        className="object-contain rounded-lg shadow-md mx-auto"
                                                    />
                                                </div>
                                            )}

                                            <Button onClick={() => setActiveTab("recipients")} className="w-full">
                                                Continue to Add Recipients
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="recipients" className="mt-6">
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold">Add Recipients (Max. 10)</h2>

                                <div className="flex space-x-2">
                                    <Input
                                        type="text"
                                        placeholder="Enter name"
                                        value={currentName}
                                        onChange={(e) => setCurrentName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && currentName.trim()) {
                                                addName()
                                            }
                                        }}
                                        className="flex-grow"
                                    />
                                    <Button onClick={addName} disabled={!currentName.trim() || names.length >= 10}>
                                        <Plus className="mr-2 h-4 w-4" /> Add
                                    </Button>
                                </div>

                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    <AnimatePresence>
                                        {names.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-4">No recipients added yet</p>
                                        ) : (
                                            names.map((name, index) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="flex items-center justify-between bg-muted p-3 rounded"
                                                >
                                                    <span>{name}</span>
                                                    <Button variant="destructive" size="sm" onClick={() => removeName(index)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="flex space-x-4">
                                    <Button variant="outline" onClick={() => setActiveTab("upload")} className="flex-1">
                                        Back
                                    </Button>
                                    <Button onClick={() => setActiveTab("download")} disabled={names.length === 0} className="flex-1">
                                        Continue
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="download" className="mt-6">
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold">Generate and Download Certificates</h2>

                                <div className="flex space-x-4">
                                    <Button
                                        onClick={generateCertificates}
                                        disabled={!certificateImage || names.length === 0 || isGenerating}
                                        className="flex-grow"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            "Generate Certificates"
                                        )}
                                    </Button>
                                </div>

                                {(isGenerating || progress > 0) && (
                                    <div className="space-y-2">
                                        <Progress value={progress} className="w-full" />
                                        <p className="text-center text-sm text-muted-foreground">
                                            {isGenerating ? `Generating certificates (${Math.floor(progress)}%)` : "Generation complete"}
                                        </p>
                                    </div>
                                )}

                                {generatedCertificates.length > 0 && (
                                    <>
                                        <div className="flex justify-end">
                                            <Button onClick={downloadAllCertificates}>
                                                <Download className="mr-2 h-4 w-4" /> Download All
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {generatedCertificates.map((cert, index) => (
                                                <Card key={index}>
                                                    <CardContent className="p-4">
                                                        <div className="aspect-video relative mb-2">
                                                            <Image
                                                                src={cert.url || "/placeholder.svg"}
                                                                alt={`Certificate for ${cert.name}`}
                                                                fill
                                                                className="object-contain rounded-lg"
                                                            />
                                                        </div>
                                                        <p className="text-sm font-medium mb-2">{cert.name}</p>
                                                        <Button
                                                            onClick={() => downloadCertificate(cert.url, cert.name)}
                                                            size="sm"
                                                            className="w-full"
                                                        >
                                                            <Download className="mr-2 h-4 w-4" /> Download
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}

