# Configuration Guide

Complete guide to configuring i18n-llm for your project.

---

## Configuration File

i18n-llm uses a JavaScript configuration file (default: `i18n-llm.config.js`) that exports a configuration object.

### Basic Configuration

```javascript
export default {
  schemaFiles: ["./i18n/schema.json"],
  outputDir: "./i18n/locales",
  sourceLanguage: "en",
  providerConfig: {
    provider: "openai",
    model: "gpt-4.1-mini",
  },
};
```

### Full Configuration

```javascript
export default {
  // Required: Array of schema file paths
  schemaFiles: [
    "./i18n/schema.json",
    "./i18n/schema-additional.json"
  ],
  
  // Required: Output directory for generated translation files
  outputDir: "./i18n/locales",
  
  // Required: Source language code (ISO 639-1)
  sourceLanguage: "en",
  
  // Optional: Custom state file path
  // Default: ".i18n-llm-state.json"
  statePath: ".i18n-llm-state.json",
  
  // Optional: Custom history file path
  // Default: ".i18n-history.json"
  historyPath: ".i18n-llm-history.json",
  
  // Required: LLM provider configuration
  providerConfig: {
    // Provider name: "openai" or "gemini"
    provider: "openai",
    
    // Model identifier
    model: "gpt-4.1-mini",
    
    // Optional: API key (recommended to use environment variable)
    apiKey: process.env.OPENAI_API_KEY,
    
    // Optional: Custom base URL (for proxies or custom endpoints)
    baseURL: "https://api.openai.com/v1",
    
    // Optional: Request timeout in milliseconds
    // Default: 30000 (30 seconds)
    timeout: 30000,
    
    // Optional: Maximum retries for failed requests
    // Default: 3
    maxRetries: 3,
  },
};
```

---

## Configuration Options

### `schemaFiles`

**Type:** `string[]`  
**Required:** Yes

Array of paths to schema JSON files. Supports glob patterns.

**Examples:**

```javascript
// Single file
schemaFiles: ["./i18n/schema.json"]

// Multiple files
schemaFiles: [
  "./i18n/common.json",
  "./i18n/auth.json",
  "./i18n/dashboard.json"
]

// Glob pattern
schemaFiles: ["./i18n/**/*.json"]
```

### `outputDir`

**Type:** `string`  
**Required:** Yes

Directory where translation files will be generated. One JSON file per language.

**Examples:**

```javascript
// Standard location
outputDir: "./i18n/locales"

// Public directory (for web apps)
outputDir: "./public/locales"

// Source directory (for bundling)
outputDir: "./src/locales"
```

### `sourceLanguage`

**Type:** `string`  
**Required:** Yes

ISO 639-1 language code for the source language used in schema files.

**Common codes:**
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `pt` - Portuguese
- `ja` - Japanese
- `zh` - Chinese

**Regional variants:**
- `en-US` - American English
- `en-GB` - British English
- `pt-BR` - Brazilian Portuguese
- `zh-CN` - Simplified Chinese
- `zh-TW` - Traditional Chinese

### `statePath`

**Type:** `string`  
**Optional:** Yes  
**Default:** `".i18n-llm-state.json"`

Path to state file that tracks translation hashes for caching.

**Note:** This file should be in `.gitignore` as it's generated automatically.

### `historyPath`

**Type:** `string`  
**Optional:** Yes  
**Default:** `".i18n-history.json"`

Path to history file that tracks token usage and costs.

**Note:** You may want to commit this file to track costs over time.

### `providerConfig`

**Type:** `object`  
**Required:** Yes

Configuration for the LLM provider.

#### `providerConfig.provider`

**Type:** `"openai" | "gemini"`  
**Required:** Yes

LLM provider to use.

**Options:**
- `"openai"` - OpenAI (GPT models)
- `"gemini"` - Google Gemini

#### `providerConfig.model`

**Type:** `string`  
**Required:** Yes

Model identifier for the chosen provider.

**OpenAI models:**
- `gpt-4o` - Most capable, highest cost
- `gpt-4-turbo` - Fast and capable
- `gpt-4.1-mini` - Cost-effective, good quality
- `gpt-3.5-turbo` - Fastest, lowest cost

**Gemini models:**
- `gemini-1.5-pro` - Most capable
- `gemini-1.5-flash` - Fast and cost-effective
- `gemini-2.5-flash` - Latest, best value

#### `providerConfig.apiKey`

**Type:** `string`  
**Optional:** Yes (recommended to use environment variable)

API key for the provider. **Best practice:** Load from environment variable.

**Examples:**

```javascript
// From environment variable (recommended)
apiKey: process.env.OPENAI_API_KEY

// Hardcoded (not recommended for production)
apiKey: "sk-..."
```

#### `providerConfig.baseURL`

**Type:** `string`  
**Optional:** Yes

Custom base URL for API requests. Useful for:
- Proxies
- Custom endpoints
- Self-hosted models

**Examples:**

```javascript
// OpenAI proxy
baseURL: "https://my-proxy.com/v1"

// Azure OpenAI
baseURL: "https://my-resource.openai.azure.com"

// Local development
baseURL: "http://localhost:8080/v1"
```

#### `providerConfig.timeout`

**Type:** `number`  
**Optional:** Yes  
**Default:** `30000` (30 seconds)

Request timeout in milliseconds.

**Examples:**

