 # Continuous Integration (CI/CD) Guide

Automating your internationalization (i18n) workflow is one of the most powerful features of `i18n-llm`. By integrating it into your CI/CD pipeline, you can ensure that your translations are always in sync with your source code, without manual effort.

This guide focuses on integration with **GitHub Actions**, but the principles can be applied to other CI/CD platforms like GitLab CI, CircleCI, or Jenkins.

## Why Automate i18n?

- **Consistency:** Ensures that translation files always reflect the latest version of the schema.
- **Efficiency:** Eliminates the need for developers to run the `generate` command manually.
- **Agility:** New translations are generated and committed automatically as soon as new texts are added to the schema.
- **Error Prevention:** Prevents untranslated texts from reaching production.


## Prerequisites

Before setting up your CI/CD workflow, ensure that your project meets the following requirements:

1.  **`i18n-llm` as a Development Dependency:**
    `i18n-llm` must be a development dependency in your `package.json`.

    ```bash
    npm install i18n-llm --save-dev
    ```

2.  **Committed Configuration and Schema Files:**
    - `i18n-llm.config.js`: The main configuration file.
    - `i18n.schema.json` (or your schema file): The schema with the source texts.

    These files must be in your Git repository so that the CI/CD pipeline can access them.

## Configuring API Keys on GitHub

For `i18n-llm` to authenticate with LLM providers (like OpenAI or Gemini), it needs an API key. **Never store API keys directly in your code or configuration files.**

The correct way to handle this in GitHub Actions is to use **Secrets**.

### Step-by-Step to Add a Secret

1.  Navigate to your repository on GitHub and go to **Settings** > **Secrets and variables** > **Actions**.
2.  Click on **New repository secret**.
3.  Create a secret for your provider's API key. The secret's name must match the environment variable that `i18n-llm` expects.

    -   For **OpenAI**, the secret name must be `OPENAI_API_KEY`.
    -   For **Gemini**, the name must be `GEMINI_API_KEY`.

4.  Paste your API key into the **Value** field and save the secret.

Now, your GitHub Actions workflow will be able to use this secret securely.


## Creating the GitHub Actions Workflow

Now, let's create a workflow file that automates the execution of `i18n-llm`.

1.  Create a `.github/workflows` directory in the root of your project if it doesn't already exist.
2.  Inside this directory, create a new file named `i18n.yml`.

Copy the following content into the `i18n.yml` file:

```yaml
name: 'Automated i18n Translations'

on:
  push:
    branches:
      - main # or your project's main branch

jobs:
  translate:
    runs-on: ubuntu-latest

    steps:
      - name: 'Checkout repository'
        uses: actions/checkout@v3

      - name: 'Set up Node.js'
        uses: actions/setup-node@v3
        with:
          node-version: '18' # Use a compatible Node.js version
          cache: 'npm'

      - name: 'Install dependencies'
        run: npm install

      - name: 'Generate translations'
        run: npx i18n-llm generate
        env:
          # Maps the GitHub Secret to the environment variable
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          # Uncomment the line below if you are using Gemini
          # GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}

      - name: 'Commit and push changes'
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add .
          # Checks if there are changes to commit
          if ! git diff --staged --quiet; then
            git commit -m 'chore: update i18n translations'
            git push
          else
            echo 'No translation changes to commit.'
          fi
```


### Understanding the Workflow

- **`on: push: branches: [main]`**
  This trigger starts the workflow whenever there is a push to the `main` branch. You can adjust this for other branches, like `develop`, or to be triggered on pull requests.

- **`actions/checkout@v3`**
  Checks out your code so the job can access it.

- **`actions/setup-node@v3`**
  Sets up the Node.js environment. The `cache: 'npm'` option speeds up the dependency installation process in future runs.

- **`npm install`**
  Installs the project's dependencies, including `i18n-llm`.

- **`npx i18n-llm generate`**
  This is the main step. It runs the `generate` command, which detects changes in the schema and generates the necessary translations. The `env` section maps the GitHub secret to the environment variable that `i18n-llm` uses for authentication.

- **`Commit and push changes`**
  This crucial step commits the newly generated translation files back to your repository. It checks for changes before attempting a commit, avoiding empty commits. The commit is made on behalf of the `github-actions` bot.

## Best Practices and Variations

### Running on Pull Requests

To ensure that translations are generated before merging, you can trigger the workflow on pull requests.

```yaml
on:
  pull_request:
    branches:
      - main
```

In this scenario, the workflow can generate the translations and push them to the pull request's branch, keeping it up to date.

### Controlling Costs

Running `i18n-llm` on every push can generate costs with the LLM API. To control this, consider the following strategies:

- **Manual Execution:** Add a `workflow_dispatch` trigger to run the workflow manually from the GitHub Actions interface when needed.

  ```yaml
  on:
    push:
      branches:
        - main
    workflow_dispatch:
  ```

- **Scheduled Execution:** Use a `schedule` trigger to run the workflow at a fixed interval (e.g., once a day).

  ```yaml
  on:
    schedule:
      - cron: '0 8 * * 1-5' # Runs at 8 AM, Monday to Friday
  ```

### Multiple Schema Files

If you use multiple schema files, `i18n-llm` will process them all at once, as defined in your `i18n-llm.config.js`. The workflow does not need any changes to support this.

### Ignoring the Workflow

If you make a commit that should not trigger the translation workflow (e.g., a documentation update), include `[skip ci]` in your commit message.

