// Single source of truth for every owner-specific value.
// Do not hardcode these anywhere else.

export const SITE_NAME = 'Charter Cost Guide';
export const SITE_URL = 'https://charter-cost-guide.pages.dev';
export const TAGLINE = 'Independent charter cost guides';

// Empty until the owner supplies them. Templates must degrade gracefully.
export const CONTACT_EMAIL = '';
export const EDITOR_NAME = '';
export const NEWSLETTER_ACTION_URL = '';
export const CF_BEACON_TOKEN = '';
export const GSC_VERIFICATION = 'URb-Z-oa40DE9YrO0hkgAenVVRxukxLL_0O1CFuHge4';
export const GA4_MEASUREMENT_ID = '';

export const YEAR = new Date().getFullYear();

// Derived helpers
export const EDITOR_DISPLAY_NAME = EDITOR_NAME || `The ${SITE_NAME} editorial team`;
export const HAS_CONTACT_EMAIL = CONTACT_EMAIL.length > 0;
export const HAS_NEWSLETTER = NEWSLETTER_ACTION_URL.length > 0;
export const HAS_ANALYTICS = CF_BEACON_TOKEN.length > 0;
export const HAS_GSC = GSC_VERIFICATION.length > 0;
export const HAS_GA4 = GA4_MEASUREMENT_ID.length > 0;
