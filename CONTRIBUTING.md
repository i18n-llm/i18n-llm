# Contributing to i18n-llm

Thank you for considering contributing to i18n-llm! We welcome contributions from everyone.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** - Describe the issue concisely
- **Steps to reproduce** - Detailed steps to reproduce the behavior
- **Expected behavior** - What you expected to happen
- **Actual behavior** - What actually happened
- **Environment** - OS, Node version, i18n-llm version
- **Logs** - Include relevant error messages or logs

**Example:**

```markdown
## Bug: Batch translation fails with Gemini provider

**Steps to reproduce:**
1. Configure Gemini provider in config
2. Run `npx i18n-llm generate`
3. Error occurs after processing 5 keys

**Expected:** All translations complete successfully
**Actual:** Error: "API rate limit exceeded"

**Environment:**
- OS: macOS 14.0
- Node: 20.10.0
- i18n-llm: 1.0.0

**Logs:**
```
[error details here]
```
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title** - Describe the enhancement
- **Use case** - Explain why this would be useful
- **Proposed solution** - How you envision it working
- **Alternatives** - Other solutions you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** if applicable
4. **Update documentation** if needed
5. **Ensure tests pass** - Run `npm test`
6. **Submit a pull request**

#### Pull Request Guidelines

- **One feature per PR** - Keep PRs focused
- **Write clear commit messages** - Follow conventional commits
- **Update CHANGELOG** - Add entry for your changes
- **Link related issues** - Reference issue numbers

**Commit Message Format:**

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(providers): add Anthropic Claude support

Implements Claude provider with streaming support.
Includes tests and documentation.

Closes #123
```

```
fix(generate): handle empty schema gracefully

Previously crashed when schema had no entities.
Now shows helpful error message.

Fixes #456
```

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Setup Steps

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/i18n-llm.git
cd i18n-llm

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Run tests
npm test

# 5. Create a branch
git checkout -b feat/my-feature
```

### Project Structure

```
i18n-llm/
├── src/
│   ├── cli.ts              # CLI entry point
│   ├── commands/           # Command implementations
│   │   ├── generate.ts
│   │   ├── i18n.usage.ts
│   │   ├── i18n.report.ts
│   │   └── i18n.costs.ts
│   ├── core/               # Core functionality
│   │   ├── config-loader.ts
│   │   ├── schema-parser.ts
│   │   ├── state-manager.ts
│   │   ├── history-tracker.ts
│   │   ├── pricing.ts
│   │   └── llm/
│   │       ├── llm-provider.ts
│   │       └── providers/
│   │           ├── openai.ts
│   │           └── gemini.ts
│   └── utils/              # Utility functions
├── dist/                   # Compiled output
├── docs/                   # Documentation
├── test/                   # Test files
└── package.json
```

### Development Workflow

#### 1. Watch Mode

For active development:

```bash
npm run build:watch
```

#### 2. Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run with coverage:

```bash
npm run test:coverage
```

#### 3. Linting

```bash
npm run lint
```

#### 4. Type Checking

```bash
npm run type-check
```

### Testing Guidelines

- **Write tests for new features** - Aim for >80% coverage
- **Test edge cases** - Empty inputs, large datasets, errors
- **Use descriptive test names** - Clearly describe what's being tested
- **Mock external dependencies** - Don't make real API calls in tests

**Example Test:**

```typescript
import { describe, it, expect } from 'vitest';
import { parseSchema } from '../src/core/schema-parser';

describe('schema-parser', () => {
  describe('parseSchema', () => {
    it('should parse valid schema correctly', () => {
      const schema = {
        targetLanguages: ['es', 'fr'],
        entities: {
          common: {
            hello: {
              sourceText: 'Hello',
              context: 'Greeting'
            }
          }
        }
      };

      const result = parseSchema(schema, 'en');
      
      expect(result.keys).toHaveLength(1);
      expect(result.keys[0].description).toBe('Hello');
    });

    it('should throw error for invalid schema', () => {
      const invalidSchema = { /* missing required fields */ };
      
      expect(() => parseSchema(invalidSchema, 'en')).toThrow();
    });
  });
});
```

## Adding a New LLM Provider

Want to add support for a new LLM provider? Here's how:

### 1. Create Provider File

Create `src/core/llm/providers/your-provider.ts`:

```typescript
import { LLMProvider, TranslationParams, TokenUsage, PluralizedTranslation, BatchTranslationResult } from '../llm-provider.js';

