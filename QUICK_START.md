# Quick Start Guide

Get i18n-llm up and running in 5 minutes.

---

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- API key from OpenAI or Google Gemini

---

## Step 1: Install

```bash
npm install -D i18n-llm
```

---

## Step 2: Get an API Key

### Option A: OpenAI

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Set environment variable:

```bash
export OPENAI_API_KEY="sk-..."
```

### Option B: Google Gemini

1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Set environment variable:

```bash
export GEMINI_API_KEY="..."
```

---

## Step 3: Create Configuration

Create `i18n-llm.config.js` in your project root:

```javascript
export default {
  schemaFiles: ["./i18n/schema.json"],
  outputDir: "./i18n/locales",
  sourceLanguage: "en",
  providerConfig: {
    provider: "openai",  // or "gemini"
    model: "gpt-4.1-mini",
  },
};
```

---

## Step 4: Create Schema

Create `i18n/schema.json`:

```json
{
  "targetLanguages": ["es", "fr", "pt-BR"],
  "entities": {
    "common": {
      "hello": {
        "sourceText": "Hello, World!",
        "context": "Standard greeting message"
      },
      "welcome": {
        "sourceText": "Welcome to our app!",
        "context": "Welcome message on home page"
      }
    },
    "user": {
      "name": {
        "sourceText": "Name",
        "context": "Label for name input field",
        "maxLength": 20
      },
      "email": {
        "sourceText": "Email",
        "context": "Label for email input field",
        "maxLength": 30
      }
    }
  }
}
```

---

## Step 5: Estimate Costs (Optional)

Before generating translations, check estimated costs:

```bash
npx i18n-llm i18n.usage
```

Output:
```
📊 Usage Statistics
══════════════════════════════════════════════════
Total Keys:              4
Source Words:            12
Estimated Total Tokens:  48
  (includes all target languages: es, fr, pt-BR)
```

Get cost estimates by provider:

```bash
npx i18n-llm i18n.report
```

Output:
```
💰 Cost Estimates by Provider
══════════════════════════════════════════════════

GEMINI - gemini-2.5-flash
  Input:  $0.000002
  Output: $0.000006
  Total:  $0.000008

OPENAI - gpt-4.1-mini
  Input:  $0.000007
  Output: $0.000023
  Total:  $0.000030
```

---

## Step 6: Generate Translations

```bash
npx i18n-llm generate
```

Output:
```
🚀 Starting translation generation process...

Step 1: Loading configuration...
  ✓ Config loaded from: i18n-llm.config.js

Step 2: Parsing schema...
  ✓ Parsed schema: 4 keys, 3 languages

Step 3: Generating translations...
  ✓ es: 4 translations generated
  ✓ fr: 4 translations generated
  ✓ pt-BR: 4 translations generated

Step 4: Writing output files...
  ✓ Written: i18n/locales/es.json
  ✓ Written: i18n/locales/fr.json
  ✓ Written: i18n/locales/pt-BR.json

💾 Saving generation history...
   📊 es: 4 new, 0 updated, 45 tokens, $0.000011
   📊 fr: 4 new, 0 updated, 47 tokens, $0.000012
   📊 pt-BR: 4 new, 0 updated, 48 tokens, $0.000012

✅ Translation generation completed successfully!
```

---

## Step 7: Check Generated Files

Your translations are now in `i18n/locales/`:

**`i18n/locales/es.json`:**
```json
{
  "common": {
    "hello": "¡Hola, Mundo!",
    "welcome": "¡Bienvenido a nuestra aplicación!"
  },
  "user": {
    "name": "Nombre",
    "email": "Correo electrónico"
  }
}
```

**`i18n/locales/fr.json`:**
```json
{
  "common": {
    "hello": "Bonjour, le monde !",
    "welcome": "Bienvenue dans notre application !"
  },
  "user": {
    "name": "Nom",
    "email": "E-mail"
  }
}
```

**`i18n/locales/pt-BR.json`:**
```json
{
  "common": {
    "hello": "Olá, Mundo!",
    "welcome": "Bem-vindo ao nosso aplicativo!"
  },
  "user": {
    "name": "Nome",
    "email": "E-mail"
  }
}
```

---

## Step 8: Use in Your App

### React Example

```javascript
import en from './i18n/locales/en.json';
import es from './i18n/locales/es.json';
import fr from './i18n/locales/fr.json';

const translations = { en, es, fr };

function App() {
  const [locale, setLocale] = useState('en');
  const t = translations[locale];

  return (
    <div>
      <h1>{t.common.hello}</h1>
      <p>{t.common.welcome}</p>
      <label>{t.user.name}</label>
      <label>{t.user.email}</label>
    </div>
  );
}
```

