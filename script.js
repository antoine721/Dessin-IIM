const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height;
let time = 0;
let mouse = { x: 0, y: 0 };
let mouseActive = false;

const shapeCount = 8;
const segments = 20;
const depth = 10;
const baseSize = 100;

class Shape3D {
    constructor(index) {
        this.index = index;
        this.z = -depth + (index / shapeCount) * depth * 2;
        this.rotationX = Math.random() * Math.PI * 2;
        this.rotationY = Math.random() * Math.PI * 2;
        this.rotSpeedX = (Math.random() - 0.5) * 0.008;
        this.rotSpeedY = (Math.random() - 0.5) * 0.008;
        this.hue = (index * 45) % 360;
    }

    project3D(x, y, z) {
        const scale = 200 / (200 + z);
        return {
            x: x * scale + width / 2,
            y: y * scale + height / 2,
            scale: scale
        };
    }

    rotate3D(x, y, z) {
        let nx = x, ny = y, nz = z;

        const cosX = Math.cos(this.rotationX);
        const sinX = Math.sin(this.rotationX);
        ny = y * cosX - z * sinX;
        nz = y * sinX + z * cosX;
        y = ny;
        z = nz;

        const cosY = Math.cos(this.rotationY);
        const sinY = Math.sin(this.rotationY);
        nx = x * cosY + z * sinY;
        nz = -x * sinY + z * cosY;

        return { x: nx, y: ny, z: nz };
    }

    update(t) {
        this.rotationX += this.rotSpeedX;
        this.rotationY += this.rotSpeedY;
        
        if (mouseActive) {
            const dx = mouse.x - width / 2;
            const dy = mouse.y - height / 2;
            this.rotationY += dx * 0.00005;
            this.rotationX += dy * 0.00005;
        }
    }

    getVertices(t) {
        const vertices = [];
        const size = baseSize * (1 + Math.sin(t * 0.4 + this.index) * 0.2);
        const morph = Math.sin(t * 0.5 + this.index) * 0.3;

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const radius = size * (1 + Math.sin(angle * 2 + t) * morph);
            
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = Math.sin(angle * 2) * size * 0.2;

            const rot = this.rotate3D(x, y, z + this.z);
            vertices.push({
                p: this.project3D(rot.x, rot.y, rot.z),
                z: rot.z
            });
        }

        return vertices.sort((a, b) => b.z - a.z);
    }

    draw(t) {
        const vertices = this.getVertices(t);
        
        const hue = (this.hue + t * 8) % 360;
        const saturation = 85 + Math.sin(t + this.index) * 15;
        const lightness = 55 + Math.cos(t * 0.6 + this.index) * 20;
        const opacity = 0.4 + (this.index / shapeCount) * 0.5;
        
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) * 0.6
        );
        
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`);
        gradient.addColorStop(0.6, `hsla(${hue + 30}, ${saturation}%, ${lightness + 10}%, ${opacity * 0.5})`);
        gradient.addColorStop(1, `hsla(${hue + 60}, ${saturation}%, ${lightness - 10}%, 0)`);
        
        ctx.beginPath();
        ctx.moveTo(vertices[0].p.x, vertices[0].p.y);
        
        for (let i = 1; i < vertices.length; i++) {
            const v = vertices[i];
            const nextV = vertices[(i + 1) % vertices.length];
            
            const cp1x = v.p.x + (nextV.p.x - v.p.x) * 0.5;
            const cp1y = v.p.y + (nextV.p.y - v.p.y) * 0.5;
            
            ctx.quadraticCurveTo(v.p.x, v.p.y, cp1x, cp1y);
        }
        
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness + 25}%, ${opacity * 0.9})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

const shapes = [];
for (let i = 0; i < shapeCount; i++) {
    shapes.push(new Shape3D(i));
}

function drawBackground(t) {
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height)
    );
    
    gradient.addColorStop(0, `hsl(${(t * 2) % 360}, 20%, 3%)`);
    gradient.addColorStop(1, 'hsl(0, 0%, 0%)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function drawOrbitalRings(t) {
    const ringCount = 3;
    
    for (let i = 0; i < ringCount; i++) {
        const radius = Math.min(width, height) * (0.25 + i * 0.12);
        const rotation = t * (0.08 + i * 0.04);
        const segments = 40;
        
        ctx.save();
        ctx.translate(width / 2, height / 2);
        ctx.rotate(rotation);
        
        const hue = (t * 10 + i * 120) % 360;
        
        for (let j = 0; j < segments; j += 2) {
            const angle1 = (j / segments) * Math.PI * 2;
            const angle2 = ((j + 1) / segments) * Math.PI * 2;
            
            const x1 = Math.cos(angle1) * radius;
            const y1 = Math.sin(angle1) * radius;
            const x2 = Math.cos(angle2) * radius;
            const y2 = Math.sin(angle2) * radius;
            
            const opacity = 0.15 + Math.sin(angle1 * 3 + t) * 0.1;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

function drawMouseGlow() {
    if (!mouseActive) return;
    
    const gradient = ctx.createRadialGradient(
        mouse.x, mouse.y, 0,
        mouse.x, mouse.y, 150
    );
    
    const hue = (time * 20) % 360;
    gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.25)`);
    gradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(mouse.x - 150, mouse.y - 150, 300, 300);
}

function init() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

function animate() {
    time += 0.016;
    
    drawBackground(time);
    drawOrbitalRings(time);
    
    shapes.forEach(shape => {
        shape.update(time);
        shape.draw(time);
    });
    
    drawMouseGlow();
    
    requestAnimationFrame(animate);
}

canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouseActive = true;
});

canvas.addEventListener('mouseleave', () => {
    mouseActive = false;
});

window.addEventListener('resize', () => {
    init();
});

init();
animate();

