"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import {
    Upload,
    Download,
    Plus,
    Trash2,
    RefreshCw,
    ChevronRight,
    ChevronLeft,
    Settings2,
    Users,
    FileCheck,
    FileSpreadsheet,
    MousePointer2,
    CheckCircle2,
    Trash,
    GripVertical,
    Type,
    Move,
    Layout,
    Layers as LayersIcon,
    Italic,
    Bold,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Sparkles,
    Search
} from "lucide-react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import Papa from "papaparse"
import JSZip from "jszip"
import confetti from "canvas-confetti"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { GOOGLE_FONTS } from "@/utils/fonts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

// --- Types ---

interface Layer {
    id: string
    name: string
    text: string
    type: "recipient" | "static" | "date" | "id"
    x: number // 0-1
    y: number // 0-1
    fontSize: number
    fontColor: string
    fontWeight: string
    fontFamily: string
    fontStyle: "normal" | "italic"
    textAlign: "left" | "center" | "right"
    opacity: number
    letterSpacing: number
    isUppercase: boolean
}

// --- Constants ---

const STEPS = [
    { id: "template", title: "Template", icon: Upload },
    { id: "design", title: "Visual Editor", icon: Layout },
    { id: "recipients", title: "Data Source", icon: Users },
    { id: "generate", title: "Generate", icon: FileCheck },
]

const INITIAL_LAYERS: Layer[] = [
    {
        id: "layer-1",
        name: "Recipient Name",
        text: "John Doe",
        type: "recipient",
        x: 0.5,
        y: 0.5,
        fontSize: 80,
        fontColor: "#1a1a1a",
        fontWeight: "800",
        fontFamily: "Playfair Display",
        fontStyle: "normal",
        textAlign: "center",
        opacity: 1,
        letterSpacing: 2,
        isUppercase: false,
    },
]

