# Advanced Usage Examples

This section provides practical, real-world examples of how to use `i18n-llm`'s v2 schema to its full potential. These examples demonstrate how to leverage the `persona` object, structure complex schemas, and handle different tones and contexts.


## Example 1: The Pirate Captain Persona

This example showcases the power of the `persona` object to create a unique and consistent voice for your application. We will instruct the LLM to act as a witty, sarcastic pirate captain.

### The Schema (`pirate.schema.json`)

```json
{
  "version": "2.1",
  "sourceLanguage": "en-US",
  "targetLanguages": ["pt-BR", "es-ES"],
  "persona": {
    "role": "A witty and slightly sarcastic Pirate Captain",
    "tone": ["Humorous", "Informal", "Uses pirate slang"],
    "forbidden_tones": ["Corporate", "Formal"],
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
  },
  "entities": {
    "dashboard": {
      "_context": "The main screen a user sees after logging in.",
      "welcomeMessage": {
        "description": "A welcome message telling the user how many new messages they have.",
        "pluralization": true,
        "params": {
          "count": { "type": "number" }
        }
      },
      "docsButton": {
        "description": "A button that links to the technical documentation.",
        "constraints": { "maxLength": 25 }
      }
    }
  }
}
```

### Analysis

- **`persona.role`**: This is the core instruction. The LLM will adopt the entire personality of a pirate captain, not just translate words.
- **`persona.examples`**: These provide concrete, before-and-after examples that are crucial for teaching the LLM the desired style. The `Submit` -> `Hoist the sails` example is particularly effective.
- **`pluralization`**: The `welcomeMessage` is flagged for pluralization. The LLM will generate the correct plural forms for each target language, infused with the pirate persona.

### Expected Output (`pt-BR.json`)

```json
{
  "dashboard": {
    "welcomeMessage": {
      "=0": "Nenhuma mensagem nova na sua arca, marujo!",
      "=1": "Ahoy! Você tem 1 nova mensagem, capitão!",
      ">1": "Ahoy! Você tem {count} novas mensagens, marujo!"
    },
    "docsButton": "Consultar o Mapa do Tesouro"
  }
}
```

As you can see, the output is not a literal translation. It's a **transcreation** that embodies the pirate persona, providing a much more engaging user experience.


## Example 2: Handling Formal and Informal Tones

Many languages have different levels of formality (e.g., "Sie" vs. "du" in German). The `persona` and `_context` keys can be used to guide the LLM to the correct tone.

### Scenario

We need to generate translations for two different applications:
1.  A professional B2B application requiring a formal tone.
2.  A casual B2C social media app requiring an informal tone.

### Formal Schema (`b2b.schema.json`)

Here, the `persona` is defined as a professional assistant, and the `_context` for the `user_form` reinforces this.

```json
{
  "version": "2.1",
  "sourceLanguage": "en-US",
  "targetLanguages": ["de-DE"],
  "persona": {
    "role": "A helpful and professional business assistant.",
    "tone": ["Formal", "Respectful", "Clear"],
    "forbidden_tones": ["Casual", "Humorous", "Sarcastic"]
  },
  "entities": {
    "user_form": {
      "_context": "A registration form for new enterprise clients. Please use formal language.",
      "name": {
        "description": "The user's full name."
      }
    }
  }
}
```

### Informal Schema (`b2c.schema.json`)

In this version, the persona is a friendly social media guide.

```json
{
  "version": "2.1",
  "sourceLanguage": "en-US",
  "targetLanguages": ["de-DE"],
  "persona": {
    "role": "A friendly and encouraging social media guide.",
    "tone": ["Casual", "Friendly", "Informal"],
    "forbidden_tones": ["Formal", "Corporate"]
  },
  "entities": {
    "user_form": {
      "_context": "A sign-up form for a fun social app. Keep it light and friendly.",
      "name": {
        "description": "Your name!"
      }
    }
  }
}
```

### Expected Output (`de-DE.json`)

-   **From `b2b.schema.json`:** The LLM would likely use the formal "Sie" form.
    ```json
    { "user_form": { "name": "Ihr vollständiger Name" } } 
    ```

-   **From `b2c.schema.json`:** The LLM would use the informal "du" form.
    ```json
    { "user_form": { "name": "Dein Name" } }
    ```

This example shows how `persona` and `_context` work together to produce contextually appropriate translations that go beyond literal meaning.

