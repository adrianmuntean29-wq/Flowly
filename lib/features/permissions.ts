/**
 * FLOWLY FEATURE PERMISSIONS SYSTEM
 * Controlează accesul la funcționalități pe baza subscription plan
 */

// DB stores ENTERPRISE, we display it as BUSINESS everywhere in the UI
export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

// Display label for each plan
export const PLAN_DISPLAY_NAME: Record<SubscriptionPlan, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  ENTERPRISE: 'Business',
};
export type PostType = 'POST' | 'CAROUSEL' | 'REEL' | 'VIDEO' | 'AD';
export type Feature =
  | 'generate_text'
  | 'generate_image'
  | 'generate_carousel'
  | 'generate_reel'
  | 'generate_video'
  | 'generate_ad'
  | 'schedule_posts'
  | 'analytics'
  | 'automations'
  | 'social_connect';

/**
 * Definește ce funcționalități sunt disponibile pentru fiecare plan
 */
export const PLAN_FEATURES: Record<SubscriptionPlan, Record<Feature, boolean>> = {
  FREE: {
    generate_text: true,
    generate_image: true,
    generate_carousel: false,  // ❌ Blocat - upgrade la PRO
    generate_reel: false,      // ❌ Blocat - upgrade la PRO
    generate_video: false,     // ❌ Blocat - upgrade la PRO
    generate_ad: false,        // ❌ Blocat - upgrade la PRO
    schedule_posts: false,     // ❌ Blocat - upgrade la PRO
    analytics: false,          // ❌ Blocat - upgrade la PRO
    automations: false,        // ❌ Blocat - upgrade la PRO
    social_connect: true,      // ✅ 1 platformă în FREE
  },
  PRO: {
    generate_text: true,
    generate_image: true,
    generate_carousel: true,
    generate_reel: true,       // ✅ Deblocat în PRO
    generate_video: true,      // ✅ Deblocat în PRO
    generate_ad: true,         // ✅ Deblocat în PRO
    schedule_posts: true,      // ✅ Deblocat în PRO (cu limite)
    analytics: true,           // ✅ Deblocat în PRO
    automations: true,         // ✅ Deblocat în PRO
    social_connect: true,      // ✅ Deblocat în PRO
  },
  ENTERPRISE: {
    generate_text: true,
    generate_image: true,
    generate_carousel: true,
    generate_reel: true,
    generate_video: true,
    generate_ad: true,
    schedule_posts: true,
    analytics: true,
    automations: true,
    social_connect: true,
  },
};

/**
 * Limite lunare per plan
 */
export const PLAN_LIMITS: Record<SubscriptionPlan, {
  postsPerMonth: number | null;
  socialAccounts: number | null;
  automations: number | null;
}> = {
  FREE: {
    postsPerMonth: 20,
    socialAccounts: 1,
    automations: 0,
  },
  PRO: {
    postsPerMonth: 200,
    socialAccounts: 3,
    automations: 10,
  },
  ENTERPRISE: {
    postsPerMonth: null,  // Nelimitat
    socialAccounts: null, // Nelimitat
    automations: null,    // Nelimitat
  },
};

/**
 * Verifică dacă un user are acces la o anumită funcționalitate
 */
export function hasFeatureAccess(plan: SubscriptionPlan, feature: Feature): boolean {
  return PLAN_FEATURES[plan]?.[feature] ?? false;
}

/**
 * Verifică dacă un user poate genera un anumit tip de post
 */
export function canGeneratePostType(plan: SubscriptionPlan, postType: PostType): boolean {
  const featureMap: Record<PostType, Feature> = {
    POST: 'generate_image',
    CAROUSEL: 'generate_carousel',
    REEL: 'generate_reel',
    VIDEO: 'generate_video',
    AD: 'generate_ad',
  };

  const feature = featureMap[postType];
  return hasFeatureAccess(plan, feature);
}

/**
 * Returnează post types disponibile pentru un plan
 */
export function getAvailablePostTypes(plan: SubscriptionPlan): PostType[] {
  const allTypes: PostType[] = ['POST', 'CAROUSEL', 'REEL', 'VIDEO', 'AD'];
  return allTypes.filter(type => canGeneratePostType(plan, type));
}

/**
 * Returnează post types LOCKED pentru un plan (necesită upgrade)
 */
export function getLockedPostTypes(plan: SubscriptionPlan): PostType[] {
  const allTypes: PostType[] = ['POST', 'CAROUSEL', 'REEL', 'VIDEO', 'AD'];
  return allTypes.filter(type => !canGeneratePostType(plan, type));
}

/**
 * Obține planul minim necesar pentru o funcționalitate
 */
export function getRequiredPlan(feature: Feature): SubscriptionPlan {
  if (PLAN_FEATURES.FREE[feature]) return 'FREE';
  if (PLAN_FEATURES.PRO[feature]) return 'PRO';
  return 'ENTERPRISE';
}

/**
 * Obține planul minim necesar pentru un post type
 */
export function getRequiredPlanForPostType(postType: PostType): SubscriptionPlan {
  if (canGeneratePostType('FREE', postType)) return 'FREE';
  if (canGeneratePostType('PRO', postType)) return 'PRO';
  return 'ENTERPRISE';
}

/**
 * Verifică dacă user-ul a atins limita lunară
 */
export function hasReachedMonthlyLimit(plan: SubscriptionPlan, currentCount: number): boolean {
  const limit = PLAN_LIMITS[plan].postsPerMonth;
  if (limit === null) return false; // Nelimitat
  return currentCount >= limit;
}

/**
 * Returnează mesaj de upgrade personalizat
 */
export function getUpgradeMessage(feature: Feature | PostType): string {
  const isPostType = ['POST', 'CAROUSEL', 'REEL', 'VIDEO', 'AD'].includes(feature as PostType);

  if (isPostType) {
    const postType = feature as PostType;
    const requiredPlan = getRequiredPlanForPostType(postType);

    const messages: Record<PostType, string> = {
      POST: 'Upgrade to unlock static posts',
      CAROUSEL: 'Upgrade to unlock carousel posts',
      REEL: 'Upgrade to PRO to create engaging Reels',
      VIDEO: 'Upgrade to PRO to generate video content',
      AD: 'Upgrade to PRO to create professional ads',
    };

    return messages[postType] || `Upgrade to ${requiredPlan} to unlock this feature`;
  }

  const requiredPlan = getRequiredPlan(feature as Feature);
  return `Upgrade to ${requiredPlan} to unlock this feature`;
}

/**
 * Pricing per plan (pentru upgrade CTA)
 */
export const PLAN_PRICING = {
  FREE: { price: 0, label: 'Free Forever' },
  PRO: { price: 29, label: '$29/month' },
  ENTERPRISE: { price: 99, label: '$99/month' },
};
