class PlotRenderer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gridSpacing = 20;
        this.showLabels = true;
    }

    setCanvas(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    clear() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Enhanced grid with small text labels
    drawGrid() {
        if (!this.ctx || !this.canvas) return;
        
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        ctx.save();
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.font = '10px Inter';
        ctx.fillStyle = '#94a3b8';
        
        // Major grid lines
        for (let x = 0; x <= width; x += this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            
            if (x % (this.gridSpacing * 5) === 0) {
                ctx.fillText(x, x + 2, 15);
            }
        }
        
        for (let y = 0; y <= height; y += this.gridSpacing) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            
            if (y % (this.gridSpacing * 5) === 0) {
                ctx.fillText(y, 2, y - 2);
            }
        }
        
        ctx.restore();
    }

    // Consistent proportional scaling - prevents shape changes
    drawPlot(coords, sideLengths, view) {
        if (!this.ctx || !coords) return;
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        ctx.save();
        
        // Maintain aspect ratio - key for proportional scaling
        const scale = view.zoom * 15;
        ctx.translate(canvas.width / 2 + view.panX, canvas.height / 2 + view.panY);
        ctx.scale(scale, scale);
        ctx.scale(1, -1); // Engineering coordinates (Y up)
        
        // Draw filled polygon
        ctx.beginPath();
        coords.forEach((p, idx) => {
            if (idx === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.closePath();
        
        // Light theme colors
        ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
        
        // Draw vertices and labels
        coords.forEach((p, idx) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 0.3 / scale, 0, Math.PI * 2);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
            
            // Small grid text labels
            if (this.showLabels) {
                ctx.save();
                ctx.scale(1, -1);
                ctx.font = `${0.4 / scale}px Inter`;
                ctx.fillStyle = '#1e293b';
                ctx.textAlign = 'center';
                ctx.fillText(`P${idx + 1}`, p.x, -p.y + 0.5 / scale);
                ctx.restore();
            }
        });
        
        // Draw side length labels (small grid text)
        sideLengths.forEach((length, idx) => {
            const p1 = coords[idx];
            const p2 = coords[(idx + 1) % coords.length];
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            
            ctx.save();
            ctx.scale(1, -1);
            ctx.font = `${0.3 / scale}px Inter`;
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            
            // Small background for text
            ctx.fillRect(midX - 0.8/scale, -midY - 0.2/scale, 1.6/scale, 0.4/scale);
            ctx.fillStyle = 'white';
            ctx.fillText(`${length.toFixed(2)}m`, midX, -midY + 0.05/scale);
            ctx.restore();
        });
        
        ctx.restore();
    }

    create3DPlot(coords) {
        if (typeof THREE === 'undefined') return null;
        
        let group = new THREE.Group();
        if (coords.length < 3) return group;

        let shape = new THREE.Shape();
        coords.forEach((p, idx) => {
            if (idx === 0) shape.moveTo(p.x, p.y);
            else shape.lineTo(p.x, p.y);
        });
        shape.closePath();

        let extrudeSettings = {
            depth: 5,
            bevelEnabled: false
        };

        let geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        let material = new THREE.MeshLambertMaterial({ 
            color: '#6366f1', 
            transparent: true, 
            opacity: 0.8 
        });
        let mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        group.add(mesh);

        // Add ground plane
        let planeGeo = new THREE.PlaneGeometry(100, 100);
        let planeMat = new THREE.MeshPhongMaterial({ color: '#f1f5f9' });
        let plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = 0;
        plane.receiveShadow = true;

        group.add(plane);

        return group;
    }

    screenToWorld(x, y, view) {
        if (!this.canvas) return { x: 0, y: 0 };
        
        let scale = view.zoom * 15;
        let canvas = this.canvas;
        
        let worldX = (x - canvas.width / 2 - view.panX) / scale;
        let worldY = -(y - canvas.height / 2 - view.panY) / scale;
        
        return { x: worldX, y: worldY };
    }
}
