# LLM Providers Guide

`i18n-llm` is designed to be flexible, allowing you to choose the Large Language Model (LLM) that best suits your translation, quality, and cost needs. This flexibility is achieved through a system of "providers."

A provider is an adapter that connects `i18n-llm` to a specific LLM service, such as OpenAI or Google Gemini. It is responsible for formatting requests, sending texts for translation, and interpreting the responses from the LLM API.

This guide details the supported providers and how to configure them.

## Supported Providers

Currently, `i18n-llm` officially supports the following providers:

- **OpenAI:** Accesses models like GPT-4, GPT-4 Turbo, and GPT-3.5 Turbo.
- **Google Gemini:** Accesses models like Gemini 1.5 Flash and Gemini 1.5 Pro.

You can configure which provider and model to use in your `i18n-llm.config.js` file.


## Configuring the OpenAI Provider

The OpenAI provider is a popular choice due to the high translation quality of the GPT models.

### Configuration

To use OpenAI, configure the `providerConfig` section in your `i18n-llm.config.js` as follows:

```javascript
// i18n-llm.config.js
module.exports = {
  // ...other configurations
  providerConfig: {
    provider: 'openai',
    model: 'gpt-4-turbo', // or 'gpt-3.5-turbo', 'gpt-4'
  },
};
```

### Supported Models

| Model           | Quality   | Cost     | Recommended For                                                    |
| :-------------- | :-------- | :------- | :----------------------------------------------------------------- |
| `gpt-4-turbo`   | Excellent | Moderate | Most use cases, good balance between quality and cost.             |
| `gpt-4`         | The best  | High     | Projects that require the highest accuracy and context.            |
| `gpt-3.5-turbo` | Good      | Low      | Projects with a limited budget or less critical translations.      |

### API Key

The OpenAI provider requires an API key, which must be set as an environment variable named `OPENAI_API_KEY`.

```bash
export OPENAI_API_KEY="sk-YourSecretApiKey"
```

In a CI/CD environment like GitHub Actions, configure this as a [repository secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets).


## Configuring the Google Gemini Provider

Google Gemini is a powerful alternative, offering fast and cost-effective models, ideal for large volumes of translation.

### Configuration

To use Gemini, configure the `providerConfig` section as follows:

```javascript
// i18n-llm.config.js
module.exports = {
  // ...other configurations
  providerConfig: {
    provider: 'gemini',
    model: 'gemini-1.5-flash', // or 'gemini-1.5-pro'
  },
};
```

### Supported Models

| Model | Speed | Cost | Recommended For |
| :--- | :--- | :--- | :--- |
| `gemini-1.5-flash` | Very Fast | Very Low | Ideal for bulk translation tasks and CI/CD environments where speed is critical. |
| `gemini-1.5-pro` | Fast | Low | Cases that require greater context understanding while maintaining an affordable cost. |

### API Key

The Gemini provider requires an API key, which must be set as an environment variable named `GEMINI_API_KEY`.

```bash
export GEMINI_API_KEY="YourSecretApiKey"
```

As with OpenAI, in a CI/CD environment, configure this as a [repository secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets).


## How to Choose a Provider

The choice between OpenAI and Gemini (or between their respective models) depends on your project's priorities:

- **For the highest translation quality**, especially for complex and creative texts, **GPT-4** is generally the best option, although at a higher cost.

- **For an excellent balance between quality and cost**, **GPT-4 Turbo** or **Gemini 1.5 Pro** are solid choices.

- **For maximum speed and minimum cost**, ideal for large volumes of text or for frequent execution in CI/CD, **Gemini 1.5 Flash** is the recommended choice.

We recommend experimenting with different models with a sample of your content to see which one offers the best result for your specific use case.

## Extensibility: Creating Your Own Provider

`i18n-llm` was designed with extensibility in mind. If you want to use an LLM that is not officially supported (such as Anthropic Claude, Llama, or a self-hosted model), you can create your own provider.

To do this, you will need to implement the `LLMProvider` interface from `i18n-llm`. This is an advanced task that requires knowledge of TypeScript and the API of the LLM you want to integrate.

### Steps to Create a Provider

1.  **Create a Class:** Create a new TypeScript class that implements the `LLMProvider` interface.

2.  **Implement the Methods:**
    - `translate`: For simple text translations.
    - `translatePlural`: To handle pluralization rules.
    - `translateBatch`: To translate multiple texts in a single API call (highly recommended for efficiency).

3.  **Register the Provider:** Use the `ProviderFactory` to register your new provider with a unique name.

4.  **Use in Config:** Configure your `i18n-llm.config.js` to use the name of your custom provider.

For a detailed example, see the source code of the existing providers (`OpenAIProvider` and `GeminiProvider`) in the `i18n-llm` repository.

