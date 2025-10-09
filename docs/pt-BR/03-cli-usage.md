# Guia de Uso da CLI

A CLI do `i18n-llm` é sua principal ferramenta para gerenciar as traduções.

## Comandos Globais

### `i18n-llm --help`

Exibe uma lista de todos os comandos disponíveis e suas opções.

### `i18n-llm --version`

Mostra a versão atualmente instalada da CLI.

## Comandos Principais

### `i18n-llm init`

**Ação:** Cria os arquivos de configuração iniciais (`i18n-llm.config.js` e `i18n.schema.json`) no diretório atual.

**Uso:**
Execute este comando uma vez ao configurar o `i18n-llm` em um novo projeto.

```bash
npx i18n-llm init
```

O comando não sobrescreverá arquivos existentes.

### `i18n-llm generate`

**Ação:** Este é o comando principal da ferramenta. Ele lê seu schema, detecta mudanças, chama o LLM para novas traduções e escreve os arquivos de saída.

**Uso:**
Execute este comando sempre que adicionar ou atualizar textos no seu `i18n.schema.json`.

```bash
npx i18n-llm generate
```

**Processo:**
1.  **Carregar Config:** Lê o `i18n-llm.config.js`.
2.  **Carregar Schema:** Lê o `i18n.schema.json`.
3.  **Verificar Estado:** Compara o schema atual com um cache local (`.i18n-llm-state.json`) para encontrar o que é novo.
4.  **Traduzir:** Envia apenas textos novos ou modificados para o provedor de LLM.
5.  **Escrever Arquivos:** Cria ou atualiza os arquivos de tradução (ex: `pt-BR.json`) no seu `outputPath`.
6.  **Atualizar Estado:** Salva o novo estado para não traduzir os mesmos textos novamente.

**Variáveis de Ambiente:**
- `OPENAI_API_KEY`: Deve ser definida para que o comando `generate` funcione com o provedor OpenAI.
