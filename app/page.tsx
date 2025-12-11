import Header from "./_components/Header";
import HeroSection from "./_components/HeroSection";
import ShowcaseSection from "./_components/ShowcaseSection";
import AnySizeSection from "./_components/AnySizeSection";
import FeaturesSection from "./_components/FeaturesSection";
import UseCasesSection from "./_components/UseCasesSection";
import HowItWorksSection from "./_components/HowItWorksSection";
import KeyFeaturesSection from "./_components/KeyFeaturesSection";
import TestimonialsSection from "./_components/TestimonialsSection";
import PricingSection from "./_components/PricingSection";
import FAQSection from "./_components/FAQSection";
import Footer from "./_components/Footer";
import CTASection from "./_components/CTASection";

export default function Home() {
  return (
    <>
      {/* Fixed Spline Background - Visible across entire page */}
      <div className="fixed top-0 left-0 w-full h-screen -z-50 sm:pt-0 pt-65">
        <iframe
          src="https://my.spline.design/aidatamodelinteraction-mdTL3FktFVHgDvFr5TKtnYDV"
          frameBorder="0"
          width="100%"
          height="100vh"
          className="w-full h-full"
        ></iframe>
      </div>

      {/* Page Content */}
      <main className="relative min-h-screen">
        <Header />

        <HeroSection />
        <ShowcaseSection />
        <AnySizeSection />
        <FeaturesSection />
        <UseCasesSection />
        <HowItWorksSection />
        <KeyFeaturesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />

        <Footer />
      </main>
    </>
  );
}
