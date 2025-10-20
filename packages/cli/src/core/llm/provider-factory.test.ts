import { describe, it, expect, beforeAll } from 'vitest';
import { createProvider, createProviderFromConfig, getSupportedProviders } from './provider-factory.js';
import './providers/openai.js';
import './providers/gemini.js';

describe('Provider Factory', () => {
  beforeAll(() => {
    console.log('🧪 Testing Provider Factory Integration\n');
  });

  it('should list supported providers', () => {
    const providers = getSupportedProviders();
    console.log('✓ Supported providers:', providers);
    
    expect(providers).toContain('openai');
    expect(providers).toContain('gemini');
    expect(providers.length).toBeGreaterThanOrEqual(2);
  });

  it('should create OpenAI provider', () => {
    const provider = createProvider('openai', {
      apiKey: 'test-key',
      model: 'gpt-4.1-mini'
    });

    expect(provider).toBeDefined();
    expect(provider.translate).toBeDefined();
    expect(typeof provider.translate).toBe('function');
  });

  it('should create Gemini provider', () => {
    const provider = createProvider('gemini', {
      apiKey: 'test-key',
      model: 'gemini-2.5-flash'
    });

    expect(provider).toBeDefined();
    expect(provider.translate).toBeDefined();
    expect(typeof provider.translate).toBe('function');
  });

  it('should create provider from config (OpenAI)', () => {
    const config = {
      provider: 'openai' as const,
      apiKey: 'test-key',
      model: 'gpt-4.1-mini'
    };

    const provider = createProviderFromConfig(config);

    expect(provider).toBeDefined();
    expect(provider.translate).toBeDefined();
  });

  it('should create provider from config (Gemini)', () => {
    const config = {
      provider: 'gemini' as const,
      apiKey: 'test-key',
      model: 'gemini-2.5-flash'
    };

    const provider = createProviderFromConfig(config);

    expect(provider).toBeDefined();
    expect(provider.translate).toBeDefined();
  });

  it('should use default provider when not specified', () => {
    const config = {
      apiKey: 'test-key',
      model: 'gpt-4.1-mini'
    };

    const provider = createProviderFromConfig(config);

    expect(provider).toBeDefined();
    // Default should be OpenAI
  });

  it('should throw error for unsupported provider', () => {
    expect(() => {
      createProvider('unsupported' as any, {
        apiKey: 'test-key',
        model: 'test-model'
      });
    }).toThrow(/Unsupported provider type/);
  });

  // Note: Provider validation happens at runtime when translate() is called,
  // not at construction time. This is by design for flexibility.
});
