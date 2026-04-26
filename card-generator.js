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
        
        // 1. Создаем глубокий стильный фон с виньеткой
        const bgGradient = this.ctx.createRadialGradient(500, 500, 50, 500, 500, 700);
        bgGradient.addColorStop(0, '#2d3748');
        bgGradient.addColorStop(1, '#000000');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Добавляем декоративное свечение позади товара
        const glow = this.ctx.createRadialGradient(700, 500, 0, 700, 500, 400);
        glow.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = glow;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 3. Рисуем товар с мощной тенью и отражением
        const ratio = Math.min(this.canvas.width / this.currentImage.width, this.canvas.height / this.currentImage.height) * 0.75;
        const w = this.currentImage.width * ratio;
        const h = this.currentImage.height * ratio;
        const x = (this.canvas.width - w) / 2 + 150; 
        const y = (this.canvas.height - h) / 2;
        
        this.ctx.shadowColor = '#6366f1';
        this.ctx.shadowBlur = 100;
        this.ctx.drawImage(this.currentImage, x, y, w, h);
        this.ctx.shadowBlur = 0;
    }

    render(data) {
        const design = data.design || {
            bgColor: '#000000',
            accentColor: '#6366f1',
            layout: 'right',
            glowColor: 'rgba(99, 102, 241, 0.4)'
        };

        // 1. Фон от AI
        const bgGradient = this.ctx.createRadialGradient(500, 500, 50, 500, 500, 700);
        bgGradient.addColorStop(0, design.bgColor);
        bgGradient.addColorStop(1, '#000000');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. Свечение от AI
        const glow = this.ctx.createRadialGradient(
            design.layout === 'left' ? 300 : 700, 500, 0, 
            design.layout === 'left' ? 300 : 700, 500, 500
        );
        glow.addColorStop(0, design.glowColor);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = glow;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 3. Динамическое положение товара
        const ratio = Math.min(this.canvas.width / this.currentImage.width, this.canvas.height / this.currentImage.height) * 0.7;
        const w = this.currentImage.width * ratio;
        const h = this.currentImage.height * ratio;
        const x = design.layout === 'left' ? (this.canvas.width - w - 50) : 50; 
        const y = (this.canvas.height - h) / 2;
        
        this.ctx.shadowColor = design.accentColor;
        this.ctx.shadowBlur = 60;
        this.ctx.drawImage(this.currentImage, x, y, w, h);
        this.ctx.shadowBlur = 0;

        // 4. Текстовый блок (Позиция зависит от Layout)
        const textX = design.layout === 'left' ? 60 : 550;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 80px "Inter", sans-serif';
        this.wrapText(data.title.toUpperCase(), textX, 150, 420, 85);

        // 5. Инфографика в цвете AI
        if (data.benefits) {
            let benefitY = 400;
            data.benefits.slice(0, 3).forEach((benefit) => {
                this.ctx.fillStyle = design.accentColor;
                const textWidth = this.ctx.measureText(benefit.toUpperCase()).width;
                this.drawRoundedRect(textX, benefitY - 50, textWidth + 40, 60, 10);

                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 28px "Inter", sans-serif';
                this.ctx.fillText(benefit.toUpperCase(), textX + 20, benefitY - 10);
                benefitY += 80;
            });
        }

        // 6. УТП
        this.ctx.save();
        this.ctx.fillStyle = '#fbbf24';
        this.drawRoundedRect(textX, 820, 400, 100, 15);
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 40px "Inter", sans-serif';
        this.ctx.fillText(data.usp.toUpperCase(), textX + 20, 885);
        this.ctx.restore();
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
