/**
 * Hugging Face API Connector using Official SDK
 */

import { HfInference } from "@huggingface/inference";

class HFConnector {
    constructor() {
        this.client = null;
        this.models = {
            imageToText: 'Salesforce/blip-image-captioning-large',
            textGeneration: 'mistralai/Mistral-7B-Instruct-v0.3'
        };
    }

    setToken(token) {
        this.client = new HfInference(token);
    }

    /**
     * Анализ изображения через BLIP
     */
    async analyzeImage(imageBlob) {
        if (!this.client) throw new Error('HF Client not initialized. Check token.');

        try {
            const result = await this.client.imageToText({
                model: this.models.imageToText,
                data: imageBlob,
            });
            return result.generated_text;
        } catch (error) {
            console.error("Image Analysis Error:", error);
            throw error;
        }
    }

    async generateContent(productData, visualDescription) {
        if (!this.client) throw new Error('HF Client not initialized');

        // Мощный промпт, который заставляет AI быть самостоятельным и слушать промпт пользователя
        const prompt = `[INST] Ты — креативный директор маркетплейсов. 
        ДАННЫЕ:
        - Визуальный анализ фото: "${visualDescription}"
        - ТВОЙ КРЕАТИВНЫЙ ПРОМПТ: "${productData.specs || 'сделай лучший дизайн'}"
        ${productData.name ? `- НАЗВАНИЕ ТОВАРА: "${productData.name}"` : '- НАЗВАНИЕ: определи сам по фото'}

        ЗАДАЧА:
        1. Используй "ТВОЙ КРЕАТИВНЫЙ ПРОМПТ" как главную инструкцию для стиля текста и выбора преимуществ.
        2. Идентифицируй бренд и модель.
        3. Сгенерируй продающий контент, который соответствует заданному стилю.

        ОТВЕТЬ СТРОГО JSON:
        {
            "title": "Заголовок",
            "benefits": ["Факт 1", "Факт 2", "Факт 3"],
            "description": "SEO текст",
            "usp": "УТП"
        }
        Язык: Русский. [/INST]`;

        try {
            const result = await this.client.textGeneration({
                model: this.models.textGeneration,
                inputs: prompt,
                parameters: {
                    max_new_tokens: 800,
                    return_full_text: false,
                    temperature: 0.8,
                    repetition_penalty: 1.2
                }
            });

            const textOutput = result.generated_text;
            const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("AI failed to return JSON");
            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            console.error("AI Error:", error);
            throw new Error(`Ошибка AI: ${error.message}. Попробуйте включить VPN или расширение CORS.`);
        }
    }
}

export const hfConnector = new HFConnector();
