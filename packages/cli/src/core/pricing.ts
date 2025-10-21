/**
 * Centralized pricing information for LLM providers
 * Prices are per 1 million tokens (as of October 2025)
 */

export interface PricingInfo {
  input: number;  // Price per 1M input tokens in USD
  output: number; // Price per 1M output tokens in USD
}

export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: 'USD';
}

/**
 * Pricing data for different LLM providers
 * Update these values when providers change their pricing
 */
export const PRICING: Record<string, Record<string, PricingInfo>> = {
  openai: {
    'gpt-4.1-mini': { input: 0.15, output: 0.60 },
    'gpt-4.1-nano': { input: 0.10, output: 0.40 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
  },
  gemini: {
    'gemini-2.5-flash': { input: 0.075, output: 0.30 },
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  },
};

/**
 * Calculate cost for a given provider, model, and token usage
 */
export function calculateCost(
  provider: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): CostCalculation | null {
  const pricing = PRICING[provider]?.[model];
  
  if (!pricing) {
    return null;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    currency: 'USD',
  };
}

/**
 * Get pricing info for a specific provider and model
 */
export function getPricing(provider: string, model: string): PricingInfo | null {
  return PRICING[provider]?.[model] || null;
}

/**
 * Get all available providers
 */
export function getProviders(): string[] {
  return Object.keys(PRICING);
}

/**
 * Get all models for a specific provider
 */
export function getModels(provider: string): string[] {
  return Object.keys(PRICING[provider] || {});
}

