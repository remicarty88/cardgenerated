/**
 * Hugging Face API Connector using Official SDK
 */

class HFConnector {
    constructor() {
        this.token = '';
    }

    setToken(token) {
        this.token = token;
    }

    async analyzeImage(imageBlob) {
        if (!this.token) throw new Error('Token is missing');

        const reader = new FileReader();
        const base64Promise = new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(imageBlob);
        });
        const base64Data = await base64Promise;

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data, token: this.token })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to analyze image");
        return result[0].generated_text;
    }

    async generateContent(productData, visualDescription) {
        if (!this.token) throw new Error('Token is missing');

        const prompt = `[INST] Ты — креативный директор маркетплейсов. 
        ДАННЫЕ:
        - Визуальный анализ фото: "${visualDescription}"
        - ТВОЙ КРЕАТИВНЫЙ ПРОМПТ: "${productData.specs || 'сделай лучший дизайн'}"
        ${productData.name ? `- НАЗВАНИЕ ТОВАРА: "${productData.name}"` : '- НАЗВАНИЕ: определи сам по фото'}

        ЗАДАЧА:
        1. Используй "ТВОЙ КРЕАТИВНЫЙ ПРОМПТ" как главную инструкцию.
        2. Идентифицируй бренд и модель.
        3. Верни СТРОГО JSON: {"title": "", "benefits": ["", "", ""], "description": "", "usp": ""}
        Язык: Русский. [/INST]`;

        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, token: this.token })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to generate text");
        
        const textOutput = Array.isArray(result) ? result[0].generated_text : result.generated_text;
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : textOutput);
    }
}

export const hfConnector = new HFConnector();

