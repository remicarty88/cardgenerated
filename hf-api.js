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

    async generateFullCard(imageBlob, userPrompt) {
        // УДАЛЕНЫ ВСЕ ЗАГЛУШКИ. Только реальный ИИ.
        try {
            const reader = new FileReader();
            const base64Promise = new Promise((resolve) => {
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(imageBlob);
            });
            const base64Data = await base64Promise;

            // Ждем столько, сколько потребуется (без абортов)
            const response = await fetch('/api/generate-full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    image: base64Data, 
                    prompt: userPrompt,
                    token: this.token 
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "AI Error");
            return result;
        } catch (e) {
            console.error("Critical AI Error:", e);
            throw e; // Пробрасываем реальную ошибку
        }
    }
}

export const hfConnector = new HFConnector();