### Vue Example

```vue
<script setup>
import { ref, computed } from 'vue';
import en from './i18n/locales/en.json';
import es from './i18n/locales/es.json';
import fr from './i18n/locales/fr.json';

const translations = { en, es, fr };
const locale = ref('en');
const t = computed(() => translations[locale.value]);
</script>

<template>
  <div>
    <h1>{{ t.common.hello }}</h1>
    <p>{{ t.common.welcome }}</p>
    <label>{{ t.user.name }}</label>
    <label>{{ t.user.email }}</label>
  </div>
</template>
```

---

## Next Steps

### Add More Translations

Edit `i18n/schema.json` and add new keys:

```json
{
  "entities": {
    "common": {
      "goodbye": {
        "sourceText": "Goodbye!",
        "context": "Farewell message"
      }
    }
  }
}
```

Run `generate` again:

```bash
npx i18n-llm generate
```

**Smart caching** ensures only new keys are translated!

### Update Existing Translations

Change source text in schema:

```json
{
  "common": {
    "hello": {
      "sourceText": "Hello there!",  // Changed
      "context": "Friendly greeting"
    }
  }
}
```

Run `generate`:

```bash
npx i18n-llm generate
```

Only the changed key will be retranslated.

### Force Regeneration

To regenerate all translations (ignoring cache):

```bash
npx i18n-llm generate --force
```

### Add More Languages

Edit `targetLanguages` in schema:

```json
{
  "targetLanguages": ["es", "fr", "pt-BR", "de", "it", "ja"]
}
```

Run `generate` - only new languages will be translated!

---

## Common Patterns

### Parameterized Strings

```json
{
  "greeting": {
    "sourceText": "Hello, {name}!",
    "context": "Personalized greeting",
    "params": {
      "name": "User's first name"
    }
  }
}
```

Usage:
```javascript
const message = t.greeting.replace('{name}', userName);
```

### Pluralization

```json
{
  "items_count": {
    "sourceText": {
      "zero": "No items",
      "one": "One item",
      "other": "{count} items"
    },
    "isPlural": true,
    "context": "Shopping cart counter",
    "params": {
      "count": "Number of items"
    }
  }
}
```

### Character Limits

```json
{
  "button_label": {
    "sourceText": "Submit",
    "context": "Button label on form",
    "maxLength": 10
  }
}
```

The LLM will ensure translations don't exceed 10 characters.

---

## Troubleshooting

### "API key not found"

Make sure environment variable is set:

```bash
# Check if set
echo $OPENAI_API_KEY

# Set it
export OPENAI_API_KEY="sk-..."
```

### "Configuration file not found"

Ensure `i18n-llm.config.js` is in the directory where you run the command, or specify path:

```bash
npx i18n-llm generate --config ./path/to/config.js
```

### "Invalid schema format"

Check your JSON syntax:

```bash
# Validate JSON
cat i18n/schema.json | jq .
```

### Translations seem wrong

1. Add more context in schema
2. Use a better model (e.g., `gpt-4o` instead of `gpt-4.1-mini`)
3. Review and manually edit generated files

---

## Tips

### 💡 Always provide context

Bad:
```json
{
  "name": {
    "sourceText": "Name"
  }
}
```

Good:
```json
{
  "name": {
    "sourceText": "Name",
    "context": "Label for user's full name input field on registration form"
  }
}
```

### 💡 Use maxLength for UI constraints

```json
{
  "button": {
    "sourceText": "Continue",
    "context": "Primary action button",
    "maxLength": 12
  }
}
```

### 💡 Describe parameters

```json
{
  "welcome": {
    "sourceText": "Welcome, {name}! You have {count} messages.",
    "params": {
      "name": "User's first name",
      "count": "Number of unread messages"
    }
  }
}
```

### 💡 Organize with categories

```json
{
  "entities": {
    "auth": { /* login, register, etc */ },
    "dashboard": { /* dashboard-specific */ },
    "settings": { /* settings page */ }
  }
}
```

### 💡 Track costs

Run `i18n.costs` regularly to monitor spending:

```bash
npx i18n-llm i18n.costs
```

---

## What's Next?

- 📖 Read the [full documentation](./README.md)
- 🔧 Learn about [advanced configuration](./docs/CONFIGURATION.md)
- 🎨 Explore [schema best practices](./docs/SCHEMA_GUIDE.md)
- 🚀 Set up [CI/CD integration](./docs/CICD.md)

---

**Need help?** Open an issue on [GitHub](https://github.com/i18n-llm/i18n-llm/issues)

