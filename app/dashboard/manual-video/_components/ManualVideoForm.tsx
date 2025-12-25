"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
    Loader2,
    User,
    Package,
    Sparkles,
    ImageIcon,
    Video,
    Zap,
    Check,
    AlertCircle,
    Upload,
    Trash2,
    ArrowRight,
    RefreshCw,
    FileText,
    X,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import axios from "axios";
import Image from "next/image";
import { toast } from "sonner";
import { useManualVideoContext } from "./ManualVideoContext";
import LambdaTestPanel from "./LambdaTestPanel";

// ============================================
// TYPES
// ============================================

interface PrebuiltAvatar {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    gender: "male" | "female";
    style: string;
}

interface ManualVideoFormProps {
    onJobCreated: (jobId: string) => void;
    isProcessing: boolean;
}

// ============================================
// PREBUILT AVATARS
// ============================================

const PREBUILT_AVATARS: PrebuiltAvatar[] = [
    {
        id: "avatar-1",
        name: "Sarah",
        description: "Young professional woman, casual style",
        imageUrl: "/avatars/sarah.webp",
        gender: "female",
        style: "casual",
    },
    {
        id: "avatar-2",
        name: "Marcus",
        description: "Athletic man, fitness influencer style",
        imageUrl: "/avatars/marcus.webp",
        gender: "male",
        style: "fitness",
    },
    {
        id: "avatar-3",
        name: "Emily",
        description: "Lifestyle blogger, elegant aesthetic",
        imageUrl: "/avatars/emily.webp",
        gender: "female",
        style: "elegant",
    },
    {
        id: "avatar-4",
        name: "James",
        description: "Tech reviewer, modern professional",
        imageUrl: "/avatars/james.webp",
        gender: "male",
        style: "professional",
    },
    {
        id: "avatar-5",
        name: "Zara",
        description: "Beauty influencer, glamorous look",
        imageUrl: "/avatars/zara.webp",
        gender: "female",
        style: "glamorous",
    },
    {
        id: "avatar-6",
        name: "David",
        description: "Casual everyday person, relatable",
        imageUrl: "/avatars/david.webp",
        gender: "male",
        style: "casual",
    },
];

// ============================================
// PLATFORMS & DURATIONS & BACKGROUNDS
// ============================================

const PLATFORMS = [
    { id: "tiktok", name: "TikTok", icon: "📱" },
    { id: "instagram_reels", name: "Instagram Reels", icon: "📸" },
    { id: "youtube_shorts", name: "YouTube Shorts", icon: "▶️" },
    { id: "general", name: "General", icon: "🎬" },
];

const VIDEO_LENGTHS = [
    { id: "15", name: "15 seconds", description: "Quick hook", scenes: 2 },
    { id: "30", name: "30 seconds", description: "Standard UGC", scenes: 4 },
    { id: "45", name: "45 seconds", description: "Detailed showcase", scenes: 5 },
];

const ASPECT_RATIOS = [
    { id: "9:16", name: "9:16 Vertical", description: "TikTok, Reels, Shorts", icon: "📱" },
    { id: "1:1", name: "1:1 Square", description: "Instagram Feed", icon: "⬛" },
    { id: "16:9", name: "16:9 Horizontal", description: "YouTube, Web", icon: "🖥️" },
    { id: "4:5", name: "4:5 Portrait", description: "Instagram Portrait", icon: "📷" },
    { id: "3:4", name: "3:4 Portrait", description: "Pinterest Style", icon: "📌" },
];

const BACKGROUND_PRESETS = [
    { label: "🏠 Home", value: "cozy home setting, natural lighting, clean modern decor" },
    { label: "🛋️ Living Room", value: "modern living room with comfortable couch, natural daylight from large windows" },
    { label: "🛁 Bathroom", value: "clean modern bathroom, bright lighting, white tiles" },
    { label: "🏋️ Gym", value: "modern gym setting, exercise equipment in background" },
    { label: "☕ Cafe", value: "trendy cafe with warm lighting, coffee shop ambiance" },
    { label: "🌿 Outdoor", value: "outdoor garden setting, natural sunlight, green plants" },
    { label: "🏷️ Other", value: "Write your own background description" },
];

// ============================================
// IMAGE UPLOAD COMPONENT
// ============================================

