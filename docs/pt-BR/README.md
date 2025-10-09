<div align="center">
  <a href="../../README.md">English</a> • 
  <a href="README.md">Português (Brasil)</a>
</div>
<hr>

# i18n-llm

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg )](https://opensource.org/licenses/MIT )
[![npm version](https://badge.fury.io/js/i18n-llm.svg )](https://badge.fury.io/js/i18n-llm )

`i18n-llm` é um ecossistema open source que automatiza a internacionalização (i18n) em seus projetos, utilizando o poder dos LLMs para gerar traduções de alta qualidade e cientes do contexto, diretamente no seu pipeline de CI/CD.

Nossa missão é ajudar desenvolvedores a **levar a experiência da língua materna para usuários de todo o mundo**, sem esforço. Diga adeus à gestão manual de arquivos de tradução e olá para um fluxo de trabalho de i18n mais inteligente e rápido.

## ✨ Visão Geral

O núcleo do `i18n-llm` é uma **CLI** que:
1.  Lê um **arquivo de schema (`i18n.schema.json`)** onde você define os textos da sua aplicação na língua-fonte, com contexto e restrições.
2.  Detecta automaticamente textos novos ou alterados.
3.  Chama um provedor de LLM (como OpenAI) para traduzir esses textos para as línguas de destino.
4.  Gera os arquivos de tradução (`.json`) prontos para serem usados na sua aplicação.

Todo esse processo pode ser automatizado com nossa **GitHub Action**, rodando a cada Pull Request.

## 🚀 Guia de Início

> Para um guia completo e detalhado, acesse nossa documentação:
> - [**Guia de Início (Português)**](./01-getting-started.md)
> - [**Getting Started (English)**](../../docs/01-getting-started.md)

### 1. Instalação

Instale a CLI no seu projeto como uma dependência de desenvolvimento:

```bash
npm install --save-dev i18n-llm
```

### 2. Inicialização

Execute o comando `init` para criar os arquivos de configuração iniciais:

```bash
npx i18n-llm init
```

### 3. Gere as Traduções

Após definir seus textos no `i18n.schema.json`, execute o comando `generate`:

```bash
npx i18n-llm generate
```

A CLI criará os arquivos de tradução no diretório de saída especificado.

## 🤝 Contribuindo

O `i18n-llm` é construído pela comunidade, para a comunidade. Acolhemos contribuições de todos os tipos, desde código até traduções da documentação.

Se você quer ajudar a traduzir a documentação para um novo idioma, por favor, leia nosso [Guia de Tradução](./TRANSLATING.md).

## 📄 Licença

Este projeto é licenciado sob a **Licença MIT**. Veja o arquivo `LICENSE` para mais detalhes.