export default function CertificateGenerator() {
    const [currentStep, setCurrentStep] = useState(0)
    const [certificateImage, setCertificateImage] = useState<string | null>(null)
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 })
    const [names, setNames] = useState<string[]>([])
    const [currentName, setCurrentName] = useState("")
    const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS)
    const [activeLayerId, setActiveLayerId] = useState<string>("layer-1")
    const [generatedCertificates, setGeneratedCertificates] = useState<{ name: string; url: string }[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [isZipping, setIsZipping] = useState(false)
    const [progress, setProgress] = useState(0)
    const [fontSearch, setFontSearch] = useState("")
    const [templateFilters, setTemplateFilters] = useState({ brightness: 100, contrast: 100 })

    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const csvInputRef = useRef<HTMLInputElement>(null)
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const workspaceRef = useRef<HTMLDivElement>(null)

    // --- Derived State ---

    const activeLayer = layers.find(l => l.id === activeLayerId) || layers[0]

    const filteredFonts = useMemo(() => {
        return GOOGLE_FONTS.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase())).slice(0, 50)
    }, [fontSearch])

    // Load fonts into the document
    useEffect(() => {
        const fontsToLoad = layers.map((l) => l.fontFamily).filter((v, i, a) => a.indexOf(v) === i)
        if (fontsToLoad.length > 0) {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            const fontQuery = fontsToLoad.map(f => f.replace(/\s+/g, "+")).join("|")
            link.href = `https://fonts.googleapis.com/css?family=${fontQuery}:400,700,800&display=swap`
            document.head.appendChild(link)
            return () => {
                document.head.removeChild(link)
            }
        }
    }, [layers])

    // --- Canvas Rendering Logo ---

    const renderOnCanvas = useCallback(async (canvas: HTMLCanvasElement, nameValue: string, isPreview = false) => {
        if (!certificateImage) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const img = new (window.Image as any)()
        img.src = certificateImage
        await new Promise((resolve) => {
            img.onload = resolve
        })

        canvas.width = img.width
        canvas.height = img.height

        ctx.filter = `brightness(${templateFilters.brightness}%) contrast(${templateFilters.contrast}%)`
        ctx.drawImage(img, 0, 0)
        ctx.filter = 'none'

        // Render each layer
        for (const layer of layers) {
            const text = layer.type === "recipient" ? nameValue : layer.text
            const finalPrice = layer.isUppercase ? text.toUpperCase() : text

            ctx.globalAlpha = layer.opacity
            ctx.font = `${layer.fontStyle} ${layer.fontWeight} ${layer.fontSize}px "${layer.fontFamily}"`
            ctx.fillStyle = layer.fontColor
            ctx.textAlign = layer.textAlign
            ctx.textBaseline = "middle"

            const x = layer.x * canvas.width
            const y = layer.y * canvas.height

            // Handle letter spacing (hacky but works for canvas)
            if (layer.letterSpacing === 0) {
                ctx.fillText(finalPrice, x, y)
            } else {
                const characters = finalPrice.split("")
                let currentX = x
                if (layer.textAlign === "center") {
                    const totalWidth = ctx.measureText(finalPrice).width + (characters.length - 1) * layer.letterSpacing
                    currentX = x - totalWidth / 2
                    ctx.textAlign = "left"
                } else if (layer.textAlign === "right") {
                    const totalWidth = ctx.measureText(finalPrice).width + (characters.length - 1) * layer.letterSpacing
                    currentX = x - totalWidth
                    ctx.textAlign = "left"
                } else {
                    ctx.textAlign = "left"
                }

                for (const char of characters) {
                    ctx.fillText(char, currentX, y)
                    currentX += ctx.measureText(char).width + layer.letterSpacing
                }
            }
        }

        return canvas.toDataURL("image/png")
    }, [certificateImage, layers, templateFilters])

    // Update Preview Canvas
    useEffect(() => {
        if (certificateImage && currentStep === 1 && previewCanvasRef.current) {
            renderOnCanvas(previewCanvasRef.current, "Sample Preview Name", true)
        }
    }, [certificateImage, layers, currentStep, renderOnCanvas])

    // --- Handlers ---

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const url = e.target?.result as string
                const tempImg = new (window.Image as any)()
                tempImg.src = url
                tempImg.onload = () => {
                    setImgDimensions({ width: tempImg.width, height: tempImg.height })
                    setCertificateImage(url)
                    setCurrentStep(1)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    const addLayer = () => {
        const newLayer: Layer = {
            ...INITIAL_LAYERS[0],
            id: `layer-${Date.now()}`,
            name: `New Layer ${layers.length + 1}`,
            text: "New Text",
            type: "static",
            y: 0.6 + (layers.length * 0.05)
        }
        setLayers([...layers, newLayer])
        setActiveLayerId(newLayer.id)
    }

    const updateActiveLayer = (updates: Partial<Layer>) => {
        setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, ...updates } : l))
    }

    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            Papa.parse(file, {
                complete: (results) => {
                    const parsedNames = results.data
                        .flat()
                        .map((n: any) => String(n).trim())
                        .filter((n) => n.length > 0)
                    setNames((prev) => [...prev, ...parsedNames].filter((v, i, a) => a.indexOf(v) === i))
                    toast({ title: "Import Successful", description: `Added ${parsedNames.length} names.` })
                }
            })
        }
    }

    const generateAll = async () => {
        if (!certificateImage || names.length === 0) return
        setIsGenerating(true)
        setProgress(0)

        const results = []
        const offscreenCanvas = document.createElement("canvas")

        for (let i = 0; i < names.length; i++) {
            const name = names[i]
            const url = await renderOnCanvas(offscreenCanvas, name)
            if (url) results.push({ name, url })
            setProgress(Math.round(((i + 1) / names.length) * 100))
        }

        setGeneratedCertificates(results)
        setIsGenerating(false)
        confetti({ particleCount: 200, spread: 80, origin: { y: 0.7 } })
    }

    const downloadAll = async () => {
        setIsZipping(true)
        const zip = new JSZip()
        const folder = zip.folder("certificates")
        generatedCertificates.forEach(c => {
            folder?.file(`${c.name.replace(/\s+/g, '_')}.png`, c.url.split(',')[1], { base64: true })
        })
        const blob = await zip.generateAsync({ type: "blob" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = "certificates-batch.zip"
        link.click()
        setIsZipping(false)
    }

    // --- Step Components ---

    const StepNavbar = (
        <div className="flex justify-between items-center mb-12 relative overflow-x-auto pb-4">
            <div className="absolute top-6 left-0 w-full h-0.5 bg-muted -z-10" />
            {STEPS.map((step, idx) => {
                const Icon = step.icon
                const isActive = idx <= currentStep
                return (
                    <div key={step.id} className="flex flex-col items-center gap-3 px-4 min-w-[100px]">
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => idx < currentStep && setCurrentStep(idx)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 cursor-pointer ${isActive ? "bg-primary border-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "bg-card border-muted text-muted-foreground"
                                }`}
                        >
                            <Icon size={20} />
                        </motion.div>
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                            {step.title}
                        </span>
                    </div>
                )
            })}
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {StepNavbar}

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {/* STEP 1: TEMPLATE UPLOAD */}
                    {currentStep === 0 && (
                        <div className="max-w-2xl mx-auto">
                            <Card className="border-2 border-dashed border-primary/20 bg-primary/5 hover:border-primary/50 transition-all duration-500 group">
                                <CardContent
                                    className="flex flex-col items-center justify-center py-24 cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ repeat: Infinity, duration: 4 }}
                                        className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform"
                                    >
                                        <Upload className="text-primary" size={40} />
                                    </motion.div>
                                    <h3 className="text-3xl font-bold mb-3 tracking-tight">Upload Your Template</h3>
                                    <p className="text-muted-foreground text-center max-w-sm mb-10 leading-relaxed">
                                        Choose a high-authority certificate design (PNG or JPG).
                                        Maximum recommended size: 4K (10MB).
                                    </p>
                                    <Button size="lg" className="rounded-full px-10 h-14 text-md shadow-xl hover:shadow-primary/20">
                                        <Sparkles size={18} className="mr-2" /> Select Image File
                                    </Button>
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* STEP 2: COMPLEX VISUAL EDITOR */}
                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 xl:grid-cols-[1fr,400px] gap-8 items-start">
                            {/* Main Preview Area */}
                            <div className="space-y-4">
                                <Card className="overflow-hidden border-0 shadow-2xl bg-black/5 dark:bg-white/5 backdrop-blur-sm">
                                    <div className="bg-muted/50 p-4 flex justify-between items-center border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/20 p-2 rounded-lg"><MousePointer2 size={18} className="text-primary" /></div>
                                            <span className="font-semibold text-sm">Interactive Workspace</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={addLayer} className="rounded-full h-9 px-4">
                                                <Plus size={16} className="mr-2" /> Add Text Layer
                                            </Button>
                                        </div>
                                    </div>
                                    <CardContent className="p-0 relative flex items-center justify-center min-h-[500px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
                                        <div ref={workspaceRef} className="relative shadow-2xl m-8 max-w-[90%]">
                                            <canvas ref={previewCanvasRef} className="max-w-full h-auto rounded-sm border shadow-lg bg-white" />

                                            {/* Draggable Handles Overlay */}
                                            {layers.map(layer => (
                                                <div
                                                    key={layer.id}
                                                    onPointerDown={(e) => {
                                                        const startX = e.clientX
                                                        const startY = e.clientY
                                                        const initialX = layer.x
                                                        const initialY = layer.y
                                                        const rect = workspaceRef.current?.getBoundingClientRect()

                                                        if (!rect) return

                                                        const handleMouseMove = (moveEvent: PointerEvent) => {
                                                            const deltaX = (moveEvent.clientX - startX) / rect.width
                                                            const deltaY = (moveEvent.clientY - startY) / rect.height

                                                            setLayers(prev => prev.map(l => l.id === layer.id ? {
                                                                ...l,
                                                                x: Math.max(0, Math.min(1, initialX + deltaX)),
                                                                y: Math.max(0, Math.min(1, initialY + deltaY))
                                                            } : l))
                                                        }

                                                        const handleMouseUp = () => {
                                                            window.removeEventListener('pointermove', handleMouseMove)
                                                            window.removeEventListener('pointerup', handleMouseUp)
                                                        }

                                                        window.addEventListener('pointermove', handleMouseMove)
                                                        window.addEventListener('pointerup', handleMouseUp)
                                                        setActiveLayerId(layer.id)
                                                    }}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${layer.x * 100}%`,
                                                        top: `${layer.y * 100}%`,
                                                        transform: 'translate(-50%, -50%)',
                                                        cursor: 'move',
                                                        zIndex: activeLayerId === layer.id ? 50 : 40,
                                                        touchAction: 'none'
                                                    }}
                                                    className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-125 ${activeLayerId === layer.id ? "bg-primary ring-4 ring-primary/30" : "bg-slate-400"
                                                        }`}
                                                >
                                                    {activeLayerId === layer.id && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                <div className="flex justify-between items-center bg-card p-4 rounded-xl border">
                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                        <Type size={14} /> Total Layers: {layers.length}
                                        <Separator orientation="vertical" className="h-4 mx-2" />
                                        Resolution: {imgDimensions.width}x{imgDimensions.height}
                                    </div>
                                    <Button onClick={() => setCurrentStep(2)} className="h-11 rounded-full px-8 shadow-lg shadow-primary/20">
                                        Continue to Recipients <ChevronRight className="ml-2" />
                                    </Button>
                                </div>
                            </div>

                            {/* Sidebar Panel */}
                            <div className="space-y-6 lg:sticky lg:top-24">
                                <Tabs defaultValue="style" className="bg-card rounded-2xl border shadow-xl overflow-hidden">
                                    <TabsList className="w-full h-14 bg-muted/30 border-b rounded-none px-0">
                                        <TabsTrigger value="style" className="flex-1 h-full rounded-none data-[state=active]:bg-background"><Settings2 size={16} className="mr-2" /> Style</TabsTrigger>
                                        <TabsTrigger value="filters" className="flex-1 h-full rounded-none data-[state=active]:bg-background"><Move size={16} className="mr-2" /> Global</TabsTrigger>
                                        <TabsTrigger value="layers" className="flex-1 h-full rounded-none data-[state=active]:bg-background"><LayersIcon size={16} className="mr-2" /> Layers</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="filters" className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
                                        <div className="space-y-4">
                                            <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Template Adjustments</Label>
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label className="text-xs">Brightness</Label>
                                                        <span className="text-[10px] font-mono">{templateFilters.brightness}%</span>
                                                    </div>
                                                    <Slider value={[templateFilters.brightness]} min={50} max={150} step={1} onValueChange={([v]) => setTemplateFilters(prev => ({ ...prev, brightness: v }))} />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <Label className="text-xs">Contrast</Label>
                                                        <span className="text-[10px] font-mono">{templateFilters.contrast}%</span>
                                                    </div>
                                                    <Slider value={[templateFilters.contrast]} min={50} max={150} step={1} onValueChange={([v]) => setTemplateFilters(prev => ({ ...prev, contrast: v }))} />
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="style" className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Typography</Label>
                                                <Badge variant="outline" className="text-[10px]">{activeLayer.type.toUpperCase()}</Badge>
                                            </div>

                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                                <Input
                                                    placeholder="Search from 200+ fonts..."
                                                    value={fontSearch}
                                                    onChange={(e) => setFontSearch(e.target.value)}
                                                    className="pl-9 h-10 text-sm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                                {filteredFonts.map(font => (
                                                    <Button
                                                        key={font}
                                                        variant={activeLayer.fontFamily === font ? "default" : "outline"}
                                                        size="sm"
                                                        style={{ fontFamily: font }}
                                                        onClick={() => updateActiveLayer({ fontFamily: font })}
                                                        className="h-10 text-xs justify-start px-3 truncate"
                                                    >
                                                        {font}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Font Size ({activeLayer.fontSize}px)</Label>
                                                <Slider value={[activeLayer.fontSize]} min={10} max={200} step={1} onValueChange={([v]) => updateActiveLayer({ fontSize: v })} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs">Letter Spacing ({activeLayer.letterSpacing}px)</Label>
                                                <Slider value={[activeLayer.letterSpacing]} min={-5} max={30} step={1} onValueChange={([v]) => updateActiveLayer({ letterSpacing: v })} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-xs">Text Alignment & Format</Label>
                                            <div className="flex gap-2">
                                                <div className="flex bg-muted p-1 rounded-lg">
                                                    <Button variant={activeLayer.textAlign === 'left' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => updateActiveLayer({ textAlign: 'left' })}><AlignLeft size={14} /></Button>
                                                    <Button variant={activeLayer.textAlign === 'center' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => updateActiveLayer({ textAlign: 'center' })}><AlignCenter size={14} /></Button>
                                                    <Button variant={activeLayer.textAlign === 'right' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => updateActiveLayer({ textAlign: 'right' })}><AlignRight size={14} /></Button>
                                                </div>
                                                <Separator orientation="vertical" className="h-10" />
                                                <div className="flex bg-muted p-1 rounded-lg">
                                                    <Button variant={activeLayer.fontWeight === '800' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => updateActiveLayer({ fontWeight: activeLayer.fontWeight === '800' ? '400' : '800' })}><Bold size={14} /></Button>
                                                    <Button variant={activeLayer.fontStyle === 'italic' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => updateActiveLayer({ fontStyle: activeLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={14} /></Button>
                                                    <Button variant={activeLayer.isUppercase ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8 font-bold text-[10px]" onClick={() => updateActiveLayer({ isUppercase: !activeLayer.isUppercase })}>AA</Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs">Font Color</Label>
                                            <div className="flex gap-3 items-center">
                                                <Input type="color" value={activeLayer.fontColor} onChange={(e) => updateActiveLayer({ fontColor: e.target.value })} className="w-14 h-10 p-1 rounded-lg cursor-pointer bg-muted" />
                                                <Input type="text" value={activeLayer.fontColor} onChange={(e) => updateActiveLayer({ fontColor: e.target.value })} className="flex-1 font-mono text-xs" />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="layers" className="p-6 space-y-4 animate-in slide-in-from-right duration-300">
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {layers.map((layer) => (
                                                <motion.div
                                                    key={layer.id}
                                                    whileHover={{ x: 5 }}
                                                    className={`p-3 rounded-xl flex items-center gap-3 border transition-all cursor-pointer ${activeLayerId === layer.id ? "bg-primary/5 border-primary shadow-sm" : "bg-muted/30 border-transparent hover:bg-muted/50"
                                                        }`}
                                                    onClick={() => setActiveLayerId(layer.id)}
                                                >
                                                    <GripVertical size={14} className="text-muted-foreground mr-1" />
                                                    <div className="flex-1">
                                                        <Input
                                                            value={layer.name}
                                                            onChange={(e) => setLayers(layers.map(l => l.id === layer.id ? { ...l, name: e.target.value } : l))}
                                                            className="h-7 text-xs font-bold border-none bg-transparent p-0 focus-visible:ring-0"
                                                        />
                                                        <p className="text-[10px] text-muted-foreground truncate">{layer.text}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100" onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (layers.length > 1) {
                                                            setLayers(layers.filter(l => l.id !== layer.id))
                                                            if (activeLayerId === layer.id) setActiveLayerId(layers[0].id)
                                                        }
                                                    }}>
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <Button variant="outline" className="w-full dashed h-12" onClick={addLayer}>
                                            <Plus size={16} className="mr-2" /> Add New Layer
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: RECIPIENTS DATA */}
                    {currentStep === 2 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            <Card className="border-0 shadow-2xl bg-card">
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                                        <FileSpreadsheet className="text-emerald-500" />
                                        Import Recipients
                                    </CardTitle>
                                    <CardDescription>Each name in the list will trigger a certificate generation.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="space-y-3">
                                        <Label>Manual Entry</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Full name (e.g. John Doe, M.Sc)"
                                                value={currentName}
                                                onChange={(e) => setCurrentName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (currentName.trim() && (setNames([...names, currentName.trim()]), setCurrentName("")))}
                                                className="rounded-xl h-12 shadow-sm"
                                            />
                                            <Button size="lg" className="rounded-xl px-6" onClick={() => {
                                                if (currentName.trim()) {
                                                    setNames([...names, currentName.trim()])
                                                    setCurrentName("")
                                                }
                                            }}><Plus /></Button>
                                        </div>
                                    </div>

                                    <div className="relative py-4">
                                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-4 text-muted-foreground font-bold tracking-widest">or batch import</span></div>
                                    </div>

                                    <div
                                        className="border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-6 hover:bg-muted/50 transition-all cursor-pointer bg-muted/20"
                                        onClick={() => csvInputRef.current?.click()}
                                    >
                                        <div className="p-4 bg-emerald-500/10 rounded-full"><FileSpreadsheet className="text-emerald-500" size={40} /></div>
                                        <div className="text-center space-y-1">
                                            <p className="font-bold">Drop your CSV file here</p>
                                            <p className="text-xs text-muted-foreground">Make sure names are in the first column</p>
                                        </div>
                                        <Button variant="secondary" className="rounded-full shadow-sm">Choose File</Button>
                                        <input ref={csvInputRef} type="file" className="hidden" accept=".csv" onChange={handleCsvUpload} />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-2xl bg-card overflow-hidden">
                                <div className="p-6 bg-muted/30 border-b flex justify-between items-center">
                                    <CardTitle className="text-xl">Prepared List ({names.length})</CardTitle>
                                    {names.length > 0 && (
                                        <Button variant="ghost" size="sm" onClick={() => setNames([])} className="text-destructive font-bold text-xs"><Trash size={14} className="mr-1" /> Reset List</Button>
                                    )}
                                </div>
                                <CardContent className="p-0">
                                    <div className="max-h-[500px] overflow-y-auto space-y-1 p-2 custom-scrollbar min-h-[300px]">
                                        <AnimatePresence>
                                            {names.map((name, idx) => (
                                                <motion.div
                                                    key={name + idx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="bg-muted/20 p-4 rounded-xl flex justify-between items-center group border hover:bg-muted/40 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{idx + 1}</div>
                                                        <span className="font-medium text-sm">{name}</span>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100" onClick={() => setNames(names.filter((_, i) => i !== idx))}>
                                                        <Trash2 size={14} className="text-destructive" />
                                                    </Button>
                                                </motion.div>
                                            ))}
                                            {names.length === 0 && (
                                                <div className="text-center py-32 text-muted-foreground flex flex-col items-center gap-4">
                                                    <Users size={64} className="opacity-10" />
                                                    <p className="text-sm font-medium">Ready for your recipients...</p>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </CardContent>
                                {names.length > 0 && (
                                    <div className="p-4 bg-muted/10 border-t">
                                        <Button className="w-full h-12 rounded-xl text-md shadow-lg" onClick={() => setCurrentStep(3)}>
                                            Finish & Generate <ChevronRight className="ml-2" />
                                        </Button>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* STEP 4: MASS PRODUCTION */}
                    {currentStep === 3 && (
                        <div className="max-w-5xl mx-auto space-y-8">
                            {!generatedCertificates.length ? (
                                <Card className="p-12 text-center space-y-8 bg-card border-0 shadow-2xl overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                    <div className="max-w-md mx-auto space-y-4">
                                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <CheckCircle2 className="text-primary" size={32} />
                                        </div>
                                        <h2 className="text-4xl font-black">All Set!</h2>
                                        <p className="text-muted-foreground text-lg leading-relaxed">
                                            We are ready to generate **{names.length}** high-resolution certificates with your interactive design.
                                        </p>
                                    </div>

                                    {isGenerating ? (
                                        <div className="max-w-lg mx-auto space-y-6">
                                            <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    className="absolute top-0 left-0 h-full bg-primary"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between font-mono text-sm font-bold text-primary animate-pulse">
                                                <span>PROCESSING DATA...</span>
                                                <span>{progress}%</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button size="lg" className="h-16 px-16 rounded-full text-xl font-bold shadow-2xl hover:scale-105 transition-all bg-primary" onClick={generateAll}>
                                            Generate Certificates
                                        </Button>
                                    )}
                                </Card>
                            ) : (
                                <div className="space-y-8">
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="flex flex-col md:flex-row justify-between items-center bg-emerald-500/10 p-8 rounded-[2rem] border border-emerald-500/20 gap-6"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                                <Download size={32} />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-emerald-600 flex items-center gap-2">
                                                    Success! {generatedCertificates.length} Done.
                                                </h3>
                                                <p className="text-muted-foreground font-medium">Batch production completed perfectly.</p>
                                            </div>
                                        </div>
                                        <Button size="lg" onClick={downloadAll} disabled={isZipping} className="rounded-full px-12 h-14 text-lg bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20">
                                            {isZipping ? <RefreshCw className="animate-spin mr-2" /> : <Download className="mr-2" />}
                                            Download All (ZIP)
                                        </Button>
                                    </motion.div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {generatedCertificates.map((cert, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                whileHover={{ y: -8 }}
                                                className="group relative"
                                            >
                                                <Card className="overflow-hidden border-0 shadow-lg group-hover:shadow-2xl transition-all">
                                                    <div className="aspect-[1.41] relative bg-muted flex items-center justify-center overflow-hidden">
                                                        <Image src={cert.url} alt={cert.name} fill className="object-cover transition-transform group-hover:scale-110" unoptimized />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Button variant="outline" size="sm" className="bg-white text-black border-none rounded-full" onClick={() => {
                                                                const a = document.createElement("a");
                                                                a.href = cert.url;
                                                                a.download = `${cert.name}.png`;
                                                                a.click();
                                                            }}>
                                                                <Download size={14} className="mr-2" /> Download Solo
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 border-t bg-card">
                                                        <p className="text-sm font-bold truncate tracking-tight">{cert.name}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black mt-1 tracking-widest">Certificate Preview</p>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <div className="text-center py-10">
                                        <Button variant="ghost" onClick={() => {
                                            if (confirm("New project? Existing data will be cleared.")) window.location.reload()
                                        }} className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Start New Session</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Persistence Controls */}
            {currentStep > 0 && !isGenerating && (
                <div className="flex justify-between items-center pt-12 border-t">
                    <Button variant="ghost" size="lg" onClick={() => setCurrentStep(prev => prev - 1)} className="gap-2 rounded-full font-bold">
                        <ChevronLeft size={20} /> Back to {STEPS[currentStep - 1].title}
                    </Button>

                    <div className="flex gap-4">
                        <Button variant="ghost" size="sm" onClick={() => {
                            if (confirm("Reset all layers and recipients?")) {
                                setLayers(INITIAL_LAYERS);
                                setNames([]);
                                setGeneratedCertificates([]);
                                setCurrentStep(0);
                            }
                        }} className="text-destructive font-black text-xs tracking-widest">
                            BURN ALL DATA
                        </Button>
                    </div>
                </div>
            )}

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
        }
      `}</style>
        </div>
    )
}
