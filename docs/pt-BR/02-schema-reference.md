# Referência do Schema (`i18n.schema.json`)

O arquivo `i18n.schema.json` é a única fonte da verdade para todo o conteúdo de texto em sua aplicação. Um schema bem estruturado é a chave para traduções de alta qualidade e cientes do contexto.

## Propriedades do Nível Raiz

| Propriedade      | Tipo                | Descrição                                                 | Obrigatório |
|------------------|---------------------|-----------------------------------------------------------|-------------|
| `sourceLanguage` | `string`            | A língua base do seu projeto (ex: "pt-BR").               | Sim         |
| `targetLanguages`| `Array<string>`     | Uma lista de idiomas para os quais traduzir (ex: ["en-US"]). | Sim         |
| `entities`       | `Object`            | Um objeto contendo todos os seus grupos de texto (entidades). | Sim         |

## Entidades

O objeto `entities` agrupa seus textos de forma lógica, geralmente por tela, componente ou funcionalidade. Cada chave em `entities` representa um grupo (ex: `telaLogin`, `comum`).

```json
"entities": {
  "telaLogin": { ... },
  "painelUsuario": { ... }
}
```

### Contexto a Nível de Entidade (`_context`)

Dentro de cada entidade, você pode fornecer uma chave `_context`. Isso dá ao LLM uma compreensão geral de onde os textos são usados, melhorando a qualidade e o tom das traduções.

```json
"telaLogin": {
  "_context": "Esta é a tela de login principal para uma aplicação B2B profissional. O tom deve ser formal e seguro.",
  "mensagemBoasVindas": { ... }
}
```

## Chaves de Texto

Dentro de uma entidade, cada chave representa uma string de texto específica.

| Propriedade     | Tipo      | Descrição                                                                                             | Obrigatório |
|-----------------|-----------|-------------------------------------------------------------------------------------------------------|-------------|
| `sourceText`    | `string`  | O texto original na `sourceLanguage`.                                                                 | Sim         |
| `context`       | `string`  | (Opcional) Contexto específico para esta chave, que sobrescreve ou adiciona ao `_context` da entidade. | Não         |
| `constraints`   | `Object`  | (Opcional) Restrições técnicas para a tradução.                                                       | Não         |
| `pluralization` | `boolean` | (Opcional) Defina como `true` se esta chave exigir regras de pluralização. Padrão é `false`.           | Não         |

### Restrições (`constraints`)

O objeto `constraints` ajuda o LLM a gerar traduções que se encaixam perfeitamente na sua UI.

- `maxLength` (number): O número máximo de caracteres permitido para a string traduzida.

### Exemplo

```json
"telaLogin": {
  "_context": "Tela de login principal.",
  "mensagemBoasVindas": {
    "sourceText": "Bem-vindo de volta, {userName}!",
    "context": "Uma saudação personalizada. A variável {userName} será substituída no código.",
    "constraints": {
      "maxLength": 50
    }
  },
  "itensNoCarrinho": {
    "sourceText": "Você tem um item no carrinho.",
    "context": "O texto fonte é a forma singular. O LLM irá gerar tanto a forma singular quanto a plural.",
    "pluralization": true
  }
}
```