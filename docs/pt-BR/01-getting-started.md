# Guia de Início com o i18n-llm

Bem-vindo ao guia do `i18n-llm`. Nossa missão é ajudá-lo a criar experiências globais, trazendo a língua materna de cada usuário para dentro da sua aplicação, sem esforço.

Este guia irá orientá-lo na instalação da CLI e na configuração do seu projeto para traduções automatizadas.

## 1. Instalação

Primeiro, adicione a CLI do `i18n-llm` ao seu projeto como uma dependência de desenvolvimento.

```bash
npm install --save-dev i18n-llm
```

## 2. Inicialização do Projeto

O comando `init` é a maneira mais fácil de começar. Na raiz do seu projeto, execute:

```bash
npx i18n-llm init
```

Este comando cria dois arquivos essenciais:

- `i18n-llm.config.js`: O arquivo de configuração principal da CLI.
- `i18n.schema.json`: O coração do seu conteúdo, onde você definirá todos os textos da sua aplicação.

### `i18n-llm.config.js`

Este arquivo informa à CLI como operar.

```javascript
// i18n-llm.config.js
module.exports = {
  // Provedor de LLM a ser usado. Atualmente suporta 'openai'.
  provider: 'openai', 
  
  // Configurações específicas do provedor
  providerConfig: {
    // O modelo a ser usado para as traduções.
    model: 'gpt-4o-mini', 
  },

  // Caminho para o seu schema de definição de textos.
  schemaPath: './i18n.schema.json',

  // Pasta onde os arquivos de tradução serão gerados.
  outputPath: './src/locales',
};
```

### `i18n.schema.json`

É aqui que você define seus textos, fornecendo o contexto necessário para traduções perfeitas.

```json
{
  "sourceLanguage": "pt-BR",
  "targetLanguages": ["en-US", "es-ES"],
  "entities": {
    "userProfile": {
      "_context": "Página de perfil do usuário, onde ele pode editar suas informações.",
      "title": {
        "sourceText": "Meu Perfil"
      },
      "usernameLabel": {
        "sourceText": "Nome de usuário",
        "constraints": {
          "maxLength": 20
        }
      }
    }
  }
}
```

## 3. Configure a Chave de API

A CLI requer uma chave de API para se comunicar com o provedor de LLM. A melhor prática é definir isso como uma variável de ambiente.

Para a OpenAI, exporte a seguinte variável em seu terminal:

```bash
export OPENAI_API_KEY="sk-..."
```

## 4. Gere as Traduções

Depois de adicionar seus textos ao schema, execute o comando `generate`:

```bash
npx i18n-llm generate
```

A CLI irá agora:
1. Ler sua configuração e schema.
2. Encontrar textos novos ou modificados.
3. Chamar o LLM para traduzi-los.
4. Salvar os resultados no seu `outputPath`.

Você verá novos arquivos como `src/locales/en-US.json` e `src/locales/es-ES.json` aparecerem no seu projeto.

## Próximos Passos

- **[Referência do Schema](./02-schema-reference.md)**: Aprofunde-se na estrutura do `i18n.schema.json`.
- **[Uso da CLI](./03-cli-usage.md)**: Aprenda mais sobre os comandos disponíveis.
- **[Configuração do GitHub Action](./04-github-action.md)**: Automatize seu fluxo de trabalho de tradução.