export interface YourProviderConfig {
  apiKey?: string;
  model: string;
  baseURL?: string;
  timeout?: number;
}

export class YourProvider implements LLMProvider {
  private config: YourProviderConfig;

  constructor(config: YourProviderConfig) {
    this.config = config;
  }

  async translate(params: TranslationParams): Promise<{ text: string | PluralizedTranslation; usage?: TokenUsage }> {
    // Implementation
  }

  async translateBatch(items: TranslationParams[]): Promise<BatchTranslationResult> {
    // Implementation
  }
}
```

### 2. Register Provider

Add to `src/core/llm/llm-provider.ts`:

```typescript
export function createProvider(config: ProviderConfig): LLMProvider {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'your-provider':  // Add here
      return new YourProvider(config);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}
```

### 3. Add Pricing

Add to `src/core/pricing.ts`:

```typescript
export const PRICING: PricingTable = {
  // ... existing providers
  'your-provider': {
    'model-name': {
      input: 0.0001,
      output: 0.0003,
    },
  },
};
```

### 4. Add Tests

Create `src/core/llm/providers/your-provider.test.ts`

### 5. Update Documentation

- Add provider to README.md
- Document configuration options
- Add usage examples

## Documentation

### Writing Documentation

- **Use clear language** - Avoid jargon when possible
- **Provide examples** - Show, don't just tell
- **Keep it updated** - Update docs when code changes
- **Test examples** - Ensure code examples actually work

### Documentation Structure

- **README.md** - Project overview and quick start
- **QUICK_START.md** - Step-by-step tutorial
- **docs/** - Detailed guides and references

## Code Style

### TypeScript Guidelines

- **Use TypeScript** - No plain JavaScript
- **Strict mode** - Enable all strict checks
- **Type everything** - Avoid `any` unless absolutely necessary
- **Use interfaces** - For public APIs and contracts
- **Document public APIs** - Use JSDoc comments

**Example:**

```typescript
/**
 * Translates a single text using the configured LLM provider.
 * 
 * @param params - Translation parameters including source text and context
 * @returns Promise resolving to translated text and token usage
 * @throws {TranslationError} If translation fails
 * 
 * @example
 * ```typescript
 * const result = await provider.translate({
 *   sourceText: 'Hello',
 *   targetLanguage: 'es',
 *   context: 'Greeting message'
 * });
 * console.log(result.text); // "Hola"
 * ```
 */
async translate(params: TranslationParams): Promise<TranslationResult> {
  // Implementation
}
```

### Naming Conventions

- **Files:** `kebab-case.ts`
- **Classes:** `PascalCase`
- **Functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Interfaces:** `PascalCase` (no `I` prefix)

### Error Handling

- **Use custom error classes** - Extend `Error`
- **Provide context** - Include relevant details
- **Handle errors gracefully** - Don't crash unexpectedly

**Example:**

```typescript
export class TranslationError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

// Usage
throw new TranslationError(
  'Failed to translate text',
  'openai',
  originalError
);
```

## Release Process

Releases are managed by maintainers. The process:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag
4. Push to GitHub
5. Publish to npm

## Getting Help

- **Documentation:** Check README and docs/
- **Issues:** Search existing issues
- **Discussions:** Use GitHub Discussions for questions
- **Discord:** Join our community (link in README)

## Recognition

Contributors are recognized in:
- CHANGELOG.md for each release
- README.md contributors section
- GitHub contributors page

Thank you for contributing! 🎉

