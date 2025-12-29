import { SignIn } from "@clerk/nextjs";
import AuthLayout from "../../_components/AuthLayout";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Page() {
  return (
    <AuthLayout>

      <div className="mb-8 text-center">
         <img src="Full_logo.svg" width={150} className="mx-auto pb-3 block sm:hidden" />
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome to Vidholdify</h2>
        <p className="text-gray-400 text-sm sm:text-base">Sign in to create amazing videos</p>
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
            // Container elements - force all to respect parent width
            rootBox: "!w-full !max-w-full overflow-hidden",
            cardBox: "!w-full !max-w-full",
            card: "!bg-transparent !shadow-none !p-0 !w-full !max-w-full",
            main: "!w-full !max-w-full",
            form: "!w-full !max-w-full",
            formFieldRow: "!w-full !max-w-full",
            formField: "!w-full !max-w-full",

            // Social buttons
            socialButtonsBlockButton:
              "bg-[#050a1f] hover:bg-[#0a1535] border border-[#413BFA]/30 rounded-xl shadow-[0_0_20px_rgba(65,59,250,0.15)] text-white h-12 transition-all duration-300 !w-full",
            socialButtonsBlockButtonText: "!text-white font-medium",
            socialButtonsIconButton: "text-white",

            // Hide default header
            headerTitle: "hidden",
            headerSubtitle: "hidden",

            // Form fields
            formFieldLabel: "text-gray-300 font-medium",
            formFieldInput:
              "bg-[#050a1f] border border-[#413BFA]/30 text-white placeholder-gray-500 rounded-xl h-12 focus:border-[#413BFA] focus:ring-2 focus:ring-[#413BFA]/20 transition-all duration-300 !w-full",

            // Primary button
            formButtonPrimary:
              "bg-gradient-to-r from-[#165DFC] to-[#413BFA] hover:from-[#413BFA] hover:to-[#9333ea] text-white rounded-xl h-12 mt-2 font-semibold shadow-lg shadow-[#413BFA]/30 transition-all duration-300 !w-full",

            // Footer - center and constrain
            footer: "text-gray-400 mt-6 !w-full !max-w-full text-center flex flex-col items-center",
            footerAction: "!w-full text-center justify-center",
            footerActionLink: "text-[#397CF7] hover:text-[#413BFA] hover:underline font-medium transition-colors",
            footerPages: "hidden",

            // Divider
            dividerLine: "bg-white/10",
            dividerText: "text-gray-500",

            // Identity preview
            identityPreview: "bg-[#050a1f] border border-[#413BFA]/20 rounded-xl !w-full",
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
