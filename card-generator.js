/**
 * Canvas Card Generator
 * Handles drawing product image, overlays, and infographic elements
 */

class CardGenerator {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1000;
        this.canvas.height = 1000;
        this.currentImage = null;
    }

    async loadImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.currentImage = img;
                    this.drawBase();
                    resolve(img);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    drawBase() {
        if (!this.currentImage) return;
        
        // 1. Красивый градиентный фон вместо скучного белого
        const bgGradient = this.ctx.createRadialGradient(500, 500, 100, 500, 500, 800);
        bgGradient.addColorStop(0, '#ffffff');
        bgGradient.addColorStop(1, '#f0f2f5');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Отрисовка товара с легкой тенью для объема
        const ratio = Math.min(this.canvas.width / this.currentImage.width, this.canvas.height / this.currentImage.height) * 0.8;
        const w = this.currentImage.width * ratio;
        const h = this.currentImage.height * ratio;
        const x = (this.canvas.width - w) / 2 + 100; // Сдвигаем вправо, чтобы слева был текст
        const y = (this.canvas.height - h) / 2;
        
        this.ctx.shadowColor = 'rgba(0,0,0,0.15)';
        this.ctx.shadowBlur = 50;
        this.ctx.shadowOffsetX = 20;
        this.ctx.shadowOffsetY = 20;
        
        this.ctx.drawImage(this.currentImage, x, y, w, h);
        
        // Сброс тени для остальных элементов
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    render(data) {
        this.drawBase();
        if (!data) return;

        // 3. Дизайнерский заголовок (Top Left)
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 72px "Inter", sans-serif';
        this.ctx.textAlign = 'left';
        
        // Рисуем декоративную полоску под заголовком
        this.ctx.fillStyle = '#6366f1';
        this.ctx.fillRect(50, 130, 80, 8);

        this.ctx.fillStyle = '#1e293b';
        const title = data.title || "Новый товар";
        this.wrapText(title, 50, 220, 450, 80);

        // 4. Инфографика преимуществ (Left Side)
        if (data.benefits && data.benefits.length > 0) {
            let benefitY = 450;
            data.benefits.slice(0, 3).forEach((benefit, index) => {
                // Иконка-чекбокс
                this.ctx.fillStyle = '#6366f1';
                this.drawRoundedRect(50, benefitY - 35, 40, 40, 8);
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 24px "Inter", sans-serif';
                this.ctx.fillText('✓', 58, benefitY - 6);

                // Текст преимущества
                this.ctx.fillStyle = '#475569';
                this.ctx.font = '600 32px "Inter", sans-serif';
                this.ctx.fillText(benefit, 110, benefitY - 5);
                
                benefitY += 80;
            });
        }

        // 5. УТП Бэйдж (Bottom)
        if (data.usp) {
            this.ctx.fillStyle = '#1e293b';
            this.drawRoundedRect(50, 850, 500, 100, 20);
            
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.font = 'bold 24px "Inter", sans-serif';
            this.ctx.fillText('СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ', 80, 890);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 36px "Inter", sans-serif';
            this.ctx.fillText(data.usp.toUpperCase(), 80, 930);
        }

        // 6. Акцентный круг (Top Right)
        this.ctx.beginPath();
        this.ctx.arc(900, 100, 80, 0, Math.PI * 2);
        this.ctx.fillStyle = '#6366f1';
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px "Inter", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('NEW', 900, 95);
        this.ctx.font = '500 20px "Inter", sans-serif';
        this.ctx.fillText('2024', 900, 120);
    }

    wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = this.ctx.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                this.ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, x, y);
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    export() {
        const link = document.createElement('a');
        link.download = 'product-card.png';
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

const cardGen = new CardGenerator('card-canvas');
