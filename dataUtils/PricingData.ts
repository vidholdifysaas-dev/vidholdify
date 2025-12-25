export interface PricingPlan {
  id: string;
  name: string;
  iconId: "starter" | "professional" | "business" | "scale";
  price: {
    monthly: number;
    yearly: number;
  };
  priceId: {
    monthly: string;
    yearly: string;
  };
  description: string;
  features: string[];
  isPopular?: boolean;
  buttonText: string;
}

export const pricingData: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    iconId: "starter",
    price: {
      monthly: 79,
      yearly: 790,
    },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_PRICE_STARTER_MONTHLY!,
      yearly: process.env.NEXT_PUBLIC_PRICE_STARTER_YEARLY!,
    },
    description: "Perfect for individuals starting out.",
    features: [
      "10 UGC videos (30 sec)",
      "40 VEO3 credits (15s max)",
      "400+ UGC Avatars (8 ethnicities)",
      "15 Languages",
      "50+ Voices with accents",
      "30+ Video styles",
      "10+ Subtitle styles",
      "Product URL import",
      "Auto image upload",
      "Auto & custom script generation",
      "Email support",
    ],
    buttonText: "Get Started",
    isPopular: false,
  },

  {
    id: "professional",
    name: "Professional",
    iconId: "professional",
    price: {
      monthly: 189,
      yearly: 1890,
    },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_PRICE_PROFESSIONAL_MONTHLY!,
      yearly: process.env.NEXT_PUBLIC_PRICE_PROFESSIONAL_YEARLY!,
    },
    description: "For creators who need more power.",
    features: [
      "33 UGC videos (60 sec)",
      "120 VEO3 credits (30s max)",
      "400+ UGC Avatars (8 ethnicities)",
      "15 Languages",
      "50+ Voices with accents",
      "30+ Video styles",
      "10+ Subtitle styles",
      "Product URL import",
      "Auto image upload",
      "Auto & custom script generation",
      "Priority support",
    ],
    buttonText: "Get Started",
    isPopular: true,
  },

  {
    id: "business",
    name: "Business",
    iconId: "business",
    price: {
      monthly: 379,
      yearly: 3790,
    },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_PRICE_BUSINESS_MONTHLY!,
      yearly: process.env.NEXT_PUBLIC_PRICE_BUSINESS_YEARLY!,
    },
    description: "Scale your video production.",
    features: [
      "67 UGC videos (90 sec)",
      "240 VEO3 credits (45s max)",
      "400+ UGC Avatars (8 ethnicities)",
      "15 Languages",
      "50+ Voices with accents",
      "30+ Video styles",
      "10+ Subtitle styles",
      "Product URL import",
      "Auto image upload",
      "Auto & custom script generation",
      "Priority support",
      "Relaxed video history",
      "Bulk production capability",
    ],
    buttonText: "Get Started",
    isPopular: false,
  },

  {
    id: "scale",
    name: "Scale",
    iconId: "scale",
    price: {
      monthly: 749,
      yearly: 7490,
    },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_PRICE_SCALE_MONTHLY!,
      yearly: process.env.NEXT_PUBLIC_PRICE_SCALE_YEARLY!,
    },
    description: "For agencies and high volume.",
    features: [
      "136 UGC videos (90 sec)",
      "480 VEO3 credits (60s max)",
      "400+ UGC Avatars (8 ethnicities)",
      "15 Languages",
      "50+ Voices with accents",
      "30+ Video styles",
      "10+ Subtitle styles",
      "Product URL import",
      "Auto image upload",
      "Auto & custom script generation",
      "VIP Priority support",
      "Unlimited video history",
      "Early access to new features",
      "Dedicated account manager",
    ],
    buttonText: "Get Started",
    isPopular: false,
  },
];
