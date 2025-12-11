export interface PricingPlan {
  id: string;
  name: string;
  icon: string;
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
    icon: "🎬",
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
      "11 UGC videos (30 sec)",
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
    icon: "⚡",
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
      "34 UGC videos (60 sec)",
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
    icon: "🚀",
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
      "68 UGC videos (90 sec)",
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
    icon: "👑",
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
      "137 UGC videos (90 sec)",
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
