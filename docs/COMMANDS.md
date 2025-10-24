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

The `generate` command is the core of `i18n-llm`. It orchestrates the entire translation process, from reading the schema and persona to generating the final, localized JSON files.

```bash
i18n-llm generate [options]
```

### Workflow

The command executes the following steps:

1.  **Load Configuration:** Reads and validates `i18n-llm.config.js` and all schema files.
2.  **State Cleanup:** Removes keys from the state file (`.i18n-llm-state.json`) that no longer exist in the schema.
3.  **Change Detection:** Compares the current schema (including persona, glossary, and descriptions) with the saved state to identify new or modified texts. It uses hashing to efficiently detect any changes.
4.  **Batch Translation:** Sends all new or modified texts in batches to the configured LLM provider (e.g., OpenAI, Gemini), including the full `persona` and `glossary` context.
5.  **Generate Output Files:** Creates or updates the JSON translation files in the output directory, one for each target language.
6.  **Track Costs:** Records token usage and associated costs for the generation in the history file (`.i18n-history.json`).

### Options

| Option    | Description                                                               |
| :-------- | :------------------------------------------------------------------------ |
| `--force` | Forces the regeneration of all keys, ignoring the state cache. Useful when changing the `persona`. |
| `--debug` | Enables detailed debug logging for troubleshooting.                       |
| `--help`  | Displays help for the command.                                            |

### Usage Examples

**Standard Execution:**

```bash
# Generates or updates translations based on detected changes
i18n-llm generate
```

**Force a Full Regeneration:**

This is recommended after making significant changes to the `persona` to ensure all texts adopt the new style.

```bash
# Ignores the cache and translates all keys again
i18n-llm generate --force
```


## Cost and Usage Analysis Commands

`i18n-llm` provides commands to help you monitor and estimate costs associated with LLM usage.

### `i18n.costs`

Analyzes the cost history from all past generations and provides a detailed report, grouped by language, date, and provider/model.

```bash
i18n-llm i18n.costs [options]
```

#### Options

| Option | Description |
| :--- | :--- |
| `--history <path>` | Path to the history file (defaults to `historyPath` in your config). |
| `--format <format>` | Output format: `text` (default) or `json`. |
| `--help` | Displays help for the command. |

#### Usage Examples

**Default Text Report:**

```bash
i18n-llm i18n.costs
```

**JSON Output for programmatic use:**

```bash
i18n-llm i18n.costs --format json
```

### `i18n.usage`

Calculates the token and word count of your i18n schema. This is useful for estimating costs *before* running the `generate` command.

```bash
i18n-llm i18n.usage [options]
```

#### Options

| Option | Description |
| :--- | :--- |
| `--schema <path>` | Path to the schema file (defaults to `schemaFiles` in your config). |
| `--format <format>` | Output format: `text` (default) or `json`. |
| `--help` | Displays help for the command. |

