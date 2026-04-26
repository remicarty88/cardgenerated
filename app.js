import { hfConnector } from "./hf-api.js";

// Make hfConnector globally available for debugging if needed
window.hfConnector = hfConnector;

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const imageInput = document.getElementById('image-upload');
    const previewThumb = document.getElementById('image-preview');
    const generateBtn = document.getElementById('generate-btn');
    const exportBtn = document.getElementById('export-btn');
    const hfTokenInput = document.getElementById('hf-token');
    const loader = document.getElementById('ai-loader');
    const loaderText = document.getElementById('loader-text');

    let currentBlob = null;
    let aiGeneratedData = null;

    // 1. Drag & Drop & Upload
    dropZone.addEventListener('click', () => imageInput.click());
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--primary)';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = 'var(--border)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImage(file);
        }
    });

    imageInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleImage(e.target.files[0]);
    });

    async function handleImage(file) {
        currentBlob = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            previewThumb.style.backgroundImage = `url(${e.target.result})`;
            previewThumb.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
        await cardGen.loadImage(file);
    }

    // 2. Generation Logic
    generateBtn.addEventListener('click', async () => {
        const token = hfTokenInput.value.trim();
        const manualName = document.getElementById('product-name').value;
        const manualSpecs = document.getElementById('product-specs').value;

        if (!token) {
            alert('Пожалуйста, введите Hugging Face Access Token');
            return;
        }
        if (!currentBlob) {
            alert('Пожалуйста, загрузите изображение товара');
            return;
        }

        hfConnector.setToken(token);
        setLoading(true, 'AI изучает ваше фото (определяем бренд и модель)...');

        try {
            // Step 1: Image to Text - Глубокий анализ
            const visualDescription = await hfConnector.analyzeImage(currentBlob);
            console.log("Visual Analysis Result:", visualDescription);

            // Step 2: Content Generation - На основе анализа
            setLoading(true, 'AI создает продающую концепцию...');
            aiGeneratedData = await hfConnector.generateContent({
                name: manualName, // Если пусто, AI решит сам
                specs: manualSpecs
            }, visualDescription);

            console.log("AI Generated Concept:", aiGeneratedData);

            // Step 3: Render to Canvas
            setLoading(true, 'Рисуем финальный дизайн...');
            cardGen.render(aiGeneratedData);

            // Step 4: Update UI
            updateTextContent(aiGeneratedData);
            
        } catch (error) {
            console.error(error);
            alert('Ошибка: ' + error.message);
        } finally {
            setLoading(false);
        }
    });

    // 3. UI Helpers
    function setLoading(show, text = '') {
        loader.classList.toggle('hidden', !show);
        loaderText.textContent = text;
        generateBtn.disabled = show;
    }

    function updateTextContent(data) {
        document.getElementById('seo-content').innerHTML = `<p>${data.description}</p>`;
        const uspList = document.getElementById('usp-list');
        uspList.innerHTML = `<li><strong>УТП:</strong> ${data.usp}</li>` + 
                           data.benefits.map(b => `<li>${b}</li>`).join('');
    }

    // Tabs logic
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            
            btn.classList.add('active');
            const tabId = btn.dataset.tab === 'seo' ? 'seo-content' : 'usp-content';
            document.getElementById(tabId).classList.remove('hidden');
        });
    });

    // Export & Copy
    exportBtn.addEventListener('click', () => cardGen.export());

    document.getElementById('copy-text-btn').addEventListener('click', () => {
        if (!aiGeneratedData) return;
        const text = `
            ${aiGeneratedData.title}
            ---
            Описание: ${aiGeneratedData.description}
            ---
            Преимущества: ${aiGeneratedData.benefits.join(', ')}
            ---
            УТП: ${aiGeneratedData.usp}
        `;
        navigator.clipboard.writeText(text);
        alert('Текст скопирован!');
    });
});
