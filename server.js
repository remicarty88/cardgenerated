const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '50mb' }));

// Функция-"будильник" стала еще настырнее (до 20 попыток)
async function fetchWithRetry(url, options, retries = 20) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            
            const text = await response.text();
            if (text.includes("loading") || response.status === 503 || response.status === 404) {
                console.log(`AI спит (попытка ${i+1}/20)... Ждем 10 сек. Модель: ${url.split('/').pop()}`);
                await new Promise(r => setTimeout(r, 10000));
                continue;
            }
            throw new Error(`HF Error: ${text}`);
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

app.post('/api/generate-full', async (req, res) => {
    const { image, prompt, token } = req.body;
    
    try {
        // 1. Анализ фото (Используем сверхстабильную модель)
        console.log("Анализ фото...");
        const visionResult = await fetchWithRetry('https://api-inference.huggingface.co/models/nlpconnect/vit-gpt2-image-captioning', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: Buffer.from(image, 'base64')
        });
        
        // Безопасное извлечение текста
        const visualDescription = (visionResult && visionResult[0] && visionResult[0].generated_text) 
            ? visionResult[0].generated_text 
            : "a high quality product";

        // 2. Генерация дизайна (Используем Zephyr - она быстрее всех просыпается)
        console.log("Генерация дизайна...");
        const textPrompt = `<|system|>
Ты AI Дизайнер. Твоя задача спроектировать карточку товара. 
Отвечай ТОЛЬКО чистым JSON. Не пиши лишнего текста.</s>
 
Товар: ${visualDescription}.
Пожелания: ${prompt || 'сделай топовый дизайн'}.
Верни JSON:
{
    "title": "заголовок",
    "benefits": ["пункт1", "пункт2", "пункт3"],
    "usp": "утп",
    "design": {
        "bgColor": "#1e293b",
        "accentColor": "#6366f1",
        "layout": "right",
        "glowColor": "rgba(99,102,241,0.4)"
    }
}</s>
<|assistant|>`;
        
        const textResult = await fetchWithRetry('https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                inputs: textPrompt, 
                parameters: { max_new_tokens: 500, return_full_text: false } 
            })
        });

        const textOutput = Array.isArray(textResult) ? textResult[0].generated_text : textResult.generated_text;
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) throw new Error("AI failed to design JSON");
        res.json(JSON.parse(jsonMatch[0]));

    } catch (error) {
        console.error("Pipeline Error:", error);
        res.status(500).json({ error: "AI занят. Попробуйте нажать кнопку еще раз." });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
