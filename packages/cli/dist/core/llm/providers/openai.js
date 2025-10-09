"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const openai_1 = require("openai");
function buildPersonaPrompt(persona) {
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
    if (persona.examples?.length) {
        prompt += `**Examples (Learn from these):**\n`;
        persona.examples.forEach(ex => {
            prompt += `- Input: "${ex.input}" -> Output: "${ex.output}"\n`;
        });
    }
    return prompt;
}
class OpenAIProvider {
    constructor(apiKey, model = 'gpt-4.1-mini') {
        this.client = new openai_1.OpenAI({ apiKey });
        this.model = model;
    }
    cleanTranslationKeys(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(item => this.cleanTranslationKeys(item));
        }
        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
            // Remove TODOS os espaços em branco E caracteres de controle Unicode das chaves
            // Isso corrige "\u000b>1", "\u0003>1", " >1" para ">1"
            let cleanedKey = key.trim();
            cleanedKey = cleanedKey.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
            cleaned[cleanedKey] = this.cleanTranslationKeys(value);
        }
        return cleaned;
    }
    async translate(params) {
        const { sourceText, sourceLanguage, targetLanguage, persona, glossary, context, category, isPlural, params: textParams, constraints, } = params;
        const isGenerationTask = sourceLanguage === targetLanguage;
        let systemPrompt;
        let userMessage;
        const pluralizationInstruction = isPlural
            ? `The output MUST be a JSON object with three keys: "=0" (for zero), "=1" (for singular), and ">1" (for plural, use the placeholder '{count}'). DO NOT add any spaces or special characters before the keys.`
            : `The output MUST be a JSON object with a single key: "translatedText".`;
        const personaPrompt = buildPersonaPrompt(persona);
        if (isGenerationTask) {
            systemPrompt = `
        You are an expert creative writer for software interfaces. Your task is to generate contextually appropriate text based on a description, strictly following the persona provided.
        
        ${personaPrompt}

        **Rules:**
        1.  **Input:** You will receive a JSON object with a 'description' of the text to generate.
        2.  **Task:** Generate creative text in the specified language ('targetLanguage') that matches the description and persona.
        3.  **Output Format:** ${pluralizationInstruction}
        4.  **Final Output:** Only output the final JSON object. Do not include any other text, explanations, or markdown.
      `;
            userMessage = JSON.stringify({
                task: `Generate creative text in ${targetLanguage} based on the following description.`,
                description: sourceText,
                context,
                category,
                isPlural,
                params: textParams,
                constraints,
            });
        }
        else {
            systemPrompt = `
        You are an expert localization assistant. Your task is to translate text for software interfaces, strictly following the persona provided.
        
        ${personaPrompt}

        **Rules:**
        1.  **Input:** You will receive a JSON object with the 'sourceText' to translate.
        2.  **Task:** Translate the 'sourceText' from '${sourceLanguage}' to '${targetLanguage}', maintaining the persona and tone.
        3.  **Output Format:** ${pluralizationInstruction}
        4.  **Glossary:** Strictly adhere to the glossary. Do not translate these terms.
             ${glossary ? JSON.stringify(glossary) : 'None.'}
        5.  **Parameters:** If the text includes parameters (like '{count}'), preserve them exactly in the final translation.
        6.  **Final Output:** Only output the final JSON object. Do not include any other text, explanations, or markdown.
      `;
            userMessage = JSON.stringify({
                task: `Translate the following sourceText from ${sourceLanguage} to ${targetLanguage}.`,
                sourceText: sourceText,
                context,
                category,
                isPlural,
                params: textParams,
                constraints,
            });
        }
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('API returned empty content.');
            }
            let jsonResponse = JSON.parse(content);
            // Aplicar limpeza das chaves para remover caracteres Unicode indesejados
            jsonResponse = this.cleanTranslationKeys(jsonResponse);
            if (isPlural) {
                // Remover a chave 'other' se existir
                if (jsonResponse.other) {
                    delete jsonResponse.other;
                }
                return jsonResponse;
            }
            else {
                return jsonResponse.translatedText;
            }
        }
        catch (error) {
            console.error('Error calling OpenAI API:', error);
            throw new Error('Failed to get translation from OpenAI.');
        }
    }
    async review(params) {
        const { sourceText, translatedText, language, persona, constraints } = params;
        const personaPrompt = buildPersonaPrompt(persona);
        const systemPrompt = `
      You are a meticulous Localization Quality Assurance Manager with a deep understanding of how to instruct LLMs. Your task is to analyze a translation and provide feedback, including suggestions for improving the source schema.

      ${personaPrompt}

      **Rules:**
      1.  **Input:** You will receive a JSON object with the source text, the translated text, the language, and any constraints.
      2.  **Analysis:** You must evaluate the translation based on the following criteria:
          *   \`isToneConsistent\`: (boolean) Does the translation's tone strictly match the persona defined above?
          *   \`isGrammaticallyCorrect\`: (boolean) Is the translation grammatically correct and natural-sounding in '${language}'?
          *   \`obeysLengthConstraint\`: (boolean) Is the translation's length compliant? The max length is ${constraints?.maxLength || 'not defined'}. If not defined, this is true.
      3.  **Comment:** Provide a brief, helpful comment (max 15 words) ONLY if one or more criteria fail. If all criteria pass, the comment MUST be an empty string.
      4.  **Schema Suggestion (Crucial Task):**
          *   If the translation fails for any reason (tone, grammar, length), analyze the root cause.
          *   Provide a concrete suggestion on how to improve the original \`i18n.schema.json\` to prevent this failure in the future.
          *   Examples: "Add 'maxLength: 20' to the constraints.", "Add 'Corporate' to forbidden_tones.", "Add a new example to the persona: { input: '...', output: '...' } to better illustrate the desired slang."
          *   If the translation is perfect, this suggestion MUST be an empty string.
      5.  **Output Format:** Your final output MUST be a JSON object with five keys: \`isToneConsistent\`, \`isGrammaticallyCorrect\`, \`obeysLengthConstraint\`, \`comment\`, and \`schemaSuggestion\`.
      6.  **Final Output:** Only output the final JSON object. Do not include any other text, explanations, or markdown.
    `;
        const userMessage = JSON.stringify({
            sourceText,
            translatedText,
            language,
            constraints,
        });
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.2,
                response_format: { type: 'json_object' },
            });
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error('API returned empty content.');
            }
            return JSON.parse(content);
        }
        catch (error) {
            console.error('Error calling OpenAI API for review:', error);
            throw new Error('Failed to get review from OpenAI.');
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
