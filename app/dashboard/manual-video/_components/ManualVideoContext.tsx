"use client";

import { createContext, useContext, useState, ReactNode } from "react";

// ============================================
// TYPES
// ============================================

interface ManualVideoFormState {
    // Avatar
    avatarMode: "prebuilt" | "upload" | "describe";
    avatarImage: File | null;
    avatarImagePreview: string | null; // Blob URL for preview
    avatarImageS3Url: string | null; // S3 URL after upload
    avatarDescription: string;
    selectedAvatarId: string | null;

    // Product
    productName: string;
    productImage: File | null;
    productImagePreview: string | null; // Blob URL for preview
    productImageS3Url: string | null; // S3 URL after upload
    productHoldDescription: string;

    // Background
    backgroundDescription: string;

    // Video Options
    platform: string;
    videoLength: string;
    aspectRatio: string;

    // User-provided Script (optional - if empty, AI generates it)
    userScript: string;

    // Generated Image
    generatedImageUrl: string | null;
    jobId: string | null;

    // Current Step
    currentStep: number;
}

interface ManualVideoContextType {
    formState: ManualVideoFormState;

    // Setters
    setAvatarMode: (mode: "prebuilt" | "upload" | "describe") => void;
    setAvatarImage: (file: File | null) => void;
    setAvatarImageS3Url: (url: string | null) => void;
    setAvatarDescription: (desc: string) => void;
    setSelectedAvatarId: (id: string | null) => void;

    setProductName: (name: string) => void;
    setProductImage: (file: File | null) => void;
    setProductImageS3Url: (url: string | null) => void;
    setProductHoldDescription: (desc: string) => void;

    setBackgroundDescription: (desc: string) => void;

    setPlatform: (platform: string) => void;
    setVideoLength: (length: string) => void;
    setAspectRatio: (ratio: string) => void;

    setUserScript: (script: string) => void;

    setGeneratedImageUrl: (url: string | null) => void;
    setJobId: (id: string | null) => void;

    setCurrentStep: (step: number) => void;

    // Reset function
    resetForm: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialFormState: ManualVideoFormState = {
    avatarMode: "prebuilt",
    avatarImage: null,
    avatarImagePreview: null,
    avatarImageS3Url: null,
    avatarDescription: "",
    selectedAvatarId: null,

    productName: "",
    productImage: null,
    productImagePreview: null,
    productImageS3Url: null,
    productHoldDescription: "holding the product securely in hand at chest level, fingers naturally wrapped around it, presenting it to the camera",

    backgroundDescription: "clean, well-lit home setting, natural lighting",

    platform: "tiktok",
    videoLength: "30",
    aspectRatio: "9:16",

    userScript: "", // Empty means AI will generate, non-empty means user's script

    generatedImageUrl: null,
    jobId: null,

    currentStep: 1,
};

// ============================================
// CONTEXT
// ============================================

const ManualVideoContext = createContext<ManualVideoContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

export function ManualVideoProvider({ children }: { children: ReactNode }) {
    const [formState, setFormState] = useState<ManualVideoFormState>(initialFormState);

    // Helper to update a single field
    const updateField = <K extends keyof ManualVideoFormState>(
        key: K,
        value: ManualVideoFormState[K]
    ) => {
        setFormState((prev) => ({ ...prev, [key]: value }));
    };

    // Avatar setters
    const setAvatarMode = (mode: "prebuilt" | "upload" | "describe") => {
        updateField("avatarMode", mode);
    };

    const setAvatarImage = (file: File | null) => {
        // Revoke old preview URL if exists
        if (formState.avatarImagePreview) {
            URL.revokeObjectURL(formState.avatarImagePreview);
        }

        // Create new preview URL
        const preview = file ? URL.createObjectURL(file) : null;

        setFormState((prev) => ({
            ...prev,
            avatarImage: file,
            avatarImagePreview: preview,
        }));
    };

    const setAvatarImageS3Url = (url: string | null) => {
        updateField("avatarImageS3Url", url);
    };

    const setAvatarDescription = (desc: string) => {
        updateField("avatarDescription", desc);
    };

    const setSelectedAvatarId = (id: string | null) => {
        updateField("selectedAvatarId", id);
    };

    // Product setters
    const setProductName = (name: string) => {
        updateField("productName", name);
    };



    const setProductImage = (file: File | null) => {
        // Revoke old preview URL if exists
        if (formState.productImagePreview) {
            URL.revokeObjectURL(formState.productImagePreview);
        }

        // Create new preview URL
        const preview = file ? URL.createObjectURL(file) : null;

        setFormState((prev) => ({
            ...prev,
            productImage: file,
            productImagePreview: preview,
        }));
    };

    const setProductImageS3Url = (url: string | null) => {
        updateField("productImageS3Url", url);
    };

    const setProductHoldDescription = (desc: string) => {
        updateField("productHoldDescription", desc);
    };

    // Background setter
    const setBackgroundDescription = (desc: string) => {
        updateField("backgroundDescription", desc);
    };

    // Video options setters
    const setPlatform = (platform: string) => {
        updateField("platform", platform);
    };

    const setVideoLength = (length: string) => {
        updateField("videoLength", length);
    };

    const setAspectRatio = (ratio: string) => {
        updateField("aspectRatio", ratio);
    };

    // User script setter
    const setUserScript = (script: string) => {
        updateField("userScript", script);
    };

    // Generated image setters
    const setGeneratedImageUrl = (url: string | null) => {
        updateField("generatedImageUrl", url);
    };

    const setJobId = (id: string | null) => {
        updateField("jobId", id);
    };

    // Step setter
    const setCurrentStep = (step: number) => {
        updateField("currentStep", step);
    };

    // Reset function
    const resetForm = () => {
        // Revoke preview URLs before resetting
        if (formState.avatarImagePreview) {
            URL.revokeObjectURL(formState.avatarImagePreview);
        }
        if (formState.productImagePreview) {
            URL.revokeObjectURL(formState.productImagePreview);
        }

        setFormState(initialFormState);
    };

    return (
        <ManualVideoContext.Provider
            value={{
                formState,
                setAvatarMode,
                setAvatarImage,
                setAvatarImageS3Url,
                setAvatarDescription,
                setSelectedAvatarId,
                setProductName,
                setProductImage,
                setProductImageS3Url,
                setProductHoldDescription,
                setBackgroundDescription,
                setPlatform,
                setVideoLength,
                setAspectRatio,
                setUserScript,
                setGeneratedImageUrl,
                setJobId,
                setCurrentStep,
                resetForm,
            }}
        >
            {children}
        </ManualVideoContext.Provider>
    );
}

// ============================================
// HOOK
// ============================================

export function useManualVideoContext() {
    const context = useContext(ManualVideoContext);
    if (!context) {
        throw new Error("useManualVideoContext must be used within ManualVideoProvider");
    }
    return context;
}
