import { SignIn } from "@clerk/nextjs";
import AuthLayout from "../../_components/AuthLayout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Page() {
  return (
    <AuthLayout>

      <div className="mb-8 text-center lg:text-left">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome to Vidholdify</h2>
        <p className="text-gray-400">Sign in to create amazing videos</p>
      </div>

      <SignIn
        forceRedirectUrl="/dashboard"
        appearance={{
          layout: {
            socialButtonsPlacement: "top",
            logoImageUrl: "",
          },
          variables: {
            colorPrimary: "#413BFA",
            colorText: "white",
            colorBackground: "transparent",
            colorInputBackground: "#050a1f",
            colorInputText: "white",
            colorTextSecondary: "rgba(255,255,255,0.6)",
            colorDanger: "#ef4444",
          },
          elements: {
            socialButtonsBlockButton:
              "bg-[#050a1f] hover:bg-[#0a1535] border border-[#413BFA]/30 rounded-xl shadow-[0_0_20px_rgba(65,59,250,0.15)] text-white h-12 transition-all duration-300",
            socialButtonsBlockButtonText: "!text-white font-medium",
            socialButtonsIconButton: "text-white",

            rootBox: "w-full",
            card: "bg-transparent shadow-none p-0 w-full",

            headerTitle: "hidden",
            headerSubtitle: "hidden",

            formFieldLabel: "text-gray-300 font-medium",
            formFieldInput:
              "bg-[#050a1f] border border-[#413BFA]/30 text-white placeholder-gray-500 rounded-xl h-12 focus:border-[#413BFA] focus:ring-2 focus:ring-[#413BFA]/20 transition-all duration-300",

            formButtonPrimary:
              "bg-gradient-to-r from-[#165DFC] to-[#413BFA] hover:from-[#413BFA] hover:to-[#9333ea] text-white rounded-xl h-12 mt-2 font-semibold shadow-lg shadow-[#413BFA]/30 transition-all duration-300",

            footer: "text-gray-400 mt-6",
            footerActionLink: "text-[#397CF7] hover:text-[#413BFA] hover:underline font-medium transition-colors",
            footerPages: "hidden",

            dividerLine: "bg-white/10",
            dividerText: "text-gray-500",

            identityPreview: "bg-[#050a1f] border border-[#413BFA]/20 rounded-xl",
            identityPreviewText: "text-white",
            identityPreviewEditButton: "text-[#397CF7] hover:text-[#413BFA]",
          },
        }}
      />

      {/* Back Button - Only visible on mobile, at bottom center */}
      <Link
        href="/"
        className="lg:hidden flex items-center justify-center gap-2 mt-6 text-white/70 hover:text-white text-sm font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
      </Link>
    </AuthLayout>
  );
}
