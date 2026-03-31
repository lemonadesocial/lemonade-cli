export const TIER_LIMITS: Record<string, Record<string, { enabled: boolean; limit?: number }>> = {
  custom_agents:              { free: { enabled: false, limit: 0 }, pro: { enabled: true, limit: 1 },  plus: { enabled: true, limit: 3 },  max: { enabled: true, limit: 10 }, enterprise: { enabled: true, limit: 0 } },
  advanced_ai_models:         { free: { enabled: true,  limit: 2 }, pro: { enabled: true, limit: 0 },  plus: { enabled: true, limit: 0 },  max: { enabled: true, limit: 0 },  enterprise: { enabled: true, limit: 0 } },
  premium_ai_models:          { free: { enabled: false },           pro: { enabled: false },            plus: { enabled: true },            max: { enabled: true },            enterprise: { enabled: true } },
  custom_event_slug:          { free: { enabled: false },           pro: { enabled: true },             plus: { enabled: true },            max: { enabled: true },            enterprise: { enabled: true } },
  custom_domain:              { free: { enabled: false },           pro: { enabled: false },            plus: { enabled: true },            max: { enabled: true },            enterprise: { enabled: true } },
  remove_branding:            { free: { enabled: false },           pro: { enabled: false },            plus: { enabled: true },            max: { enabled: true },            enterprise: { enabled: true } },
  premium_themes:             { free: { enabled: true,  limit: 3 }, pro: { enabled: true, limit: 10 }, plus: { enabled: true, limit: 0 },  max: { enabled: true, limit: 0 },  enterprise: { enabled: true, limit: 0 } },
  newsletter_sends_per_month: { free: { enabled: false, limit: 0 }, pro: { enabled: true, limit: 4 },  plus: { enabled: true, limit: 12 }, max: { enabled: true, limit: 30 }, enterprise: { enabled: true, limit: 0 } },
  newsletter_recipients:      { free: { enabled: false, limit: 0 }, pro: { enabled: true, limit: 1000 }, plus: { enabled: true, limit: 5000 }, max: { enabled: true, limit: 25000 }, enterprise: { enabled: true, limit: 0 } },
};

export const VALID_CONFIG_KEYS = ['default_space', 'output_format', 'api_url', 'hydra_url', 'registry_url'] as const;

export type ValidConfigKey = typeof VALID_CONFIG_KEYS[number];
