const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '50mb' }));

// Функция-"будильник" для бесплатных моделей
async function fetchWithRetry(url, options, retries = 10) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            
            const errData = await response.json();
            if (errData.error && errData.error.includes("loading")) {
                console.log(`AI просыпается (попытка ${i+1})... ждем 10 сек`);
                await new Promise(r => setTimeout(r, 10000));
                continue;
            }
            throw new Error(errData.error || "Unknown error");
        } catch (e) {
            if (i === retries - 1) throw e;
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

app.post('/api/generate-full', async (req, res) => {
    const { image, prompt, token } = req.body;
    
    try {
        // 1. Анализ фото (Бесплатно)
        console.log("Анализ фото...");
        const visionResult = await fetchWithRetry('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: Buffer.from(image, 'base64')
        });
        const visualDescription = visionResult[0].generated_text;

        // 2. Генерация дизайна и текста (Mistral)
        console.log("Генерация уникального дизайна...");
        const textPrompt = `[INST] Ты — AI Дизайнер. Твоя задача спроектировать уникальную карточку.
        Товар на фото: ${visualDescription}.
        Пожелания: ${prompt || 'сделай сочно'}.

        Верни JSON с контентом и ПАРАМЕТРАМИ ДИЗАЙНА:
        {
            "title": "заголовок",
            "benefits": ["пункт1", "пункт2", "пункт3"],
            "usp": "утп",
            "design": {
                "bgColor": "HEX цвет фона",
                "accentColor": "HEX цвет элементов",
                "layout": "left или right (где текст)",
                "glowColor": "цвет свечения товара"
            }
        }
        Язык: Русский. [/INST]`;
        
        const textResult = await fetchWithRetry('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ inputs: textPrompt, parameters: { max_new_tokens: 500 } })
        });

        const textOutput = Array.isArray(textResult) ? textResult[0].generated_text : textResult.generated_text;
        const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
        const finalData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
            title: "Товар определен",
            benefits: ["Качественные материалы", "Стильный вид", "Универсальность"],
            usp: "Отличный выбор"
        };

        res.json(finalData);

    } catch (error) {
        console.error("Pipeline Error:", error);
        res.status(500).json({ error: "AI всё еще просыпается или токен неверный. Попробуйте через минуту." });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
