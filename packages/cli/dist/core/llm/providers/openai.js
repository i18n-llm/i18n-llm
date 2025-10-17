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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Helper to convert language codes to readable names for LLM
function getLanguageName(code) {
    const languageMap = {
        'en': 'English',
        'en-US': 'American English',
        'en-GB': 'British English',
        'pt': 'Portuguese',
        'pt-BR': 'Brazilian Portuguese',
        'pt-PT': 'European Portuguese',
        'es': 'Spanish',
        'es-ES': 'European Spanish',
        'es-MX': 'Mexican Spanish',
        'es-AR': 'Argentinian Spanish',
        'fr': 'French',
        'fr-FR': 'French',
        'fr-CA': 'Canadian French',
        'de': 'German',
        'de-DE': 'German',
        'it': 'Italian',
        'it-IT': 'Italian',
        'ja': 'Japanese',
        'ja-JP': 'Japanese',
        'ko': 'Korean',
        'ko-KR': 'Korean',
        'zh': 'Chinese',
        'zh-CN': 'Simplified Chinese',
        'zh-TW': 'Traditional Chinese',
        'ru': 'Russian',
        'ru-RU': 'Russian',
        'ar': 'Arabic',
        'ar-SA': 'Arabic',
        'hi': 'Hindi',
        'hi-IN': 'Hindi',
    };
    return languageMap[code] || code;
}
// Preços por 1M tokens (atualizado para gpt-4.1-mini)
const MODEL_PRICING = {
    'gpt-4.1-mini': { input: 0.15, output: 0.60 },
    'gpt-4.1-nano': { input: 0.10, output: 0.40 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 },
};
function buildPersonaPrompt(persona, includeExamples = true) {
    if (!persona)
        return 'Standard professional and clear.';
    let prompt = `**Role:** Act as a ${persona.role}.\n`;
    prompt += `**Tone & Style:**\n- Use the following tones: ${persona.tone.join(', ')}.\n`;
    if (persona.forbidden_tones?.length) {
        prompt += `- NEVER use these tones: ${persona.forbidden_tones.join(', ')}.\n`;
    }
    if (persona.audience) {
        prompt += `- The target audience is: ${persona.audience}.\n`;
    }
    if (includeExamples && persona.examples?.length) {
        prompt += `**Examples (Learn from these):**\n`;
        persona.examples.forEach((ex) => {
            prompt += `- Input: "${ex.input}" -> Output: "${ex.output}"\n`;
        });
    }
    return prompt;
}
// Helper to intelligently truncate text preserving whole words
function smartTruncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    // Try to truncate at last space before maxLength
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
        // If we can preserve at least 80% of the text, truncate at space
        return truncated.substring(0, lastSpace).trim() + '...';
    }
    // Otherwise, hard truncate
    return truncated.trim() + '...';
}
class OpenAIProvider {
    constructor(apiKey, model = 'gpt-4.1-mini') {
        this.client = new openai_1.default({ apiKey });
        this.model = model;
        this.usagePath = path.resolve(process.cwd(), '.i18n-llm-usage.json');
    }
    cleanTranslationKeys(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanTranslationKeys(item));
        }
        const cleaned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const cleanKey = key.replace(/^(translation|translated)_/i, '');
                cleaned[cleanKey] = this.cleanTranslationKeys(obj[key]);
            }
        }
        return cleaned;
    }
    normalizePluralization(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.normalizePluralization(item));
        }
        const normalized = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    const hasPlural = ('=0' in value || '=1' in value || '>1' in value);
                    if (hasPlural) {
                        normalized[key] = {
                            '=0': value['=0'] || value['zero'] || value['0'] || '',
                            '=1': value['=1'] || value['one'] || value['1'] || '',
                            '>1': value['>1'] || value['other'] || value['many'] || value['plural'] || ''
                        };
                    }
                    else {
                        normalized[key] = this.normalizePluralization(value);
                    }
                }
                else {
                    normalized[key] = value;
                }
            }
        }
        return normalized;
    }
    calculateCost(inputTokens, outputTokens) {
        const pricing = MODEL_PRICING[this.model] || MODEL_PRICING['gpt-4.1-mini'];
        const inputCost = (inputTokens / 1000000) * pricing.input;
        const outputCost = (outputTokens / 1000000) * pricing.output;
        return inputCost + outputCost;
    }
    loadUsage() {
        if (!fs.existsSync(this.usagePath)) {
            return {
                records: [],
                totals: {
                    requests: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                    estimatedCost: 0,
                },
            };
        }
        try {
            const data = fs.readFileSync(this.usagePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            console.warn('Failed to load usage history:', error);
            return {
                records: [],
                totals: {
                    requests: 0,
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: 0,
                    estimatedCost: 0,
                },
            };
        }
    }
    saveUsage(record) {
        const history = this.loadUsage();
        history.records.push(record);
        history.totals.requests += 1;
        history.totals.inputTokens += record.it;
        history.totals.outputTokens += record.ot;
        history.totals.totalTokens += record.tt;
        history.totals.estimatedCost += record.c;
        try {
            fs.writeFileSync(this.usagePath, JSON.stringify(history, null, 2));
        }
        catch (error) {
            console.warn('Failed to save usage history:', error);
        }
    }
    async retryWithBackoff(fn, operationName, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                const isRateLimitError = error?.status === 429 || error?.code === 'rate_limit_exceeded';
                const isServerError = error?.status >= 500 && error?.status < 600;
                if (attempt < maxRetries && (isRateLimitError || isServerError)) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    console.warn(`⚠️  ${operationName} failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                throw new Error(`${operationName} failed after ${maxRetries} attempts: ${error.message}`);
            }
        }
        throw new Error(`${operationName} failed after ${maxRetries} attempts`);
    }
    // Build JSON Schema for structured output with maxLength constraints
    buildResponseSchema(items, maxLength) {
        const schema = {
            type: "object",
            properties: {},
            required: [],
            additionalProperties: false
        };
        items.forEach(item => {
            if (item.isPlural) {
                // Plural items return an object
                schema.properties[item.key] = {
                    type: "object",
                    properties: {
                        "=0": {
                            type: "string",
                            ...(maxLength && { maxLength }),
                            description: `Text for zero items. ${maxLength ? `MUST be ${maxLength} characters or less.` : ''}`
                        },
                        "=1": {
                            type: "string",
                            ...(maxLength && { maxLength }),
                            description: `Text for one item. ${maxLength ? `MUST be ${maxLength} characters or less.` : ''}`
                        },
                        ">1": {
                            type: "string",
                            ...(maxLength && { maxLength }),
                            description: `Text for multiple items with {count} placeholder. ${maxLength ? `MUST be ${maxLength} characters or less.` : ''}`
                        }
                    },
                    required: ["=0", "=1", ">1"],
                    additionalProperties: false
                };
            }
            else {
                // Non-plural items return a string
                schema.properties[item.key] = {
                    type: "string",
                    ...(maxLength && { maxLength }),
                    description: `Translation for ${item.key}. ${maxLength ? `MUST be ${maxLength} characters or less.` : ''}`
                };
            }
            schema.required.push(item.key);
        });
        return schema;
    }
    async translateBatch(items, targetLanguage, sourceLanguage, persona, glossary, metadata) {
        const isGenerationTask = sourceLanguage === targetLanguage;
        // Disable examples for generation tasks to avoid language confusion
        const personaPrompt = buildPersonaPrompt(persona, !isGenerationTask);
        // Construir input compacto
        const batchInput = {};
        items.forEach(item => {
            batchInput[item.key] = item.sourceText;
        });
        // Identificar quais são plurais
        const pluralKeys = items.filter(i => i.isPlural).map(i => i.key);
        // Build list of items with maxLength constraints
        const itemsWithLimits = items
            .filter(i => i.maxLength)
            .map(i => `- ${i.key}: max ${i.maxLength} chars`)
            .join('\n');
        const hasMaxLengthConstraints = items.some(i => i.maxLength);
        const systemPrompt = isGenerationTask
            ? `You are an expert creative writer for software interfaces. Your task is to generate contextually appropriate text in ${getLanguageName(targetLanguage)}.

${personaPrompt}

**Context for this batch:** ${metadata.context || 'General software interface'}

${hasMaxLengthConstraints ? `
🚨 **CHARACTER LIMITS (per item)** 🚨
The following items have specific character limits that MUST be respected:
${itemsWithLimits}

⚠️  ANY text exceeding its limit will be AUTOMATICALLY REJECTED.
⚠️  Count characters BEFORE responding. Double-check your count.
⚠️  If needed, use abbreviations, remove articles, or simplify to fit the limit.
` : ''}

**Glossary (NEVER translate these):**
${glossary ? Object.entries(glossary).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'None'}

**Pluralization Rules:**
For keys marked as plural (${pluralKeys.length > 0 ? pluralKeys.join(', ') : 'none in this batch'}), return an object with EXACTLY 3 keys:
- "=0": Text for zero items ${hasMaxLengthConstraints ? `(check limits above)` : ''}
- "=1": Text for exactly one item ${hasMaxLengthConstraints ? `(check limits above)` : ''}
- ">1": Text for more than one item with {count} placeholder ${hasMaxLengthConstraints ? `(check limits above)` : ''}

**Variety in Language:**
When appropriate, vary adjectives and expressions to avoid repetition.
Only do this when it maintains persona and context perfectly.

**Output Format:**
Return a JSON object with the same keys as input.
- Non-plural keys: string value ${hasMaxLengthConstraints ? `(check limits above)` : ''}
- Plural keys: object with "=0", "=1", ">1" ${hasMaxLengthConstraints ? `(check limits above)` : ''}`
            : `You are a professional translator specializing in software localization.
Your task is to translate from ${getLanguageName(sourceLanguage)} to ${getLanguageName(targetLanguage)}.

${personaPrompt}

**Context for this batch:** ${metadata.context || 'General software interface'}

${hasMaxLengthConstraints ? `
🚨 **CHARACTER LIMITS (per item)** 🚨
The following items have specific character limits that MUST be respected:
${itemsWithLimits}

⚠️  ANY translation exceeding its limit will be AUTOMATICALLY REJECTED.
⚠️  Count characters BEFORE responding. Double-check your count.
⚠️  If needed, use shorter synonyms, remove unnecessary words, or simplify to fit.
` : ''}

**Glossary (NEVER translate these):**
${glossary ? Object.entries(glossary).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'None'}

**Pluralization Rules:**
For keys marked as plural (${pluralKeys.length > 0 ? pluralKeys.join(', ') : 'none in this batch'}), return an object with EXACTLY 3 keys:
- "=0": Translation for zero items ${hasMaxLengthConstraints ? `(check limits above)` : ''}
- "=1": Translation for one item ${hasMaxLengthConstraints ? `(check limits above)` : ''}
- ">1": Translation for multiple items with {count} ${hasMaxLengthConstraints ? `(check limits above)` : ''}

**Important Rules:**
1. Preserve ALL placeholders: {variable}, {{variable}}, %s, etc.
2. Keep the same tone and formality
3. ${hasMaxLengthConstraints ? `CRITICAL: Respect the character limits listed above` : ''}

**Output Format:**
Return a JSON object with the same keys as input.`;
        const userMessage = JSON.stringify(batchInput);
        // Build structured schema if maxLength is specified
        const useStructuredOutput = false; // Disabled for per-item maxLength support
        const requestParams = {
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
        };
        // Use structured output with JSON Schema for better enforcement
        if (useStructuredOutput) {
            requestParams.response_format = {
                type: "json_schema",
                json_schema: {
                    name: "translation_batch",
                    schema: this.buildResponseSchema(items), // maxLength handled per-item in validation
                    strict: true
                }
            };
        }
        else {
            requestParams.response_format = { type: 'json_object' };
        }
        const response = await this.retryWithBackoff(() => this.client.chat.completions.create(requestParams), 'Batch translation');
        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('API returned empty content.');
        }
        // Capturar usage
        const usage = response.usage;
        if (usage) {
            const cost = this.calculateCost(usage.prompt_tokens, usage.completion_tokens);
            const record = {
                ts: new Date().toISOString(),
                op: 't',
                m: this.model,
                l: targetLanguage,
                it: usage.prompt_tokens,
                ot: usage.completion_tokens,
                tt: usage.total_tokens,
                c: cost,
            };
            this.saveUsage(record);
            console.log(`     💰 Batch cost: $${cost.toFixed(4)} (${usage.total_tokens} tokens, ${items.length} items)`);
        }
        let jsonResponse = JSON.parse(content);
        jsonResponse = this.cleanTranslationKeys(jsonResponse);
        jsonResponse = this.normalizePluralization(jsonResponse);
        // Create maxLength map for per-item validation
        const maxLengthMap = new Map();
        items.forEach(item => {
            if (item.maxLength) {
                maxLengthMap.set(item.key, item.maxLength);
            }
        });
        // Post-validation and truncation with per-item maxLength
        if (maxLengthMap.size > 0) {
            const validatedResults = {};
            let violationCount = 0;
            for (const [key, text] of Object.entries(jsonResponse)) {
                const itemMaxLength = maxLengthMap.get(key);
                if (typeof text === 'string') {
                    if (itemMaxLength && text.length > itemMaxLength) {
                        violationCount++;
                        const truncated = smartTruncate(text, itemMaxLength);
                        console.warn(`     ⚠️  '${key}' exceeded limit (${text.length}/${itemMaxLength}). Truncated to: "${truncated}"`);
                        validatedResults[key] = truncated;
                    }
                    else {
                        validatedResults[key] = text;
                    }
                }
                else if (typeof text === 'object' && text !== null) {
                    // Handle pluralization
                    const pluralObj = text;
                    const validated = {
                        '=0': pluralObj['=0'] || '',
                        '=1': pluralObj['=1'] || '',
                        '>1': pluralObj['>1'] || ''
                    };
                    if (itemMaxLength) {
                        let hadViolation = false;
                        for (const [pluralKey, pluralText] of Object.entries(validated)) {
                            if (pluralText.length > itemMaxLength) {
                                hadViolation = true;
                                validated[pluralKey] = smartTruncate(pluralText, itemMaxLength);
                            }
                        }
                        if (hadViolation) {
                            violationCount++;
                            console.warn(`     ⚠️  '${key}' plural variants exceeded limit (${itemMaxLength} chars). Truncated.`);
                        }
                    }
                    validatedResults[key] = validated;
                }
                else {
                    validatedResults[key] = text;
                }
            }
            if (violationCount > 0) {
                console.warn(`     ⚠️  ${violationCount}/${items.length} items exceeded maxLength and were truncated`);
            }
            return validatedResults;
        }
        return jsonResponse;
    }
    async translate(params) {
        const { sourceText, targetLanguage, sourceLanguage, persona, glossary, context, category, isPlural, params: textParams, constraints } = params;
        const isGenerationTask = sourceLanguage === targetLanguage;
        // Disable examples for generation tasks to avoid language confusion
        const personaPrompt = buildPersonaPrompt(persona, !isGenerationTask);
        // Build few-shot example if maxLength is specified
        let fewShotExample = '';
        if (constraints?.maxLength) {
            const exampleText = "Brief text";
            fewShotExample = `
**Example within ${constraints.maxLength} char limit:**
"${exampleText}" (${exampleText.length} chars ✓)
`;
        }
        const systemPrompt = isGenerationTask
            ? `You are an expert creative writer for software interfaces. Your task is to generate contextually appropriate text in ${getLanguageName(targetLanguage)}.

${personaPrompt}

${context ? `**Context:** ${context.entity || context}` : ''}
${category ? `**Category:** ${category}` : ''}

${constraints?.maxLength ? `
🚨 **CRITICAL: Maximum ${constraints.maxLength} characters** 🚨
Your response MUST NOT exceed ${constraints.maxLength} characters.
${fewShotExample}
` : ''}

**Glossary (NEVER translate these):**
${glossary ? Object.entries(glossary).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'None'}

${isPlural ? `**CRITICAL - Pluralization:**
Return a JSON object with EXACTLY 3 keys:
- "=0": Text for zero items ${constraints?.maxLength ? `(max ${constraints.maxLength} chars)` : ''}
- "=1": Text for one item ${constraints?.maxLength ? `(max ${constraints.maxLength} chars)` : ''}
- ">1": Text for multiple items with {count} ${constraints?.maxLength ? `(max ${constraints.maxLength} chars)` : ''}` : ''}

Only output valid JSON. No markdown, no explanations.`
            : `You are a professional translator specializing in software localization.
Translate from ${sourceLanguage} to ${targetLanguage}.

${personaPrompt}

${context ? `**Context:** ${context.entity || context}` : ''}
${category ? `**Category:** ${category}` : ''}

${constraints?.maxLength ? `
🚨 **CRITICAL: Maximum ${constraints.maxLength} characters** 🚨
Your translation MUST NOT exceed ${constraints.maxLength} characters.
${fewShotExample}
` : ''}

**Glossary (NEVER translate these):**
${glossary ? Object.entries(glossary).map(([k, v]) => `- ${k}: ${v}`).join('\n') : 'None'}

${isPlural ? `**Pluralization:**
Return JSON with "=0", "=1", ">1" keys ${constraints?.maxLength ? `(each max ${constraints.maxLength} chars)` : ''}` : ''}

Preserve ALL placeholders. Only output valid JSON.`;
        const userMessage = isPlural
            ? JSON.stringify({ text: sourceText, params: textParams })
            : JSON.stringify({ text: sourceText });
        const response = await this.retryWithBackoff(() => this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
        }), 'Translation');
        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('API returned empty content.');
        }
        const usage = response.usage;
        if (usage) {
            const cost = this.calculateCost(usage.prompt_tokens, usage.completion_tokens);
            const record = {
                ts: new Date().toISOString(),
                op: 't',
                m: this.model,
                l: targetLanguage,
                it: usage.prompt_tokens,
                ot: usage.completion_tokens,
                tt: usage.total_tokens,
                c: cost,
            };
            this.saveUsage(record);
            console.log(`     💰 Cost: $${cost.toFixed(4)} (${usage.total_tokens} tokens)`);
        }
        let jsonResponse = JSON.parse(content);
        jsonResponse = this.cleanTranslationKeys(jsonResponse);
        if (isPlural) {
            jsonResponse = this.normalizePluralization(jsonResponse);
            // Validate maxLength for plural
            if (constraints?.maxLength) {
                const validated = {
                    '=0': jsonResponse['=0'] || '',
                    '=1': jsonResponse['=1'] || '',
                    '>1': jsonResponse['>1'] || ''
                };
                for (const [key, text] of Object.entries(validated)) {
                    if (text.length > constraints.maxLength) {
                        validated[key] = smartTruncate(text, constraints.maxLength);
                        console.warn(`⚠️  Plural '${key}' truncated (${text.length} -> ${constraints.maxLength})`);
                    }
                }
                return validated;
            }
            return jsonResponse;
        }
        const result = jsonResponse.text || jsonResponse.translation || jsonResponse.result || Object.values(jsonResponse)[0];
        // Validate maxLength for single translation
        if (constraints?.maxLength && typeof result === 'string' && result.length > constraints.maxLength) {
            const truncated = smartTruncate(result, constraints.maxLength);
            console.warn(`⚠️  Translation truncated (${result.length} -> ${constraints.maxLength}): "${truncated}"`);
            return truncated;
        }
        return result;
    }
    async review({ sourceText, translatedText, language, constraints }) {
        const systemPrompt = `You are an expert translation reviewer. Analyze the translation quality and provide structured feedback.

**Your task:**
  1. **Tone Consistency:** Check if the translation maintains an appropriate and consistent tone.
  2. **Grammar:** Verify grammatical correctness in ${language}.
  3. **Length Constraint:** ${constraints?.maxLength ? `Ensure translation is under ${constraints.maxLength} characters.` : 'No length constraint.'}
  4. **Schema Suggestion:** If you detect a recurring issue that could be fixed by adjusting the source schema, provide a concrete suggestion. If perfect, leave empty.
  5. **Output Format:** JSON with keys: \`isToneConsistent\`, \`isGrammaticallyCorrect\`, \`obeysLengthConstraint\`, \`comment\`, \`schemaSuggestion\`.

Only output JSON. No markdown, no explanations.`;
        const userMessage = JSON.stringify({
            sourceText,
            translatedText,
            language,
            constraints,
        });
        const response = await this.retryWithBackoff(() => this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
        }), 'Review');
        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('API returned empty content.');
        }
        const usage = response.usage;
        if (usage) {
            const cost = this.calculateCost(usage.prompt_tokens, usage.completion_tokens);
            const record = {
                ts: new Date().toISOString(),
                op: 'r',
                m: this.model,
                l: language,
                it: usage.prompt_tokens,
                ot: usage.completion_tokens,
                tt: usage.total_tokens,
                c: cost,
            };
            this.saveUsage(record);
            console.log(`     💰 Cost: $${cost.toFixed(4)} (${usage.total_tokens} tokens)`);
        }
        return JSON.parse(content);
    }
}
exports.OpenAIProvider = OpenAIProvider;
