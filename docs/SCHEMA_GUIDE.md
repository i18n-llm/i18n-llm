# i18n-llm Schema Guide (v2)

The schema file (e.g., `i18n.schema.json`) is the heart of `i18n-llm`. It defines not only the texts to be translated but also the **personality**, **context**, and **constraints** required to generate high-quality, culturally-aware translations. A well-structured schema is the key to unlocking the full power of LLM-based localization.

This guide covers the v2 schema structure, from top-level configuration to the nuances of defining entities and the powerful `persona` object.

## Top-Level Structure

The schema is a JSON object with several root-level properties that define the project's overall configuration.

```json
{
  "version": "2.1",
  "sourceLanguage": "en-US",
  "targetLanguages": [
    "pt-BR",
    "es-ES",
    "fr-FR"
  ],
  "persona": { ... },
  "glossary": { ... },
  "entities": { ... }
}
```

| Key | Type | Description |
| :--- | :--- | :--- |
| `version` | String | The version of the schema format. Helps `i18n-llm` handle potential future migrations. |
| `sourceLanguage` | String | The source language of your texts (e.g., `en-US`). |
| `targetLanguages`| Array | An array of language codes to translate into. |
| `persona` | Object | **(Key Feature)** Defines the AI's personality, tone, and style. |
| `glossary` | Object | A key-value map of terms that must not be translated or must follow a specific translation. |
| `entities` | Object | The main container for all the translatable texts of your application. |


## The `persona` Object: Defining Your Brand's Voice

The `persona` object is a powerful and unique feature of `i18n-llm`. It allows you to define a consistent personality and tone for the AI, ensuring that translations are not just linguistically correct but also aligned with your brand's voice and cultural context.

This goes beyond simple "formal" or "informal" settings. You can instruct the LLM to be witty, professional, humorous, or even a sarcastic pirate captain.

### Structure of the `persona` Object

```json
"persona": {
  "role": "A witty and slightly sarcastic Pirate Captain",
  "tone": [
    "Friendly",
    "Informal",
    "Humorous",
    "Uses pirate slang"
  ],
  "forbidden_tones": [
    "Corporate",
    "Formal",
    "Dry"
  ],
  "audience": "Software developers who enjoy a bit of fun.",
  "examples": [
    {
      "input": "An unexpected error occurred.",
      "output": "Shiver me timbers! We've hit a squall."
    },
    {
      "input": "Submit",
      "output": "Hoist the sails"
    }
  ]
}
```

| Key | Type | Description |
| :--- | :--- | :--- |
| `role` | String | A high-level description of the AI's character. This is the primary instruction for its personality. |
| `tone` | Array | A list of desired tones and stylistic attributes. |
| `forbidden_tones`| Array | A list of tones to avoid, which helps prevent the LLM from defaulting to generic or undesirable styles. |
| `audience` | String | A description of the target audience, which helps the LLM tailor its language and cultural references. |
| `examples` | Array | A list of input/output pairs that provide concrete examples of the desired style. This is extremely effective for fine-tuning the LLM's output. |

### How Persona Impacts Translations

The `persona` object is passed to the LLM with every translation request. This ensures that whether the LLM is translating a simple button label or a complex error message, it does so with the specified personality.

- **Contextual Persona:** The persona is applied within the context of each entity. For example, the pirate persona might be more pronounced in UI text but slightly toned down in formal documentation if guided by entity-level `_context`.
- **Cultural Adaptation:** The LLM uses the persona as a guide but adapts it to the target culture. A "witty" tone in English might be expressed differently in Japanese or French, and the LLM will handle this cultural nuance.



## The `glossary` Object

The `glossary` ensures that specific terms, like brand names, acronyms, or technical terms, are treated consistently. You can specify whether a term should never be translated or should always be translated in a specific way.

```json
"glossary": {
  "CLI": "CLI",
  "API": "API",
  "i18n-llm": "i18n-llm"
}
```

In this example, `CLI` and `API` will be preserved as-is in all languages, preventing the LLM from translating them incorrectly.

## The `entities` Object: Your Application's Texts

The `entities` object is the core of your schema, containing all the translatable content of your application. It is a collection of logical groups, where each group represents a feature, component, or page.

### Entity Group Structure

Each key within `entities` is a group. You can provide a shared context for all keys within that group using the special `_context` key.

```json
"entities": {
  "user_info": {
    "_context": "A form with user information fields. I like it with some labels well described, and not only a single word. Try to do questions instead of labels when possible.",
    "name": { ... },
    "email": { ... }
  },
  "dashboard": {
    "_context": "The main screen a user sees after logging in.",
    "welcomeMessage": { ... }
  }
}
```

The `_context` provides powerful, group-level instructions to the LLM, complementing the global `persona`.

### Translatable Key Structure

Each translatable text is an object with several properties that provide detailed instructions to the LLM.

```json
"name": {
  "description": "The user's full name.",
  "constraints": {
    "maxLength": 255
  },
  "category": "form_label"
}
```

| Key | Type | Description |
| :--- | :--- | :--- |
| `description` | String | **(Highly Recommended)** Explains the purpose and location of the text. This is crucial for contextual accuracy. |
| `constraints` | Object | An object defining limits for the translation. `maxLength` is a common constraint to prevent UI overflow. |
| `category` | String | A custom category tag (e.g., `form_label`, `button_label`, `greeting_text`). This helps in organizing and can be used for more advanced processing in the future. |
| `pluralization`| Boolean | Set to `true` if the key involves pluralization. |
| `params` | Object | Defines the dynamic parameters used in the text for interpolation. |



## Pluralization

`i18n-llm` handles pluralization with a streamlined approach. Instead of defining each plural form (like `one`, `other`) in the source schema, you simply flag a key as requiring pluralization. The LLM is then instructed to generate the appropriate forms for the target language based on a count parameter.

### How to Define Pluralization

To enable pluralization for a key, set `pluralization` to `true` and define the counting parameter in the `params` object.

**Example:**

```json
"welcomeMessage": {
  "description": "A welcome message that tells the user how many new messages they have. The number of new messages is a parameter.",
  "pluralization": true,
  "params": {
    "count": {
      "type": "number",
      "description": "The number of new messages.",
      "example": 5
    }
  },
  "category": "greeting_text"
}
```

### Generated Output

When `i18n-llm` processes this key, it will instruct the LLM to generate a pluralization structure in the output JSON files. The standard structure uses keys like `=0`, `=1`, and `>1` to handle zero, singular, and plural cases, respectively.

**Example Output (`pt-BR.json` with the Pirate persona):**

```json
{
  "dashboard": {
    "welcomeMessage": {
      "=0": "Você não tem novas mensagens, marujo!",
      "=1": "Você tem 1 nova mensagem, capitão!",
      ">1": "Você tem {count} novas mensagens, marujo!"
    }
  }
}
```

This approach simplifies the source schema while leveraging the LLM's linguistic capabilities to handle the specific pluralization rules of each target language automatically.

