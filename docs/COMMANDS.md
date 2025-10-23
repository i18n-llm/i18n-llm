# CLI Commands Reference

`i18n-llm` provides a powerful command-line interface (CLI) to automate your internationalization workflow. This page provides a complete reference for all available commands, their options, and usage examples.

## Command Structure

All commands follow the structure:

```bash
i18n-llm [command] [options]
```

You can get help for any command by running:

```bash
i18n-llm [command] --help
```


## `generate`

The `generate` command is the main command of `i18n-llm`. It orchestrates the entire translation process, from reading the schema to generating the final translation files.

```bash
i18n-llm generate [options]
```

### Features

The command performs the following steps:

1.  **Loads Configuration:** Reads and validates the `i18n-llm.config.js` file.
2.  **State Cleanup:** Removes keys from the state file (`.i18n-llm-state.json`) that no longer exist in the schema.
3.  **Change Detection:** Compares the current schema with the saved state to identify new or modified texts. It checks the hash of the source content, description, and other constraints.
4.  **Translation Generation:** Sends the new or modified texts to the configured LLM provider (OpenAI or Gemini) to generate translations in all target languages.
5.  **Output File Generation:** Creates or updates the translation JSON files in the output directory, one for each language.
6.  **Cost Tracking:** Records token usage and associated costs for each generation in the history file (`.i18n-history.json`).

### Options

| Option    | Description                                                               |
| :-------- | :------------------------------------------------------------------------ |
| `--force` | Forces the regeneration of all keys, ignoring the state cache.            |
| `--debug` | Enables detailed debug logging for troubleshooting.                       |
| `--help`  | Displays help for the command.                                            |

### Usage Examples

**Standard Execution:**

```bash
# Generates or updates translations based on detected changes
i18n-llm generate
```

**Force Full Regeneration:**

Useful when you change the global prompt in the configuration file or want to re-translate everything.

```bash
# Ignores the cache and translates all keys again
i18n-llm generate --force
```

**Execution with Debugging:**

Use this option to get a detailed log of what `i18n-llm` is doing, including which keys are being generated and why.

```bash
i18n-llm generate --debug
```


## Cost and Usage Analysis Commands

`i18n-llm` offers a set of commands to help you monitor and control the costs associated with using LLMs for translation. These commands use the history file (`.i18n-history.json`) to provide detailed analyses.

### `i18n.costs`

Analyzes the cost history of all generations and provides a detailed report, grouped by language, date, and provider/model.

```bash
i18n-llm i18n.costs [options]
```

#### Options

| Option | Description |
| :--- | :--- |
| `--history <path>` | Path to the history file (defaults to the one defined in `historyPath` in your config file). |
| `--format <format>` | Output format: `text` (default) or `json`. |
| `--help` | Displays help for the command. |

#### Usage Examples

**Default Text Report:**

```bash
i18n-llm i18n.costs
```

**JSON Output:**

```bash
i18n-llm i18n.costs --format json
```

### `i18n.usage`

Calculates the token and word usage of your i18n schema. This is useful for estimating the cost *before* running the `generate` command.

```bash
i18n-llm i18n.usage [options]
```

#### Options

| Option | Description |
| :--- | :--- |
| `--schema <path>` | Path to the schema file (defaults to the one defined in `schemaPath` in your config file). |
| `--format <format>` | Output format: `text` (default) or `json`. |
| `--help` | Displays help for the command. |

### `i18n.report`

(In development) Will generate a consumption report with cost estimates.

