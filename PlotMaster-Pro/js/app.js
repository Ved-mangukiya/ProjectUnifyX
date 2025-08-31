class PlotMasterApp {
    constructor() {
        this.state = {
            currentTool: 'polygon',
            plotData: {
                coordinates: [],
                sideLengths: [],
                type: 'irregular',
                unit: 'meters'
            },
            view: {
                mode: '2d',
                zoom: 1,
                panX: 0,
                panY: 0,
                gridVisible: true
            },
            canvas: {
                element2D: null,
                ctx2D: null,
                element3D: null,
                scene3D: null,
                camera3D: null,
                renderer3D: null
            },
            results: null,
            history: [],
            historyIndex: -1
        };
        
        this.calculator = new PlotCalculator();
        this.renderer = new PlotRenderer();
        this.exporter = new PlotExporter();
        this.utils = new PlotUtils();
        
        this.lastCalculatedHash = '';
        this.init();
    }
    
    async init() {
        this.showLoading();
        
        await this.initializeCanvas();
        this.setupEventListeners();
        this.loadSettings();
        this.generateSideInputs();
        this.updateUI();
        
        this.hideLoading();
        this.showToast('PlotMaster Pro loaded successfully!', 'success');
    }
    
    async initializeCanvas() {
        // 2D Canvas
        this.state.canvas.element2D = document.getElementById('canvas2D');
        this.state.canvas.ctx2D = this.state.canvas.element2D.getContext('2d');
        
        // 3D Canvas (if Three.js is available)
        if (typeof THREE !== 'undefined') {
            this.init3DCanvas();
        }
        
        this.resizeCanvas();
        this.renderer.setCanvas(this.state.canvas.element2D, this.state.canvas.ctx2D);
        this.renderer.drawGrid();
    }
    
    init3DCanvas() {
        const canvas3D = document.getElementById('canvas3D');
        
        this.state.canvas.scene3D = new THREE.Scene();
        this.state.canvas.scene3D.background = new THREE.Color(0xf8fafc);
        
        this.state.canvas.camera3D = new THREE.PerspectiveCamera(
            75, canvas3D.clientWidth / canvas3D.clientHeight, 0.1, 1000
        );
        this.state.canvas.camera3D.position.set(30, 30, 30);
        
        this.state.canvas.renderer3D = new THREE.WebGLRenderer({ 
            canvas: canvas3D, 
            antialias: true 
        });
        this.state.canvas.renderer3D.setSize(canvas3D.clientWidth, canvas3D.clientHeight);
        this.state.canvas.renderer3D.shadowMap.enabled = true;
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.state.canvas.scene3D.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        this.state.canvas.scene3D.add(directionalLight);
        
        this.animate3D();
    }
    
    animate3D() {
        if (this.state.canvas.renderer3D && this.state.view.mode === '3d') {
            this.state.canvas.renderer3D.render(this.state.canvas.scene3D, this.state.canvas.camera3D);
        }
        requestAnimationFrame(() => this.animate3D());
    }
    
    setupEventListeners() {
        // Window events
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Header buttons
        document.getElementById('menuToggle').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveProject());
        document.getElementById('exportBtn').addEventListener('click', () => this.showExportModal());
        
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setTool(e.target.closest('.tool-btn').dataset.tool));
        });
        
        // Toolbar buttons
        document.getElementById('view2D').addEventListener('click', () => this.setViewMode('2d'));
        document.getElementById('view3D').addEventListener('click', () => this.setViewMode('3d'));
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        
        // Form inputs
        document.getElementById('numSides').addEventListener('change', () => this.generateSideInputs());
        document.getElementById('plotType').addEventListener('change', () => this.generateSideInputs());
        
        // Buttons
        document.getElementById('generateBtn').addEventListener('click', () => this.generateSideInputs());
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculatePlot());
        
        // Canvas events
        this.setupCanvasEvents();
        
        // Export buttons
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = e.target.dataset.format;
                this.exportPlot(format);
            });
        });
    }
    
    setupCanvasEvents() {
        const canvas = this.state.canvas.element2D;
        
        canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.handleCanvasWheel(e));
        
        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.handleCanvasTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.handleCanvasTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.handleCanvasTouchEnd(e), { passive: false });
    }
    
    handleCanvasMouseDown(e) {
        const rect = this.state.canvas.element2D.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.isDragging = true;
        this.lastX = x;
        this.lastY = y;
    }
    
    handleCanvasMouseMove(e) {
        const rect = this.state.canvas.element2D.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.updateCoordinateDisplay(x, y);
        
        if (this.isDragging) {
            const dx = x - this.lastX;
            const dy = y - this.lastY;
            this.state.view.panX += dx;
            this.state.view.panY += dy;
            this.lastX = x;
            this.lastY = y;
            this.updateVisualization();
        }
    }
    
    handleCanvasMouseUp(e) {
        this.isDragging = false;
    }
    
    handleCanvasWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(delta);
    }
    
    handleCanvasTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const rect = this.state.canvas.element2D.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handleCanvasTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handleCanvasTouchEnd(e) {
        e.preventDefault();
        this.handleCanvasMouseUp(e);
    }
    
    generateSideInputs() {
        const numSides = parseInt(document.getElementById('numSides').value);
        const plotType = document.getElementById('plotType').value;
        const container = document.getElementById('sideInputs');
        const section = document.getElementById('sidesSection');
        
        if (numSides < 3 || numSides > 20) {
            this.showToast('Please enter between 3-20 sides', 'warning');
            return;
        }
        
        section.style.display = 'block';
        container.innerHTML = '';
        
        this.state.plotData.sideLengths = new Array(numSides).fill(10);
        this.state.plotData.type = plotType;
        
        if (plotType === 'regular') {
            const input = this.createSideInput('Side Length', 0, 10);
            container.appendChild(input);
        } else if (plotType === 'rectangle') {
            const lengthInput = this.createSideInput('Length', 0, 20);
            const widthInput = this.createSideInput('Width', 1, 10);
            container.appendChild(lengthInput);
            container.appendChild(widthInput);
        } else if (plotType === 'circle') {
            const radiusInput = this.createSideInput('Radius', 0, 10);
            container.appendChild(radiusInput);
        } else {
            for (let i = 0; i < numSides; i++) {
                const input = this.createSideInput(`Side ${i + 1}`, i, 10);
                container.appendChild(input);
            }
        }
        
        this.saveState();
    }
    
    createSideInput(label, index, value) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
            <label for="side${index}">${label}</label>
            <input type="number" id="side${index}" class="form-input" 
                   value="${value}" min="0.1" step="0.1" 
                   onchange="app.updateSideLength(${index}, this.value)">
        `;
        return div;
    }
    
    updateSideLength(index, value) {
        const numValue = parseFloat(value) || 0.1;
        const plotType = this.state.plotData.type;
        
        if (plotType === 'regular') {
            const numSides = this.state.plotData.sideLengths.length;
            this.state.plotData.sideLengths = new Array(numSides).fill(numValue);
        } else if (plotType === 'rectangle') {
            if (index === 0) {
                this.state.plotData.sideLengths = [numValue, this.state.plotData.sideLengths[1], 
                                                  numValue, this.state.plotData.sideLengths[1]];
            } else {
                this.state.plotData.sideLengths = [this.state.plotData.sideLengths[0], numValue, 
                                                  this.state.plotData.sideLengths[0], numValue];
            }
        } else {
            this.state.plotData.sideLengths[index] = numValue;
        }
        
        this.saveState();
    }
    
    calculatePlot() {
        try {
            const currentHash = this.utils.hashObject({
                sideLengths: this.state.plotData.sideLengths,
                type: this.state.plotData.type,
                unit: this.state.plotData.unit
            });
            
            if (currentHash === this.lastCalculatedHash) {
                return;
            }
            
            this.lastCalculatedHash = currentHash;
            
            if (!this.validateInputs()) {
                return;
            }
            
            this.generateCoordinates();
            this.calculateProperties();
            this.updateVisualization();
            this.displayResults();
            this.saveState();
            
            this.showToast('Plot calculated successfully!', 'success');
            
        } catch (error) {
            console.error('Calculation error:', error);
            this.showToast('Error calculating plot. Please check inputs.', 'error');
        }
    }
    
    validateInputs() {
        const sides = this.state.plotData.sideLengths;
        
        if (sides.some(side => side <= 0)) {
            this.showToast('All side lengths must be positive', 'warning');
            return false;
        }
        
        if (this.state.plotData.type === 'irregular' && !this.calculator.checkTriangleInequality(sides)) {
            this.showToast('These side lengths cannot form a valid polygon', 'error');
            return false;
        }
        
        return true;
    }
    
    generateCoordinates() {
        const type = this.state.plotData.type;
        const sides = this.state.plotData.sideLengths;
        
        switch (type) {
            case 'regular':
                this.state.plotData.coordinates = this.calculator.generateRegularPolygon(sides[0], sides.length);
                break;
            case 'rectangle':
                this.state.plotData.coordinates = this.calculator.generateRectangle(sides[0], sides[1]);
                break;
            case 'circle':
                this.state.plotData.coordinates = this.calculator.generateCircle(sides[0], sides.length);
                break;
            default:
                this.state.plotData.coordinates = this.calculator.generateIrregularPolygon(sides);
        }
    }
    
    calculateProperties() {
        const coords = this.state.plotData.coordinates;
        
        this.state.results = {
            area: this.calculator.calculateAreaShoelace(coords),
            perimeter: this.calculator.calculatePerimeter(this.state.plotData.sideLengths),
            centroid: this.calculator.calculateCentroid(coords),
            bounds: this.calculator.calculateBounds(coords),
            unit: this.state.plotData.unit
        };
    }
    
    updateVisualization() {
        if (this.state.view.mode === '2d') {
            this.render2D();
        } else if (this.state.view.mode === '3d' && this.state.canvas.renderer3D) {
            this.render3D();
        }
    }
    
    render2D() {
        this.renderer.clear();
        
        if (this.state.view.gridVisible) {
            this.renderer.drawGrid();
        }
        
        if (this.state.plotData.coordinates.length > 0) {
            this.renderer.drawPlot(
                this.state.plotData.coordinates,
                this.state.plotData.sideLengths,
                this.state.view
            );
        }
    }
    
    render3D() {
        if (!this.state.canvas.scene3D) return;
        
        const existingPlot = this.state.canvas.scene3D.getObjectByName('plot');
        if (existingPlot) {
            this.state.canvas.scene3D.remove(existingPlot);
        }
        
        if (this.state.plotData.coordinates.length > 0) {
            const plot3D = this.renderer.create3DPlot(this.state.plotData.coordinates);
            plot3D.name = 'plot';
            this.state.canvas.scene3D.add(plot3D);
        }
    }
    
    displayResults() {
        const resultsGrid = document.getElementById('resultsGrid');
        const results = this.state.results;
        
        if (!results) return;
        
        const resultCards = [
            { label: 'Area', value: `${results.area.toFixed(4)} ${results.unit}²` },
            { label: 'Perimeter', value: `${results.perimeter.toFixed(4)} ${results.unit}` },
            { label: 'Vertices', value: this.state.plotData.coordinates.length },
            { label: 'Type', value: this.state.plotData.type.charAt(0).toUpperCase() + this.state.plotData.type.slice(1) }
        ];
        
        // Add unit conversions
        const conversions = this.calculator.getAreaConversions(results.area, results.unit);
        Object.entries(conversions).forEach(([unit, value]) => {
            resultCards.push({ label: unit, value: value.toFixed(4) });
        });
        
        resultsGrid.innerHTML = resultCards.map(card => `
            <div class="result-card">
                <div class="result-value">${card.value}</div>
                <div class="result-label">${card.label}</div>
            </div>
        `).join('');
        
        document.getElementById('resultsPanel').classList.remove('collapsed');
    }
    
    setTool(tool) {
        this.state.currentTool = tool;
        
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        
        if (tool === '3d') {
            this.setViewMode('3d');
        }
        
        this.showToast(`${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected`, 'info');
    }
    
    setViewMode(mode) {
        this.state.view.mode = mode;
        
        document.getElementById('view2D').classList.toggle('active', mode === '2d');
        document.getElementById('view3D').classList.toggle('active', mode === '3d');
        
        document.getElementById('canvas2D').style.display = mode === '2d' ? 'block' : 'none';
        document.getElementById('canvas3D').style.display = mode === '3d' ? 'block' : 'none';
        
        this.updateVisualization();
    }
    
    zoom(factor) {
        this.state.view.zoom = Math.max(0.1, Math.min(10, this.state.view.zoom * factor));
        this.updateVisualization();
    }
    
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('open');
    }
    
    saveProject() {
        const projectData = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            state: this.state
        };
        
        this.utils.downloadJSON(projectData, `plotmaster_project_${Date.now()}.json`);
        this.showToast('Project saved successfully!', 'success');
    }
    
    exportPlot(format) {
        if (!this.state.results) {
            this.showToast('Please calculate a plot first', 'warning');
            return;
        }
        
        switch (format) {
            case 'pdf':
                this.exporter.exportToPDF(this.state, this.state.canvas.element2D);
                break;
            case 'image':
                this.exporter.exportToImage(this.state.canvas.element2D);
                break;
            case 'excel':
                this.exporter.exportToExcel(this.state);
                break;
        }
        
        this.showToast(`Exported as ${format.toUpperCase()}`, 'success');
    }
    
    resizeCanvas() {
        const canvas2D = this.state.canvas.element2D;
        const container = document.getElementById('canvasContainer');
        
        if (canvas2D && container) {
            canvas2D.width = container.clientWidth;
            canvas2D.height = container.clientHeight;
            this.updateVisualization();
        }
    }
    
    updateCoordinateDisplay(x, y) {
        const worldCoords = this.renderer.screenToWorld(x, y, this.state.view);
        document.getElementById('coordsDisplay').textContent = 
            `X: ${worldCoords.x.toFixed(2)}, Y: ${worldCoords.y.toFixed(2)}`;
    }
    
    updateUI() {
        document.getElementById('numSides').value = this.state.plotData.coordinates.length || 4;
        document.getElementById('unitSystem').value = this.state.plotData.unit;
        document.getElementById('plotType').value = this.state.plotData.type;
    }
    
    saveState() {
        const stateSnapshot = JSON.parse(JSON.stringify({
            plotData: this.state.plotData,
            results: this.state.results,
            view: this.state.view
        }));
        
        this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        this.state.history.push(stateSnapshot);
        this.state.historyIndex++;
        
        if (this.state.history.length > 50) {
            this.state.history.shift();
            this.state.historyIndex--;
        }
        
        this.saveSettings();
    }
    
    loadSettings() {
        const settings = this.utils.loadFromStorage('plotmaster-pro-settings');
        if (settings) {
            this.state = { ...this.state, ...settings };
        }
    }
    
    saveSettings() {
        const settings = {
            plotData: this.state.plotData,
            view: this.state.view,
            currentTool: this.state.currentTool
        };
        this.utils.saveToStorage('plotmaster-pro-settings', settings);
    }
    
    showExportModal() {
        this.showToast('Export functionality ready! Use the export buttons in results panel.', 'info');
    }
    
    showLoading() {
        document.getElementById('loadingScreen').classList.remove('hidden');
    }
    
    hideLoading() {
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
        }, 1000);
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        const icons = {
            success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'
        };
        
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type] || icons.info}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PlotMasterApp();
    window.app = app; // Make available globally for HTML onclick events
});