```javascript
// Longer timeout for large batches
timeout: 60000  // 60 seconds

// Shorter timeout for fast models
timeout: 15000  // 15 seconds
```

#### `providerConfig.maxRetries`

**Type:** `number`  
**Optional:** Yes  
**Default:** `3`

Maximum number of retries for failed requests.

---

## Provider-Specific Configuration

### OpenAI

```javascript
export default {
  providerConfig: {
    provider: "openai",
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY,
    
    // Optional: Organization ID
    organization: "org-...",
    
    // Optional: Custom headers
    defaultHeaders: {
      "Custom-Header": "value"
    },
  },
};
```

**Getting an API key:**
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Set environment variable: `export OPENAI_API_KEY="sk-..."`

### Gemini

```javascript
export default {
  providerConfig: {
    provider: "gemini",
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
  },
};
```

**Getting an API key:**
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Set environment variable: `export GEMINI_API_KEY="..."`

---

## Environment Variables

### Recommended Setup

Create a `.env` file (add to `.gitignore`):

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Gemini
GEMINI_API_KEY=...

# Optional: Custom endpoints
OPENAI_BASE_URL=https://api.openai.com/v1
```

Load in configuration:

```javascript
import dotenv from 'dotenv';
dotenv.config();

export default {
  providerConfig: {
    provider: "openai",
    model: "gpt-4.1-mini",
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  },
};
```

### CI/CD Environment Variables

Set in your CI/CD platform:

**GitHub Actions:**
```yaml
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**GitLab CI:**
```yaml
variables:
  OPENAI_API_KEY: $OPENAI_API_KEY
```

**Vercel:**
```bash
vercel env add OPENAI_API_KEY
```

---

## Configuration Presets

### Development

```javascript
export default {
  schemaFiles: ["./i18n/schema.json"],
  outputDir: "./i18n/locales",
  sourceLanguage: "en",
  providerConfig: {
    provider: "gemini",
    model: "gemini-2.5-flash",  // Cheapest for testing
    timeout: 15000,
  },
};
```

### Production

```javascript
export default {
  schemaFiles: ["./i18n/**/*.json"],
  outputDir: "./dist/locales",
  sourceLanguage: "en",
  providerConfig: {
    provider: "openai",
    model: "gpt-4.1-mini",  // Good balance
    timeout: 30000,
    maxRetries: 5,
  },
};
```

### High Quality

```javascript
export default {
  schemaFiles: ["./i18n/schema.json"],
  outputDir: "./locales",
  sourceLanguage: "en",
  providerConfig: {
    provider: "openai",
    model: "gpt-4o",  // Best quality
    timeout: 60000,
  },
};
```

### Budget Conscious

```javascript
export default {
  schemaFiles: ["./i18n/schema.json"],
  outputDir: "./locales",
  sourceLanguage: "en",
  providerConfig: {
    provider: "gemini",
    model: "gemini-2.5-flash",  // Most cost-effective
    timeout: 30000,
  },
};
```

---

## Multiple Configurations

Use different configs for different environments:

```javascript
// i18n-llm.config.dev.js
export default {
  providerConfig: {
    provider: "gemini",
    model: "gemini-2.5-flash",
  },
};

// i18n-llm.config.prod.js
export default {
  providerConfig: {
    provider: "openai",
    model: "gpt-4.1-mini",
  },
};
```

Use with:

```bash
npx i18n-llm generate --config i18n-llm.config.dev.js
npx i18n-llm generate --config i18n-llm.config.prod.js
```

---

## Validation

i18n-llm validates configuration on load. Common errors:

### Missing Required Fields

```
Error: Configuration validation failed: schemaFiles is required
```

**Fix:** Add required field to config.

### Invalid Provider

```
Error: Unknown provider: invalid-provider
```

**Fix:** Use `"openai"` or `"gemini"`.

### Schema File Not Found

```
Error: Schema file not found: ./i18n/schema.json
```

**Fix:** Ensure file exists at specified path.

### Invalid Language Code

```
Error: Invalid language code: invalid
```

**Fix:** Use valid ISO 639-1 code (e.g., `"en"`, `"es"`).

---

## Best Practices

### ✅ Do

- Use environment variables for API keys
- Commit configuration file to version control
- Add state file to `.gitignore`
- Use descriptive schema file names
- Set reasonable timeouts
- Choose appropriate model for your needs

### ❌ Don't

- Hardcode API keys in config
- Commit state file to git
- Use overly long timeouts
- Mix source languages in same config
- Ignore cost implications of model choice

---

## Troubleshooting

### Config file not found

**Error:** `Configuration file not found: i18n-llm.config.js`

**Solutions:**
1. Create config file in project root
2. Specify path: `--config path/to/config.js`
3. Check file name spelling

### API key not loaded

**Error:** `API key not found`

**Solutions:**
1. Set environment variable: `export OPENAI_API_KEY="..."`
2. Check variable name matches config
3. Reload terminal/shell after setting

### Invalid JSON in schema

**Error:** `Failed to parse schema: Unexpected token`

**Solutions:**
1. Validate JSON syntax
2. Use JSON linter
3. Check for trailing commas

---

## Next Steps

- [Schema Guide](./SCHEMA_GUIDE.md) - Learn to write effective schemas
- [Commands Reference](./COMMANDS.md) - All available commands
- [CI/CD Integration](./CICD.md) - Automate translations

