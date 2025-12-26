export const planLimits = {
  starter: {
    credits: 40,
    credits_veo: 20,
    maxDuration: 30,
    maxDuration_veo: 15,
  },
  professional: {
    credits: 120,
    credits_veo: 60,
    maxDuration: 60,
    maxDuration_veo: 30,
  },
  business: {
    credits: 240,
    credits_veo: 120,
    maxDuration: 90,
    maxDuration_veo: 45,
  },
  scale: {
    credits: 480,
    credits_veo: 240,
    maxDuration: 90,
    maxDuration_veo: 60,
  },
  free: {
    credits: 0,
    credits_veo: 0,
    maxDuration: 15,
    maxDuration_veo: 15,
  },
};

export type PlanTier = keyof typeof planLimits;