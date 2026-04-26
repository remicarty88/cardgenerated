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
        const response = await fetch('https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-large', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: buffer
        });
        const result = await response.json();
        res.json(result);
    } catch (error) {
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
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: { max_new_tokens: 800, return_full_text: false }
            })
        });
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
