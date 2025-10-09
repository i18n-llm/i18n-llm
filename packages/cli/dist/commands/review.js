"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewCommand = void 0;
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const openai_1 = require("../core/llm/providers/openai");
function loadUsageTotals() {
    try {
        const usagePath = path.resolve(process.cwd(), '.i18n-llm-usage.json');
        if (fs.existsSync(usagePath)) {
            const usage = JSON.parse(fs.readFileSync(usagePath, 'utf-8'));
            return {
                requests: usage.totals?.requests || 0,
                cost: usage.totals?.estimatedCost || 0,
            };
        }
    }
    catch (error) {
        // Ignorar erros
    }
    return { requests: 0, cost: 0 };
}
exports.reviewCommand = new commander_1.Command('review')
    .description('Review generated translations for quality and consistency')
    .option('-l, --language <language>', 'Language code to review (e.g., fr-FR)')
    .option('-a, --all', 'Review all generated languages')
    .action(async (options) => {
    try {
        console.log('🔍 Starting translation review...\n');
        // Capturar totais antes da execução
        const beforeUsage = loadUsageTotals();
        // Carregar configuração
        const configPath = path.resolve(process.cwd(), 'i18n-llm.config.js');
        if (!fs.existsSync(configPath)) {
            console.error('❌ Config file not found: i18n-llm.config.js');
            process.exit(1);
        }
        const config = require(configPath);
        // Carregar schema
        const schemaPath = path.resolve(process.cwd(), config.schemaPath || 'i18n.schema.json');
        if (!fs.existsSync(schemaPath)) {
            console.error(`❌ Schema file not found: ${schemaPath}`);
            process.exit(1);
        }
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
        // Criar provider
        const apiKey = process.env.OPENAI_API_KEY || config.llm?.apiKey;
        if (!apiKey) {
            console.error('❌ OpenAI API key not found. Set OPENAI_API_KEY environment variable or add it to config.');
            process.exit(1);
        }
        const provider = new openai_1.OpenAIProvider(apiKey, config.llm?.model);
        // Determinar quais idiomas revisar
        const languagesToReview = [];
        if (options.all) {
            // Pegar do schema.targetLanguages ou config.languages
            languagesToReview.push(...(schema.targetLanguages || config.languages || []));
        }
        else if (options.language) {
            languagesToReview.push(options.language);
        }
        else {
            console.error('❌ Please specify --language <code> or --all');
            process.exit(1);
        }
        if (languagesToReview.length === 0) {
            console.error('❌ No languages found to review');
            process.exit(1);
        }
        const allIssues = {};
        // Revisar cada idioma
        for (const lang of languagesToReview) {
            console.log(`📋 Reviewing ${lang}...`);
            const translationPath = path.resolve(process.cwd(), config.outputDir || 'locales', `${lang}.json`);
            if (!fs.existsSync(translationPath)) {
                console.warn(`⚠️  Translation file not found: ${translationPath}`);
                continue;
            }
            const translations = JSON.parse(fs.readFileSync(translationPath, 'utf-8'));
            const issues = [];
            // Revisar cada chave recursivamente (começando de entities)
            if (schema.entities) {
                await reviewObject(schema.entities, translations, '', lang, schema, provider, issues);
            }
            allIssues[lang] = issues;
            const passedCount = issues.filter(i => i.isToneConsistent && i.isGrammaticallyCorrect && i.obeysLengthConstraint).length;
            const failedCount = issues.length - passedCount;
            console.log(`  ✅ Passed: ${passedCount}`);
            console.log(`  ❌ Failed: ${failedCount}\n`);
        }
        // Gerar relatório em Markdown
        const reportPath = path.resolve(process.cwd(), 'i18n-review-report.md');
        generateMarkdownReport(allIssues, reportPath);
        console.log(`\n📄 Review report saved to: ${reportPath}`);
        console.log('✨ Review complete!');
        // Mostrar relatório de custo
        const afterUsage = loadUsageTotals();
        const requestsThisRun = afterUsage.requests - beforeUsage.requests;
        const costThisRun = afterUsage.cost - beforeUsage.cost;
        if (requestsThisRun > 0) {
            console.log('\n📊 Usage Report:');
            console.log(`   This run: $${costThisRun.toFixed(4)} (${requestsThisRun} requests)`);
            console.log(`   Total accumulated: $${afterUsage.cost.toFixed(4)} (${afterUsage.requests} requests)`);
        }
    }
    catch (error) {
        console.error('❌ Review failed:', error);
        // Mostrar custo mesmo em caso de erro
        const afterUsage = loadUsageTotals();
        if (afterUsage.requests > 0) {
            console.log(`\n💰 Accumulated cost: $${afterUsage.cost.toFixed(4)} (${afterUsage.requests} requests)`);
        }
        process.exit(1);
    }
});
async function reviewObject(schemaNode, translationNode, currentPath, language, fullSchema, provider, issues) {
    for (const key in schemaNode) {
        // Pular chaves que começam com underscore (como _context)
        if (key.startsWith('_')) {
            continue;
        }
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        const schemaValue = schemaNode[key];
        const translationValue = translationNode?.[key];
        if (!translationValue) {
            continue; // Pular se não houver tradução
        }
        // Se tem description, é uma folha (texto para traduzir)
        if (schemaValue.description) {
            const sourceText = schemaValue.description;
            // Se for pluralização
            if (schemaValue.pluralization === true) {
                // Revisar cada forma plural
                for (const pluralKey of ['=0', '=1', '>1']) {
                    if (translationValue[pluralKey]) {
                        console.log(`  🔍 Reviewing: ${newPath}.${pluralKey}`);
                        const result = await provider.review({
                            sourceText,
                            translatedText: translationValue[pluralKey],
                            language,
                            persona: fullSchema.persona,
                            constraints: schemaValue.constraints,
                        });
                        issues.push({
                            key: `${newPath}.${pluralKey}`,
                            sourceText,
                            translatedText: translationValue[pluralKey],
                            ...result,
                        });
                    }
                }
            }
            // Se for texto simples
            else if (typeof translationValue === 'string') {
                console.log(`  🔍 Reviewing: ${newPath}`);
                const result = await provider.review({
                    sourceText,
                    translatedText: translationValue,
                    language,
                    persona: fullSchema.persona,
                    constraints: schemaValue.constraints,
                });
                issues.push({
                    key: newPath,
                    sourceText,
                    translatedText: translationValue,
                    ...result,
                });
            }
        }
        // Se for um objeto aninhado (não tem description)
        else if (typeof schemaValue === 'object') {
            await reviewObject(schemaValue, translationValue, newPath, language, fullSchema, provider, issues);
        }
    }
}
function generateMarkdownReport(allIssues, outputPath) {
    let markdown = '# Translation Review Report\n\n';
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    markdown += '---\n\n';
    for (const [language, issues] of Object.entries(allIssues)) {
        const passedCount = issues.filter(i => i.isToneConsistent && i.isGrammaticallyCorrect && i.obeysLengthConstraint).length;
        const failedCount = issues.length - passedCount;
        markdown += `## ${language}\n\n`;
        markdown += `### Summary\n\n`;
        markdown += `- **Total translations:** ${issues.length}\n`;
        markdown += `- **Passed:** ${passedCount} ✅\n`;
        markdown += `- **Failed:** ${failedCount} ❌\n\n`;
        // Mostrar apenas os que falharam
        const failedIssues = issues.filter(i => !i.isToneConsistent || !i.isGrammaticallyCorrect || !i.obeysLengthConstraint);
        if (failedIssues.length > 0) {
            markdown += `### Issues Found\n\n`;
            for (const issue of failedIssues) {
                markdown += `#### \`${issue.key}\`\n\n`;
                markdown += `**Source:** ${issue.sourceText}\n\n`;
                markdown += `**Translation:** ${issue.translatedText}\n\n`;
                markdown += `| Criterion | Status |\n`;
                markdown += `|-----------|--------|\n`;
                markdown += `| Tone Consistent | ${issue.isToneConsistent ? '✅ Yes' : '❌ No'} |\n`;
                markdown += `| Grammatically Correct | ${issue.isGrammaticallyCorrect ? '✅ Yes' : '❌ No'} |\n`;
                markdown += `| Length Constraint | ${issue.obeysLengthConstraint ? '✅ Yes' : '❌ No'} |\n\n`;
                if (issue.comment) {
                    markdown += `**Comment:** ${issue.comment}\n\n`;
                }
                if (issue.schemaSuggestion) {
                    markdown += `**💡 Schema Suggestion:** ${issue.schemaSuggestion}\n\n`;
                }
                markdown += `---\n\n`;
            }
        }
        else {
            markdown += `### ✨ All translations passed!\n\n`;
        }
        markdown += '\n';
    }
    fs.writeFileSync(outputPath, markdown, 'utf-8');
}
