const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '50mb' }));

// Прокси для анализа изображений
app.post('/api/analyze', async (req, res) => {
    const { image, token } = req.body;
    try {
        const buffer = Buffer.from(image, 'base64');
        // Используем base модель - она быстрее и стабильнее просыпается
        const response = await fetch('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'x-wait-for-model': 'true'
            },
            body: buffer
        });
        
        if (!response.ok) {
            const text = await response.text();
            console.error("HF Error Response:", text);
            // Если модель грузится, возвращаем специальный статус, чтобы фронтенд знал
            return res.status(response.status).json({ 
                error: "Model is loading", 
                details: "Hugging Face is waking up the model. Please wait 15 seconds." 
            });
        }

        const result = await response.json();
        res.json(result);
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Прокси для генерации текста
app.post('/api/generate', async (req, res) => {
    const { prompt, token } = req.body;
    try {
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'x-wait-for-model': 'true'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { max_new_tokens: 800, return_full_text: false }
            })
        });

        if (!response.ok) {
            const text = await response.text();
            return res.status(response.status).json({ error: "AI text model error." });
        }

        const result = await response.json();
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
