import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';

interface UsageRecord {
  timestamp: string;
  operation: 'translate' | 'review';
  model: string;
  language?: string;
  key?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

interface UsageHistory {
  records: UsageRecord[];
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

export const usageReportCommand = new Command('usage-report')
  .description('Display usage statistics and cost report')
  .option('-d, --detailed', 'Show detailed breakdown by language and operation')
  .option('--json', 'Output in JSON format')
  .action((options) => {
    try {
      const usagePath = path.resolve(process.cwd(), '.i18n-llm-usage.json');
      
      if (!fs.existsSync(usagePath)) {
        console.log('📊 No usage data found yet.');
        console.log('Run `i18n-llm generate` or `i18n-llm review` to start tracking usage.\n');
        return;
      }

      const usage: UsageHistory = JSON.parse(fs.readFileSync(usagePath, 'utf-8'));

      if (options.json) {
        console.log(JSON.stringify(usage, null, 2));
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
        const byOperation: { [key: string]: { requests: number; cost: number } } = {};
        usage.records.forEach(record => {
          if (!byOperation[record.operation]) {
            byOperation[record.operation] = { requests: 0, cost: 0 };
          }
          byOperation[record.operation].requests++;
          byOperation[record.operation].cost += record.estimatedCost;
        });

        console.log('\n\n📊 By Operation\n');
        console.log('─'.repeat(50));
        for (const [op, data] of Object.entries(byOperation)) {
          console.log(`\n${op.charAt(0).toUpperCase() + op.slice(1)}:`);
          console.log(`  Requests: ${data.requests}`);
          console.log(`  Cost:     $${data.cost.toFixed(4)}`);
        }

        // Agrupar por idioma
        const byLanguage: { [key: string]: { requests: number; cost: number } } = {};
        usage.records.forEach(record => {
          if (record.language) {
            if (!byLanguage[record.language]) {
              byLanguage[record.language] = { requests: 0, cost: 0 };
            }
            byLanguage[record.language].requests++;
            byLanguage[record.language].cost += record.estimatedCost;
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
        const byModel: { [key: string]: { requests: number; cost: number } } = {};
        usage.records.forEach(record => {
          if (!byModel[record.model]) {
            byModel[record.model] = { requests: 0, cost: 0 };
          }
          byModel[record.model].requests++;
          byModel[record.model].cost += record.estimatedCost;
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
          const date = new Date(record.timestamp);
          console.log(`\n${date.toLocaleString()}`);
          console.log(`  Operation: ${record.operation}`);
          console.log(`  Language:  ${record.language || 'N/A'}`);
          console.log(`  Tokens:    ${record.totalTokens.toLocaleString()}`);
          console.log(`  Cost:      $${record.estimatedCost.toFixed(4)}`);
        });
      }

      console.log('\n' + '═'.repeat(50) + '\n');

    } catch (error) {
      console.error('❌ Failed to load usage report:', error);
      process.exit(1);
    }
  });