function ImageUpload({
    label,
    value,
    onChange,
    placeholder,
    icon: Icon,
    previewUrl, // Optional preview URL from context (persisted)
}: {
    label: string;
    value: File | null;
    onChange: (file: File | null) => void;
    placeholder: string;
    icon: React.ElementType;
    previewUrl?: string | null; // Persisted preview URL from context
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Use passed preview URL from context, or create one if not provided
    const preview = useMemo(() => {
        if (previewUrl) {
            return previewUrl; // Use persisted URL from context
        }
        if (value) {
            return URL.createObjectURL(value);
        }
        return null;
    }, [previewUrl, value]);

    // Cleanup only locally created blob URLs (not context ones)
    useEffect(() => {
        // Only revoke if we created the URL (not from previewUrl prop)
        if (preview && !previewUrl && value) {
            return () => {
                URL.revokeObjectURL(preview);
            };
        }
    }, [preview, previewUrl, value]);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            onChange(file);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
            </label>
            <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    "relative border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all",
                    "flex flex-col items-center justify-center gap-2 min-h-[100px]",
                    isDragging
                        ? "border-brand-primary bg-brand-primary/10"
                        : "border-border hover:border-brand-primary/50 hover:bg-sidebar-accent/30",
                    preview && "border-brand-primary/30"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onChange(file);
                    }}
                    className="hidden"
                />

                {preview ? (
                    <div className="relative w-full h-20">
                        <Image
                            src={preview}
                            alt="Preview"
                            fill
                            className="object-contain rounded-lg"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                            }}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-500 transition"
                        >
                            <Trash2 className="w-2.5 h-2.5 text-white" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                            <Upload className="w-4 h-4 text-brand-primary" />
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            {placeholder}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">
                            Drag & drop or click
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

// ============================================
// AVATAR CARD COMPONENT
// ============================================

