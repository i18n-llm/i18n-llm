# Automatizando com GitHub Actions

Para aproveitar ao máximo o poder do `i18n-llm`, você pode automatizar o processo de tradução dentro do seu pipeline de CI/CD. Isso garante que seus arquivos de tradução estejam sempre atualizados a cada mudança no código.

Planejamos lançar uma GitHub Action oficial em breve. Enquanto isso, você pode facilmente configurar um workflow por conta própria.

## Exemplo de Workflow

Crie um arquivo chamado `.github/workflows/translate.yml` em seu repositório.

```yaml
name: 'Gerar Traduções i18n'

on:
  push:
    branches:
      - main # Ou sua branch padrão
  pull_request:
    paths:
      - 'i18n.schema.json' # Executar apenas quando o arquivo de schema mudar

jobs:
  translate:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout do código
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Instalar dependências
        run: npm install

      - name: Gerar traduções
        run: npx i18n-llm generate
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - name: Commitar arquivos de tradução
        run: |
          git config --global user.name 'github-actions[bot]'
          git config --global user.email 'github-actions[bot]@users.noreply.github.com'
          git add .
          git diff --staged --quiet || git commit -m "chore: atualiza traduções i18n"
          git push
```

## Como Funciona

1.  **Gatilho:** O workflow é executado a cada push para a `main` ou quando um pull request modifica o arquivo `i18n.schema.json`.
2.  **Configuração:** Ele faz o checkout do seu código e configura um ambiente Node.js.
3.  **Geração:** Ele executa o comando `i18n-llm generate`. A `OPENAI_API_KEY` é passada de forma segura a partir dos secrets do seu repositório.
4.  **Commit:** Se o comando `generate` criou ou modificou algum arquivo, o workflow os commita de volta para a sua branch com uma mensagem padronizada.

## Configuração Necessária

1.  **Adicione o Arquivo de Workflow:** Crie o arquivo `.github/workflows/translate.yml` no seu projeto.
2.  **Adicione o Secret:** No seu repositório GitHub, vá para `Settings` > `Secrets and variables` > `Actions`. Crie um novo "repository secret" chamado `OPENAI_API_KEY` e cole sua chave de API lá.
