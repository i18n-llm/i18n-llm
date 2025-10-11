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
exports.usageReportCommand = void 0;
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Função para expandir operação
function expandOperation(op) {
    return op === 't' ? 'translate' : 'review';
}
exports.usageReportCommand = new commander_1.Command('usage-report')
    .description('Display usage statistics and cost report')
    .option('-d, --detailed', 'Show detailed breakdown by language and operation')
    .option('--json', 'Output in JSON format')
    .option('--reset', 'Reset usage statistics (creates backup first)')
    .option('--no-backup', 'Skip creating backup when resetting')
    .action((options) => {
    try {
        const usagePath = path.resolve(process.cwd(), '.i18n-llm-usage.json');
        // Se for reset
        if (options.reset) {
            if (!fs.existsSync(usagePath)) {
                console.log('📊 No usage data to reset.\n');
                return;
            }
            // Criar backup se solicitado
            if (options.backup !== false) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = path.resolve(process.cwd(), `.i18n-llm-usage.backup-${timestamp}.json`);
                fs.copyFileSync(usagePath, backupPath);
                console.log(`💾 Backup created: ${backupPath}`);
            }
            // Resetar
            const emptyUsage = {
                records: [],
                totals: {
                    requests: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                    estimatedCost: 0,
                }
            };
            fs.writeFileSync(usagePath, JSON.stringify(emptyUsage), 'utf-8');
            console.log('✨ Usage statistics reset successfully!\n');
            return;
        }
        // Relatório normal
        if (!fs.existsSync(usagePath)) {
            console.log('📊 No usage data found yet.');
            console.log('Run `i18n-llm generate` or `i18n-llm review` to start tracking usage.\n');
            return;
        }
        const usage = JSON.parse(fs.readFileSync(usagePath, 'utf-8'));
        if (options.json) {
            // Expandir abreviações para JSON output
            const expanded = {
                records: usage.records.map(r => ({
                    timestamp: r.ts,
                    operation: expandOperation(r.op),
                    model: r.m,
                    language: r.l,
                    inputTokens: r.it,
                    outputTokens: r.ot,
                    totalTokens: r.tt,
                    estimatedCost: r.c,
                })),
                totals: usage.totals
            };
            console.log(JSON.stringify(expanded, null, 2));
            return;
        }
        // Relatório formatado
        console.log('\n💰 i18n-llm Usage Report\n');
        console.log('═'.repeat(50));
        console.log('\n📈 Overall Statistics\n');
        console.log(`Total Requests:     ${usage.totals.requests.toLocaleString()}`);
        console.log(`Total Tokens:       ${usage.totals.totalTokens.toLocaleString()}`);
        console.log(`  - Input Tokens:   ${usage.totals.inputTokens.toLocaleString()}`);
        console.log(`  - Output Tokens:  ${usage.totals.outputTokens.toLocaleString()}`);
        console.log(`\n💵 Estimated Cost:  $${usage.totals.estimatedCost.toFixed(4)}`);
        if (options.detailed && usage.records.length > 0) {
            // Agrupar por operação
            const byOperation = {};
            usage.records.forEach(record => {
                const op = expandOperation(record.op);
                if (!byOperation[op]) {
                    byOperation[op] = { requests: 0, cost: 0 };
                }
                byOperation[op].requests++;
                byOperation[op].cost += record.c;
            });
            console.log('\n\n📊 By Operation\n');
            console.log('─'.repeat(50));
            for (const [op, data] of Object.entries(byOperation)) {
                console.log(`\n${op.charAt(0).toUpperCase() + op.slice(1)}:`);
                console.log(`  Requests: ${data.requests}`);
                console.log(`  Cost:     $${data.cost.toFixed(4)}`);
            }
            // Agrupar por idioma
            const byLanguage = {};
            usage.records.forEach(record => {
                if (record.l) {
                    if (!byLanguage[record.l]) {
                        byLanguage[record.l] = { requests: 0, cost: 0 };
                    }
                    byLanguage[record.l].requests++;
                    byLanguage[record.l].cost += record.c;
                }
            });
            if (Object.keys(byLanguage).length > 0) {
                console.log('\n\n🌍 By Language\n');
                console.log('─'.repeat(50));
                // Ordenar por custo (maior primeiro)
                const sortedLanguages = Object.entries(byLanguage)
                    .sort((a, b) => b[1].cost - a[1].cost);
                for (const [lang, data] of sortedLanguages) {
                    console.log(`\n${lang}:`);
                    console.log(`  Requests: ${data.requests}`);
                    console.log(`  Cost:     $${data.cost.toFixed(4)}`);
                }
            }
            // Agrupar por modelo
            const byModel = {};
            usage.records.forEach(record => {
                if (!byModel[record.m]) {
                    byModel[record.m] = { requests: 0, cost: 0 };
                }
                byModel[record.m].requests++;
                byModel[record.m].cost += record.c;
            });
            console.log('\n\n🤖 By Model\n');
            console.log('─'.repeat(50));
            for (const [model, data] of Object.entries(byModel)) {
                console.log(`\n${model}:`);
                console.log(`  Requests: ${data.requests}`);
                console.log(`  Cost:     $${data.cost.toFixed(4)}`);
            }
            // Últimas 5 operações
            console.log('\n\n🕐 Recent Activity (Last 5)\n');
            console.log('─'.repeat(50));
            const recentRecords = usage.records.slice(-5).reverse();
            recentRecords.forEach(record => {
                const date = new Date(record.ts);
                console.log(`\n${date.toLocaleString()}`);
                console.log(`  Operation: ${expandOperation(record.op)}`);
                console.log(`  Language:  ${record.l || 'N/A'}`);
                console.log(`  Tokens:    ${record.tt.toLocaleString()}`);
                console.log(`  Cost:      $${record.c.toFixed(4)}`);
            });
        }
        console.log('\n' + '═'.repeat(50) + '\n');
    }
    catch (error) {
        console.error('❌ Failed to load usage report:', error);
        process.exit(1);
    }
});