function AvatarCard({
    avatar,
    isSelected,
    onSelect,
}: {
    avatar: PrebuiltAvatar;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    return (
        <div
            onClick={onSelect}
            className={cn(
                "relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200",
                isSelected
                    ? "border-brand-primary shadow-md shadow-brand-primary/20 scale-[1.02]"
                    : "border-border/50 hover:border-brand-primary/50 hover:shadow-sm"
            )}
        >
            <div className="aspect-square relative bg-sidebar">
                {!imageError ? (
                    <Image
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        fill
                        className={cn(
                            "object-cover transition-opacity duration-300",
                            imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary/20 to-brand-primary/5">
                        <User className="w-8 h-8 text-brand-primary/50" />
                    </div>
                )}

                {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 bg-sidebar">
                        <div className="shimmer" />
                    </div>
                )}

                {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                    </div>
                )}
            </div>

            <div className="p-2 bg-card">
                <p className="font-medium text-foreground text-xs">{avatar.name}</p>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {avatar.description}
                </p>
            </div>
        </div>
    );
}

// ============================================
// STEP INDICATOR COMPONENT
// ============================================

import { CheckCircle2 } from "lucide-react";

function StepIndicator({
    currentStep,
    totalSteps,
    onStepClick
}: {
    currentStep: number;
    totalSteps: number;
    onStepClick?: (step: number) => void;
}) {
    const steps = [
        { number: 1, title: "Configure Details", description: "Product & Avatar" },
        { number: 2, title: "Review", description: "Image & Script" },
        { number: 3, title: "Result", description: "Generated Video" },
    ];

    return (
        <div className="bg-gradient-to-br from-card via-card to-sidebar-accent/30 border border-border rounded-xl p-6 sm:p-8 shadow-lg overflow-hidden relative mb-6">
            <div className="w-full max-w-4xl mx-auto">
                <div className="relative">
                    {/* Fixed Container */}
                    <div className="flex items-start justify-between gap-6 sm:gap-10 relative pb-2">
                        {steps.map((step, index) => {
                            const isCompleted = currentStep > step.number;
                            const isActive = currentStep === step.number;

                            return (
                                <div key={step.number} className="flex-1 flex flex-col items-center relative">

                                    {/* Line */}
                                    {index < steps.length - 1 && (
                                        <div className="absolute sm:top-7 top-5 left-[calc(50%+26px)] right-[-60%] h-0.5 z-0 pointer-events-none">
                                            {isCompleted && (
                                                <div
                                                    className="absolute inset-0 border-t-2 border-dashed border-[#03AC13] right-[5%]"
                                                    style={{ animation: "progressFill 0.4s ease-out forwards" }}
                                                />
                                            )}
                                            {!isCompleted && (
                                                <div className="absolute inset-0 border-t-2 border-dashed border-border opacity-70" />
                                            )}
                                        </div>
                                    )}

                                    {/* Circle */}
                                    <div
                                        onClick={() => isActive || isCompleted ? onStepClick?.(step.number) : undefined}
                                        className={`relative z-10 mb-3 ${onStepClick && (isActive || isCompleted) ? "cursor-pointer" : ""}`}
                                    >
                                        {/* Glow */}
                                        {currentStep >= step.number && (
                                            <div
                                                className={`absolute inset-0 rounded-full blur-lg ${isCompleted ? "bg-[#03AC13]/40" : "bg-brand-primary/40"
                                                    }`}
                                            />
                                        )}

                                        <div
                                            className={`
                                                relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full 
                                                flex items-center justify-center font-bold text-sm sm:text-base md:text-lg
                                                transition-all duration-300
                                                ${isCompleted
                                                    ? "bg-[#03AC13]/20 border-2 border-[#03AC13]"
                                                    : isActive
                                                        ? "bg-sidebar-accent border-2 border-brand-primary ring-4 ring-brand-primary/20 shadow-lg"
                                                        : "bg-sidebar-accent/80 border-2 border-border/60"
                                                }
                                            `}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-6 h-6 text-[#03AC13] drop-shadow-lg" />
                                            ) : (
                                                <span
                                                    className={
                                                        isActive
                                                            ? "text-brand-primary font-bold"
                                                            : "text-muted-foreground/70"
                                                    }
                                                >
                                                    {step.number}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Text */}
                                    <div className="text-center px-1 max-w-[90px] md:max-w-none">
                                        <p
                                            className={`text-[11px] sm:text-xs md:text-sm font-semibold leading-tight transition-all duration-300 ${currentStep >= step.number
                                                ? "text-foreground"
                                                : "text-muted-foreground/60"
                                                }`}
                                        >
                                            {step.title}
                                        </p>
                                        <p
                                            className={`hidden md:block text-xs mt-1.5 transition-all duration-300 ${currentStep >= step.number
                                                ? "text-muted-foreground"
                                                : "text-muted-foreground/50"
                                                }`}
                                        >
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes progressFill {
                    0% { transform: scaleX(0); transform-origin: left; opacity: 0; }
                    100% { transform: scaleX(1); transform-origin: left; opacity: 1; }
                }
            `}</style>
        </div>
    );
}

// ============================================
// MAIN FORM COMPONENT
// ============================================

export default function ManualVideoForm({
    onJobCreated,
    isProcessing,
}: ManualVideoFormProps) {
    // Get form state from context for persistence
    const {
        formState,
        setAvatarMode,
        setAvatarImage,
        setAvatarDescription,
        setSelectedAvatarId,
        setProductName,
        setProductDescription,
        setProductImage,
        setBackgroundDescription,
        setVideoLength,
        setAspectRatio,
        setUserScript,
        setGeneratedImageUrl,
        setJobId,
        setCurrentStep,
    } = useManualVideoContext();

    // Destructure form state for easier access
    const {
        avatarMode,
        avatarImage,
        avatarImagePreview,
        avatarDescription,
        selectedAvatarId,
        productName,
        productDescription,
        productImage,
        productImagePreview,
        productHoldDescription,
        backgroundDescription,
        platform,
        videoLength,
        aspectRatio,
        userScript,
        generatedImageUrl,
        jobId,
        currentStep,
    } = formState;

    // Find selected avatar from prebuilt list
    const selectedAvatar = useMemo(() => {
        return PREBUILT_AVATARS.find(a => a.id === selectedAvatarId) || null;
    }, [selectedAvatarId]);

    // UI State (not persisted - local only)
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_loadingStep, setLoadingStep] = useState<
        "idle" | "uploading" | "creating" | "generating" | "polling" | "done"
    >("idle");
    const [loadingPercentage, setLoadingPercentage] = useState(0);

    // Credits
    const [credits, setCredits] = useState<number | null>(null);
    const [loadingCredits, setLoadingCredits] = useState(true);

    // AI Script Modal State
    const [showScriptModal, setShowScriptModal] = useState(false);
    const [aiScriptPrompt, setAiScriptPrompt] = useState("");
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

    // ==================
    // Fetch Credits
    // ==================
    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const response = await axios.get("/api/user/plan");
                const available =
                    (response.data.credits_allowed || 0) - (response.data.credits_used || 0);
                setCredits(available);
            } catch (err) {
                console.error("Failed to fetch credits:", err);
            } finally {
                setLoadingCredits(false);
            }
        };
        fetchCredits();
    }, []);

    // ==================
    // Upload Image to S3
    // ==================
    const uploadImage = async (file: File, type: "avatar" | "product"): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const response = await axios.post("/api/manual-video/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        if (!response.data.success) {
            throw new Error(response.data.error || "Failed to upload image");
        }

        return response.data.url;
    };

    // ==================
    // Step 1 Validation
    // ==================
    const isStep1Valid = useCallback(() => {
        if (!productName.trim()) return false;
        if (!productDescription.trim()) return false;

        if (avatarMode === "prebuilt" && !selectedAvatar) return false;
        if (avatarMode === "upload" && !avatarImage) return false;
        if (avatarMode === "describe" && !avatarDescription.trim()) return false;

        return true;
    }, [productName, productDescription, avatarMode, selectedAvatar, avatarImage, avatarDescription]);

    // ==================
    // Step 1: Generate Reference Image
    // ==================
    const progressRef = useRef(0);

    const handleGenerateImage = async () => {
        if (!isStep1Valid()) {
            toast.error("Please fill in all required fields");
            return;
        }

        if (credits !== null && credits < 1) {
            toast.error("Insufficient credits. Please upgrade your plan.");
            return;
        }

        setLoading(true);
        setLoadingStep("generating");
        progressRef.current = 0;
        setLoadingPercentage(0);

        // Simulate smooth progress for better UX - only increases, never decreases
        const progressInterval = setInterval(() => {
            progressRef.current += 1 + Math.random() * 2; // Smooth increment of 1-3%
            if (progressRef.current >= 85) {
                progressRef.current = 85; // Cap at 85% until complete
            }
            setLoadingPercentage(Math.round(progressRef.current));
        }, 400);

        try {
            // Upload images if provided
            let avatarImageUrl: string | undefined;
            let productImageUrl: string | undefined;

            if (avatarImage) {
                // Progress continues via interval, no manual override
                avatarImageUrl = await uploadImage(avatarImage, "avatar");
            }
            if (productImage) {
                // Progress continues via interval, no manual override
                productImageUrl = await uploadImage(productImage, "product");
            }

            // Build avatar description
            let finalAvatarDescription: string | undefined;
            if (avatarMode === "prebuilt" && selectedAvatar) {
                finalAvatarDescription = selectedAvatar.description;
            } else if (avatarMode === "describe") {
                finalAvatarDescription = avatarDescription;
            }

            // Create job and generate reference image
            const response = await axios.post("/api/manual-video/create", {
                productName,
                productDescription,
                avatarDescription: finalAvatarDescription,
                avatarImageUrl,
                productImageUrl,
                productHoldingDescription: productHoldDescription,
                backgroundDescription,
                platform,
                targetLength: videoLength,
                aspectRatio, // Add aspect ratio to the request
                generateImageOnly: true, // Only generate image, don't start full pipeline
            });

            if (response.data.success) {
                setJobId(response.data.jobId);

                // Poll for reference image
                if (response.data.referenceImageUrl) {
                    // Complete! Set to 100%
                    progressRef.current = 100;
                    setLoadingPercentage(100);
                    clearInterval(progressInterval);
                    setGeneratedImageUrl(response.data.referenceImageUrl);
                    setLoadingStep("done");
                    setCurrentStep(2);
                } else {
                    // Wait for image generation
                    await pollForImage(response.data.jobId);
                    progressRef.current = 100;
                    setLoadingPercentage(100);
                    clearInterval(progressInterval);
                }
            } else {
                clearInterval(progressInterval);
                throw new Error(response.data.error || "Failed to create job");
            }
        } catch (err) {
            clearInterval(progressInterval);
            console.error("Generate image error:", err);
            toast.error(err instanceof Error ? err.message : "Failed to generate image");
        } finally {
            setLoading(false);
            setLoadingStep("idle");
            progressRef.current = 0;
        }
    };

    // ==================
    // Poll for Image Generation
    // ==================
    const pollForImage = async (pollJobId: string) => {
        const maxAttempts = 60; // 3 minutes with 3s intervals
        const pollInterval = 3000;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await axios.get(`/api/manual-video/status?jobId=${pollJobId}`);
                const job = response.data.job;

                if (job.referenceImageUrl) {
                    setGeneratedImageUrl(job.referenceImageUrl);
                    setCurrentStep(2);
                    return;
                }

                if (job.status === "FAILED") {
                    throw new Error(job.errorMessage || "Image generation failed");
                }

                await new Promise((resolve) => setTimeout(resolve, pollInterval));
            } catch (err) {
                if (attempt === maxAttempts - 1) {
                    throw err;
                }
            }
        }

        throw new Error("Image generation timed out");
    };

    // ==================
    // Step 2: Generate Full Video
    // ==================
    const handleGenerateVideo = async () => {
        if (!jobId) {
            toast.error("No job found. Please go back and generate an image first.");
            return;
        }

        // Move to Step 3 IMMEDIATELY so loading shows inline (not in modal)
        setCurrentStep(3);
        onJobCreated(jobId);

        try {
            // Start the video generation pipeline
            const response = await axios.post("/api/manual-video/generate", {
                jobId,
                backgroundDescription,
                platform,
                targetLength: videoLength,
                userScript, // Send the user's script
            });

            if (!response.data.success) {
                throw new Error(response.data.error || "Failed to start video generation");
            }
            // Step3Result component will handle polling and show progress
        } catch (err) {
            console.error("Generate video error:", err);
            toast.error(err instanceof Error ? err.message : "Failed to generate video");
            // Go back to Step 2 on error
            setCurrentStep(2);
        }
    };

    // ==================
    // Regenerate Image
    // ==================
    const handleRegenerateImage = async () => {
        setGeneratedImageUrl(null);
        setCurrentStep(1);
        setJobId(null);
    };

    // Generate script using AI
    const handleGenerateAIScript = async () => {
        if (!aiScriptPrompt.trim()) {
            toast.error("Please enter a prompt for the AI");
            return;
        }

        setIsGeneratingScript(true);

        try {
            const sceneCount = VIDEO_LENGTHS.find(v => v.id === videoLength)?.scenes || 4;
            const duration = parseInt(videoLength);

            const response = await axios.post(
                "/api/topview/generate-script",
                {
                    prompt: `${aiScriptPrompt.trim()}. Product name: ${productName || "this product"}. Product description: ${productDescription || ""}`,
                    duration: `${Math.floor(duration * 0.7)}-${duration}s`,
                    language: "English",
                    scenes: sceneCount,
                },
                { responseType: "text" }
            );

            const generatedScript = response.data?.trim();

            if (generatedScript) {
                setUserScript(generatedScript);
                setShowScriptModal(false);
                setAiScriptPrompt("");
                toast.success(`Script generated with ${sceneCount} scenes!`);
            } else {
                toast.error("Empty script received");
            }
        } catch (err) {
            console.error("Script generation error:", err);
            toast.error("Failed to generate script. Please try again.");
        } finally {
            setIsGeneratingScript(false);
        }
    };

    const hasInsufficientCredits = credits !== null && credits < 1;

    return (
        <div className="bg-card border border-border rounded-xl p-6 space-y-6 w-full">
            {/* Step Indicator - Click to navigate */}
            <StepIndicator
                currentStep={currentStep}
                totalSteps={3}
                onStepClick={(step) => setCurrentStep(step)}
            />

            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/50 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-semibold text-foreground">
                        {currentStep === 1 ? "Configure Product & Avatar" : currentStep === 2 ? "Peview & Generate Video" : "Your Video is Ready!"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {currentStep === 1
                            ? "Set up your product and choose an avatar style"
                            : currentStep === 2
                                ? "Review the generated image and configure video options"
                                : "Watch your generated video or create another one"}
                    </p>
                </div>
            </div>

            {/* Credit Warning */}
            {hasInsufficientCredits && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-red-500">Insufficient Credits</p>
                        <p className="text-xs text-red-400">
                            Please upgrade your plan to generate videos.
                        </p>
                    </div>
                </div>
            )}

            {/* Premium Loading Overlay - ONLY for Step 1 (Image Generation) */}
            {loading && currentStep === 1 && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center">
                    <div className="bg-gradient-to-br from-card via-card to-card/95 border border-border/50 rounded-3xl p-10 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center space-y-8">
                            {/* Circular Progress */}
                            <div className="relative mx-auto w-32 h-32">
                                {/* Background circle */}
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        className="text-border/30"
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="45"
                                        fill="none"
                                        stroke="url(#gradient)"
                                        strokeWidth="6"
                                        strokeLinecap="round"
                                        strokeDasharray={`${loadingPercentage * 2.83} 283`}
                                        className="transition-all duration-300 ease-out"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="hsl(var(--brand-primary))" />
                                            <stop offset="100%" stopColor="hsl(var(--brand-primary) / 0.6)" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                {/* Center content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-foreground">
                                        {Math.round(loadingPercentage)}%
                                    </span>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
                                    <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
                                    Generating Image
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    AI is creating your UGC photo...
                                </p>
                            </div>

                            {/* Animated dots */}
                            <div className="flex items-center justify-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                                <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                                <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>

                            {/* Tip */}
                            <p className="text-xs text-muted-foreground/70">
                                This usually takes 30-60 seconds
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== */}
            {/* STEP 1: Product & Avatar */}
            {/* ==================== */}
            {currentStep === 1 && !loading && (
                <>
                    {/* Avatar Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-brand-primary" />
                                <h3 className="font-medium text-foreground">Choose Avatar</h3>
                            </div>
                            <div className="flex gap-1.5">
                                {(["prebuilt", "upload", "describe"] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setAvatarMode(mode)}
                                        className={cn(
                                            "text-xs px-3 py-1.5 rounded-full border transition-all capitalize",
                                            avatarMode === mode
                                                ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                                                : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                                        )}
                                    >
                                        {mode === "prebuilt" ? "Prebuilt" : mode === "upload" ? "Upload" : "Describe"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {avatarMode === "prebuilt" && (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {PREBUILT_AVATARS.map((avatar) => (
                                    <AvatarCard
                                        key={avatar.id}
                                        avatar={avatar}
                                        isSelected={selectedAvatar?.id === avatar.id}
                                        onSelect={() => setSelectedAvatarId(avatar.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {avatarMode === "upload" && (
                            <ImageUpload
                                label="Avatar Image"
                                value={avatarImage}
                                onChange={setAvatarImage}
                                placeholder="Upload an image of a person to use as avatar"
                                icon={User}
                                previewUrl={avatarImagePreview}
                            />
                        )}

                        {avatarMode === "describe" && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">
                                        Describe your ideal avatar/person *
                                    </label>
                                    <textarea
                                        value={avatarDescription}
                                        onChange={(e) => setAvatarDescription(e.target.value)}
                                        placeholder="e.g., Young woman in her 20s, casual style, friendly smile, wearing a hoodie..."
                                        className="w-full h-24 px-4 py-3 rounded-xl bg-sidebar border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none resize-none text-foreground placeholder:text-muted-foreground/50 text-sm"
                                    />
                                </div>

                                {/* Background Description with Presets */}
                                <div className="space-y-3">
                                    <label className="text-sm text-muted-foreground">
                                        Background/Scene (Optional)
                                    </label>

                                    {/* Preset Buttons */}
                                    <div className="flex flex-wrap gap-2">
                                        {BACKGROUND_PRESETS.map((preset) => (
                                            <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() => setBackgroundDescription(preset.value)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-full text-xs border transition-all",
                                                    backgroundDescription === preset.value
                                                        ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                                                        : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                                                )}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Input */}
                                    <input
                                        type="text"
                                        value={backgroundDescription}
                                        onChange={(e) => setBackgroundDescription(e.target.value)}
                                        placeholder="Or write your own: e.g., modern bathroom, gym setting..."
                                        className="w-full px-4 py-3 rounded-xl bg-sidebar border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none text-foreground placeholder:text-muted-foreground/50 text-sm"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Select a preset or write your own. Leave empty for default home setting.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Product Section */}
                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-brand-primary" />
                            <h3 className="font-medium text-foreground">Product Details</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <ImageUpload
                                label="Product Image (Optional)"
                                value={productImage}
                                onChange={setProductImage}
                                placeholder="Upload a clear image of your product"
                                icon={Package}
                                previewUrl={productImagePreview}
                            />

                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Product Name *</label>
                                <input
                                    type="text"
                                    value={productName}
                                    onChange={(e) => setProductName(e.target.value)}
                                    placeholder="e.g., Vitamin C Serum, Wireless Earbuds..."
                                    className="w-full px-4 py-3 rounded-xl bg-sidebar border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none text-foreground placeholder:text-muted-foreground/50 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">
                                    Product Description *
                                </label>
                                <textarea
                                    value={productDescription}
                                    onChange={(e) => setProductDescription(e.target.value)}
                                    placeholder="Describe your product - what it does, key features, benefits..."
                                    className="w-full h-24 px-4 py-3 rounded-xl bg-sidebar border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none resize-none text-foreground placeholder:text-muted-foreground/50 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Aspect Ratio Section */}
                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-brand-primary" />
                            <h3 className="font-medium text-foreground">Image Aspect Ratio</h3>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            {ASPECT_RATIOS.map((ratio) => (
                                <button
                                    key={ratio.id}
                                    type="button"
                                    onClick={() => setAspectRatio(ratio.id)}
                                    className={cn(
                                        "p-3 rounded-xl border transition-all text-center",
                                        aspectRatio === ratio.id
                                            ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                                            : "border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <div className="text-lg mb-1">{ratio.icon}</div>
                                    <div className="text-xs font-medium">{ratio.name}</div>
                                    <div className="text-[10px] opacity-70">{ratio.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Image Button */}
                    <div className="pt-4 border-t border-border">
                        <button
                            onClick={handleGenerateImage}
                            disabled={!isStep1Valid() || loading || isProcessing || hasInsufficientCredits}
                            className={cn(
                                "w-full py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2",
                                isStep1Valid() && !hasInsufficientCredits
                                    ? "bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:opacity-90"
                                    : "bg-muted cursor-not-allowed opacity-50"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating Preview Image...
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-5 h-5" />
                                    Generate Preview Image
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </button>

                        <div className="mt-3 text-center text-sm text-muted-foreground">
                            {loadingCredits ? (
                                <span className="flex items-center justify-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Loading credits...
                                </span>
                            ) : (
                                <span>
                                    Available credits:{" "}
                                    <span
                                        className={cn(
                                            "font-semibold",
                                            hasInsufficientCredits ? "text-red-500" : "text-brand-primary"
                                        )}
                                    >
                                        {credits}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ==================== */}
            {/* STEP 2: Review & Generate */}
            {/* ==================== */}
            {currentStep === 2 && (
                <>
                    {/* Generated Image Preview */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-brand-primary" />
                                <h3 className="font-medium text-foreground">Generated Reference Image</h3>
                            </div>
                            <button
                                onClick={handleRegenerateImage}
                                className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-all flex items-center gap-1"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                            </button>
                        </div>

                        {generatedImageUrl ? (
                            <div className="relative rounded-xl overflow-hidden border border-border bg-black group">
                                <div className="relative aspect-[9/16] max-h-[400px] mx-auto">
                                    <img
                                        src={generatedImageUrl}
                                        alt="Generated Reference"
                                        className="w-full h-full object-contain"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                        <span className="px-2 py-1 rounded-md bg-black/60 text-white text-xs backdrop-blur-sm">
                                            {productName}
                                        </span>
                                        <span className="px-2 py-1 rounded-md bg-green-500/90 text-white text-xs">
                                            ✓ Ready
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 rounded-xl border border-dashed border-border flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground text-center">
                            This image will be used as reference for all video scenes. The avatar will remain consistent throughout.
                        </p>
                    </div>

                    {/* Video Options Section */}
                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                            <Video className="w-5 h-5 text-brand-primary" />
                            <h3 className="font-medium text-foreground">Video Options</h3>
                        </div>

                        {/* Video Length */}
                        <div className="space-y-2">
                            <label className="text-sm text-muted-foreground">Video Length</label>
                            <Select value={videoLength} onValueChange={setVideoLength}>
                                <SelectTrigger className="w-full h-12 bg-sidebar border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {VIDEO_LENGTHS.map((v) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Video Script Section */}
                    <div className="space-y-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-brand-primary" />
                                <h3 className="font-medium text-foreground">Video Script</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowScriptModal(true)}
                                className="bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2 transition-all text-sm"
                            >
                                <Sparkles className="w-4 h-4" />
                                AI Script Writer
                            </button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Write your own script or use AI to generate one for your {videoLength}s video.
                            </p>

                            <textarea
                                value={userScript}
                                onChange={(e) => setUserScript(e.target.value)}
                                placeholder={`Write your script here or click "AI Script Writer" to generate one...\n\nExample:\n"OMG you guys, I just discovered this amazing product! Let me show you what makes it so special. The quality is incredible, nothing compares! Get yours now with a special discount. Link in bio!"`}
                                rows={5}
                                className="w-full px-4 py-3 rounded-xl bg-sidebar border border-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 outline-none text-foreground placeholder:text-muted-foreground/50 text-sm resize-none"
                            />

                            {/* Script Status */}
                            <div className="flex items-center justify-between text-xs">
                                {userScript ? (
                                    <>
                                        <span className="text-green-500 flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            Script ready ({userScript.split(/[.!?]+/).filter(s => s.trim()).length} sentences)
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setUserScript("")}
                                            className="text-red-400 hover:text-red-500 transition-colors"
                                        >
                                            Clear script
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-amber-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Script required - use AI Script Writer or write your own
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-border space-y-3 flex justify-between">


                        <button
                            onClick={() => setCurrentStep(1)}
                            disabled={loading}
                            className="py-1 px-4 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition flex items-center justify-center gap-2"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleGenerateVideo}
                            disabled={loading || !generatedImageUrl || !userScript.trim()}
                            className={cn(
                                " py-1 px-3 rounded-lg font-semibold text-white transition-all flex items-center justify-center gap-2",
                                generatedImageUrl && userScript.trim()
                                    ? "bg-gradient-to-r from-brand-primary to-brand-primary/80 hover:opacity-90"
                                    : "bg-muted cursor-not-allowed opacity-50"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Starting Video Generation...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Generate Video
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}

            {/* Shimmer Styles */}
            <style>{`
                @keyframes shimmer {
                    0% { background-position: -1000px 0; }
                    100% { background-position: 1000px 0; }
                }
                .shimmer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(
                        90deg,
                        rgba(255, 255, 255, 0) 0%,
                        rgba(255, 255, 255, 0.05) 20%,
                        rgba(255, 255, 255, 0.1) 50%,
                        rgba(255, 255, 255, 0.05) 80%,
                        rgba(255, 255, 255, 0) 100%
                    );
                    background-size: 1000px 100%;
                    animation: shimmer 2s infinite;
                }
            `}</style>

            {/* AI Script Generation Modal */}
            {showScriptModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="sm:max-w-[500px] w-full bg-card border border-border backdrop-blur-xl shadow-xl text-foreground rounded-xl p-6 relative">
                        {/* Close X button */}
                        <button
                            onClick={() => setShowScriptModal(false)}
                            className="absolute top-4 right-4 p-1 hover:bg-sidebar-accent rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                        </button>

                        <div className="mb-4">
                            <h3 className="text-2xl font-semibold text-foreground">
                                Generate Script with AI
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                AI will create a {videoLength}s video script for your product
                            </p>
                        </div>

                        <div className="space-y-6 mt-4">

                            {/* Prompt Input */}
                            <div className="space-y-2">
                                <label className="text-foreground text-sm font-medium">
                                    What should the AI talk about?
                                </label>
                                <textarea
                                    className="w-full bg-sidebar border border-border text-foreground rounded-lg min-h-[120px] p-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none resize-none"
                                    value={aiScriptPrompt}
                                    onChange={(e) => setAiScriptPrompt(e.target.value)}
                                    placeholder={`Describe what you want the AI avatar to say about "${productName || 'your product'}".\n\nExample: "Excited unboxing and review of this amazing product, highlighting its benefits and why viewers should buy it."`}
                                />
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateAIScript}
                                disabled={isGeneratingScript || !aiScriptPrompt.trim()}
                                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white shadow-lg rounded-lg px-6 py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isGeneratingScript ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating Script...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generate Script
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== */}
            {/* STEP 3: Video Result */}
            {/* ==================== */}
            {currentStep === 3 && (
                <Step3Result jobId={jobId} onReset={handleRegenerateImage} />
            )}

            {/* Quick Nav (Testing) */}
            <div className="pt-6 mt-6 border-t border-dashed border-border/50 flex justify-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <span className="text-xs text-muted-foreground self-center mr-2">Debug:</span>
                {[1, 2, 3].map(s => (
                    <QuickNavButton
                        key={s}
                        stepNumber={s as 1 | 2 | 3}
                        setStep={setCurrentStep}
                        currentStep={currentStep}
                    />
                ))}
            </div>

            {/* Lambda Test Panel (Debug) */}
            <LambdaTestPanel />
        </div>
    );
}

// ============================================
// QUICK NAV BUTTON (TESTING)
// ============================================
function QuickNavButton({ stepNumber, setStep, currentStep }: { stepNumber: 1 | 2 | 3; setStep: (s: number) => void; currentStep: number }) {
    return (
        <button
            onClick={() => setStep(stepNumber)}
            className={`px-3 py-1 text-xs rounded border transition-all ${currentStep === stepNumber
                ? "bg-brand-primary text-white border-brand-primary"
                : "bg-sidebar border-border text-muted-foreground hover:bg-sidebar-accent"
                }`}
        >
            Step {stepNumber}
        </button>
    );
}

// ============================================
// STEP 3 RESULT COMPONENT
// ============================================
function Step3Result({ jobId, onReset }: { jobId: string | null; onReset: () => void }) {
    const [status, setStatus] = useState<"loading" | "done" | "failed">("loading");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!jobId) return;

        let isMounted = true;

        // Fake progress for improved UX
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                // Slow down as we approach 90%
                if (prev >= 90) return 90;
                const increment = prev < 50 ? 2 : prev < 80 ? 1 : 0.5;
                return prev + increment;
            });
        }, 800);

        const checkStatus = async () => {
            if (!isMounted) return;

            try {
                const response = await axios.get(`/api/manual-video/status?jobId=${jobId}`);
                const job = response.data.job;

                if (job.status === "DONE" && job.finalVideoUrl) {
                    setVideoUrl(job.finalVideoUrl);
                    setStatus("done");
                    setProgress(100);
                    clearInterval(progressInterval);
                    clearInterval(pollInterval);
                    toast.success("Your video is ready! 🎉");
                } else if (job.status === "FAILED") {
                    setStatus("failed");
                    clearInterval(progressInterval);
                    clearInterval(pollInterval);
                    // Show error toast
                    toast.error(job.errorMessage || "Video generation failed. Please try again.");
                }
                // else: Still processing, continue polling
            } catch (err) {
                console.error("Poll status error:", err);
            }
        };

        // Check immediately then poll
        checkStatus();
        const pollInterval = setInterval(checkStatus, 5000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            clearInterval(progressInterval);
        };
    }, [jobId]);

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-8">
                {/* Circular Progress */}
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="6"
                            className="text-border/30"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#gradient-step3)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${progress * 2.83} 283`}
                            className="transition-all duration-300 ease-out"
                        />
                        <defs>
                            <linearGradient id="gradient-step3" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="hsl(var(--brand-primary))" />
                                <stop offset="100%" stopColor="hsl(var(--brand-primary) / 0.6)" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-foreground">{Math.round(progress)}%</span>
                    </div>
                </div>

                {/* Title & Description */}
                <div className="text-center space-y-3">
                    <h3 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
                        <Video className="w-5 h-5 text-brand-primary animate-pulse" />
                        Generating Video
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        AI is creating your UGC video with multiple scenes. This may take a few minutes.
                    </p>
                </div>

                {/* Animated dots */}
                <div className="flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-brand-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>

                {/* Tip */}
                <p className="text-xs text-muted-foreground/70">
                    Estimated time: 2-5 minutes depending on video length
                </p>
            </div>
        );
    }

    if (status === "failed") {
        // Just show retry button - error is already shown via toast
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-semibold text-red-500">Generation Failed</h3>
                <p className="text-muted-foreground text-sm text-center max-w-md">
                    Something went wrong. Please try again.
                </p>
                <button
                    onClick={onReset}
                    className="px-6 py-2 rounded-lg bg-brand-primary text-white hover:bg-brand-primary/90 transition flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-primary to-purple-600">
                    Video Ready!
                </h3>
            </div>

            {/* Video Player Box */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-brand-primary/20 shadow-2xl bg-black aspect-[9/16] max-h-[500px] mx-auto group">
                {videoUrl && (
                    <video
                        src={videoUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                    />
                )}
            </div>

            <div className="flex gap-3 pt-4">
                <a
                    href={videoUrl || "#"}
                    download
                    className="flex-1 py-3 rounded-xl bg-brand-primary text-white font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
                >
                    <div className="w-5 h-5"><Zap className="w-5 h-5" /></div>
                    Download Video
                </a>
                <button
                    onClick={onReset}
                    className="flex-1 py-3 rounded-xl border border-border text-foreground hover:bg-sidebar-accent transition"
                >
                    Create Another
                </button>
            </div>
        </div>
    );
}
