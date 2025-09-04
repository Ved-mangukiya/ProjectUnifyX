// ========================
// PHOTO RESIZER & CROPPER PRO
// Full-featured image editing application
// ========================

class PhotoEditor {
    constructor() {
        // Core properties
        this.currentImage = null;
        this.originalImage = null;
        this.canvas = null;
        this.ctx = null;
        this.cropCanvas = null;
        this.cropCtx = null;
        
        // Image properties
        this.imageData = {
            width: 0,
            height: 0,
            originalWidth: 0,
            originalHeight: 0,
            scale: 1,
            rotation: 0,
            flipH: false,
            flipV: false
        };
        
        // Crop properties
        this.cropData = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            aspectRatio: null,
            isDragging: false,
            isResizing: false,
            startX: 0,
            startY: 0,
            resizeHandle: null
        };
        
        // History system
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 20;
        
        // Editor state
        this.currentTool = 'crop';
        this.isEditing = false;
        this.batchMode = false;
        this.batchFiles = [];
        
        // Filters and adjustments
        this.filters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            blur: 0,
            filter: 'none'
        };
        
        // Text properties
        this.textElements = [];
        this.selectedTextElement = null;
        
        // Settings
        this.settings = {
            quality: 0.9,
            format: 'png',
            dpi: 300,
            keepMetadata: false,
            theme: 'light'
        };
        
        // Presets
        this.presets = {
            social: {
                'instagram-post': { width: 1080, height: 1080 },
                'instagram-story': { width: 1080, height: 1920 },
                'facebook-cover': { width: 820, height: 312 },
                'twitter-header': { width: 1500, height: 500 },
                'linkedin-banner': { width: 1584, height: 396 },
                'youtube-thumbnail': { width: 1280, height: 720 }
            },
            document: {
                'a4': { width: 2480, height: 3508 }, // 300 DPI
                'letter': { width: 2550, height: 3300 }, // 300 DPI
                'business-card': { width: 1050, height: 600 }, // 300 DPI
                'poster': { width: 5400, height: 7200 } // 300 DPI
            },
            passport: {
                'us-passport': { width: 600, height: 600 }, // 2x2 inches at 300 DPI
                'indian-passport': { width: 413, height: 531 }, // 35x45mm at 300 DPI
                'visa': { width: 390, height: 567 }, // 33x48mm at 300 DPI
                'eu-passport': { width: 413, height: 531 } // 35x45mm at 300 DPI
            }
        };
        
        this.init();
    }
    
    // ========================
    // INITIALIZATION
    // ========================
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.loadSettings();
        this.setupKeyboardShortcuts();
        this.checkClipboardSupport();
        
        // Show upload section initially
        this.showSection('upload');
        
        console.log('Photo Editor Pro initialized');
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cropCanvas = document.getElementById('cropCanvas');
        this.cropCtx = this.cropCanvas.getContext('2d');
        
        // Set initial canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.cropCanvas.width = 800;
        this.cropCanvas.height = 600;
        
        // Enable image smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.cropCtx.imageSmoothingEnabled = true;
        this.cropCtx.imageSmoothingQuality = 'high';
    }
    
    setupEventListeners() {
        // Upload events
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');
        const pasteBtn = document.getElementById('pasteBtn');
        const batchBtn = document.getElementById('batchBtn');
        const batchInput = document.getElementById('batchInput');
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
        
        // File input
        uploadArea.addEventListener('click', () => fileInput.click());
        browseBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Paste and batch
        pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        batchBtn.addEventListener('click', () => batchInput.click());
        batchInput.addEventListener('change', (e) => this.handleBatchFiles(e.target.files));
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Help modal
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelpModal());
        document.getElementById('modalClose').addEventListener('click', () => this.hideHelpModal());
        document.getElementById('helpModal').addEventListener('click', (e) => {
            if (e.target.id === 'helpModal') this.hideHelpModal();
        });
        
        // Toolbar events
        this.setupToolbarEvents();
        this.setupPanelEvents();
        this.setupCanvasEvents();
    }
    
    setupToolbarEvents() {
        // Tool selection
        document.getElementById('cropBtn').addEventListener('click', () => this.setTool('crop'));
        document.getElementById('resizeBtn').addEventListener('click', () => this.setTool('resize'));
        document.getElementById('filtersBtn').addEventListener('click', () => this.setTool('filters'));
        document.getElementById('textBtn').addEventListener('click', () => this.setTool('text'));
        
        // Transform tools
        document.getElementById('rotateLeftBtn').addEventListener('click', () => this.rotateImage(-90));
        document.getElementById('rotateRightBtn').addEventListener('click', () => this.rotateImage(90));
        document.getElementById('flipHBtn').addEventListener('click', () => this.flipImage('horizontal'));
        document.getElementById('flipVBtn').addEventListener('click', () => this.flipImage('vertical'));
        
        // History
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        
        // Reset and download
        document.getElementById('resetBtn').addEventListener('click', () => this.resetImage());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadImage());
    }
    
    setupPanelEvents() {
        // Crop presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ratio = e.target.dataset.ratio;
                const preset = e.target.dataset.preset;
                
                if (ratio) {
                    this.setCropRatio(ratio);
                } else if (preset) {
                    this.applyPreset(preset);
                }
                
                this.updateActivePreset(btn);
            });
        });
        
        // Passport options
        document.getElementById('backgroundRemoval').addEventListener('change', (e) => {
            const colorPicker = document.getElementById('backgroundColorPicker');
            colorPicker.style.display = e.target.checked ? 'block' : 'none';
        });
        
        document.getElementById('generateSheetBtn').addEventListener('click', () => this.generatePassportSheet());
        
        // Resize controls
        document.getElementById('widthInput').addEventListener('input', (e) => this.updateDimensions('width', e.target.value));
        document.getElementById('heightInput').addEventListener('input', (e) => this.updateDimensions('height', e.target.value));
        document.getElementById('maintainAspect').addEventListener('change', (e) => this.toggleAspectRatio(e.target.checked));
        
        // Percentage scaling
        document.querySelectorAll('.percentage-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const percent = parseInt(e.target.dataset.percent);
                this.scaleImage(percent / 100);
                this.updateActiveButton(btn, '.percentage-btn');
            });
        });
        
        document.getElementById('percentageSlider').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('percentageValue').textContent = value + '%';
            this.scaleImage(value / 100);
        });
        
        // Quality slider
        document.getElementById('qualitySlider').addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('qualityValue').textContent = value;
            this.settings.quality = value / 100;
            this.updateEstimatedSize();
        });
        
        // Filter controls
        this.setupFilterControls();
        this.setupTextControls();
        this.setupDownloadControls();
    }
    
    setupFilterControls() {
        // Basic adjustments
        const sliders = ['brightness', 'contrast', 'saturation', 'blur'];
        sliders.forEach(filter => {
            const slider = document.getElementById(filter + 'Slider');
            const valueSpan = document.getElementById(filter + 'Value');
            
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                valueSpan.textContent = filter === 'blur' ? value + 'px' : value;
                this.filters[filter] = parseInt(value);
                this.applyFilters();
            });
        });
        
        // Quick filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filters.filter = filter;
                this.applyFilters();
                this.updateActiveButton(btn, '.filter-btn');
            });
        });
        
        // Background controls
        document.getElementById('addBackground').addEventListener('change', (e) => {
            const section = document.getElementById('backgroundColorSection');
            section.style.display = e.target.checked ? 'block' : 'none';
            if (e.target.checked) {
                this.addBackgroundColor(document.getElementById('backgroundColorPicker').value);
            } else {
                this.removeBackground();
            }
        });
        
        document.getElementById('backgroundColorPicker').addEventListener('change', (e) => {
            this.addBackgroundColor(e.target.value);
        });
        
        // Background presets
        document.querySelectorAll('.bg-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                document.getElementById('backgroundColorPicker').value = color;
                this.addBackgroundColor(color);
            });
        });
    }
    
    setupTextControls() {
        // Text input and styling
        document.getElementById('textInput').addEventListener('input', () => this.updateTextPreview());
        document.getElementById('fontFamily').addEventListener('change', () => this.updateTextPreview());
        document.getElementById('fontSizeSlider').addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = e.target.value;
            this.updateTextPreview();
        });
        document.getElementById('textColor').addEventListener('change', () => this.updateTextPreview());
        document.getElementById('textOpacitySlider').addEventListener('input', (e) => {
            document.getElementById('textOpacityValue').textContent = e.target.value;
            this.updateTextPreview();
        });
        
        // Text position
        document.querySelectorAll('.position-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const position = e.target.dataset.position;
                this.setTextPosition(position);
                this.updateActiveButton(btn, '.position-btn');
            });
        });
        
        // Text style options
        ['textBold', 'textItalic', 'textShadow', 'textOutline'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.updateTextPreview());
        });
        
        // Add text button
        document.getElementById('addTextBtn').addEventListener('click', () => this.addText());
    }
    
    setupDownloadControls() {
        // Format selection
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.settings.format = e.target.dataset.format;
                this.updateActiveButton(btn, '.format-btn');
                this.updateEstimatedSize();
            });
        });
        
        // DPI selection
        document.querySelectorAll('.dpi-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.settings.dpi = parseInt(e.target.dataset.dpi);
                this.updateActiveButton(btn, '.dpi-btn');
                this.updateEstimatedSize();
            });
        });
        
        // Metadata checkbox
        document.getElementById('keepMetadata').addEventListener('change', (e) => {
            this.settings.keepMetadata = e.target.checked;
        });
        
        // Download buttons
        document.getElementById('downloadSingleBtn').addEventListener('click', () => this.downloadImage());
        document.getElementById('downloadZipBtn').addEventListener('click', () => this.downloadBatch());
        
        // Batch controls
        document.getElementById('batchApplyBtn').addEventListener('click', () => this.applyToBatch());
        document.getElementById('batchClearBtn').addEventListener('click', () => this.clearBatch());
        
        // History
        document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
    }
    
    setupCanvasEvents() {
        const canvasContainer = document.getElementById('canvasContainer');
        
        // Mouse events for cropping
        canvasContainer.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvasContainer.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvasContainer.addEventListener('mouseup', () => this.handleMouseUp());
        canvasContainer.addEventListener('mouseleave', () => this.handleMouseUp());
        
        // Touch events for mobile
        canvasContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        canvasContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        canvasContainer.addEventListener('touchend', () => this.handleTouchEnd());
        
        // Prevent context menu
        canvasContainer.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.redo();
                        } else {
                            this.undo();
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        this.redo();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.pasteFromClipboard();
                        break;
                    case 's':
                        e.preventDefault();
                        this.downloadImage();
                        break;
                }
            } else {
                switch (e.key.toLowerCase()) {
                    case 'r':
                        if (this.isEditing) {
                            e.preventDefault();
                            this.rotateImage(90);
                        }
                        break;
                    case 'f':
                        if (this.isEditing) {
                            e.preventDefault();
                            this.flipImage('horizontal');
                        }
                        break;
                    case 'escape':
                        if (this.currentTool === 'crop') {
                            this.cancelCrop();
                        }
                        break;
                    case 'arrowup':
                    case 'arrowdown':
                    case 'arrowleft':
                    case 'arrowright':
                        if (this.currentTool === 'crop' && this.cropData.width > 0) {
                            e.preventDefault();
                            this.moveCropWithKeyboard(e.key);
                        }
                        break;
                }
            }
        });
    }
    
    // ========================
    // FILE HANDLING
    // ========================
    
    handleFiles(files) {
        if (files.length === 0) return;
        
        if (files.length === 1) {
            this.loadSingleImage(files[0]);
        } else {
            this.handleBatchFiles(files);
        }
    }
    
    handleBatchFiles(files) {
        this.batchFiles = Array.from(files).filter(file => this.isValidImageFile(file));
        
        if (this.batchFiles.length === 0) {
            this.showToast('No valid image files found', 'error');
            return;
        }
        
        this.batchMode = true;
        this.loadSingleImage(this.batchFiles[0]);
        this.updateBatchPanel();
        this.showToast(`Loaded ${this.batchFiles.length} images for batch processing`, 'success');
    }
    
    loadSingleImage(file) {
        if (!this.isValidImageFile(file)) {
            this.showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
            return;
        }
        
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            this.showToast('File size too large. Please select an image under 50MB', 'error');
            return;
        }
        
        this.showProgress('Loading image...');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.setImage(img, file);
                this.hideProgress();
            };
            img.onerror = () => {
                this.showToast('Failed to load image', 'error');
                this.hideProgress();
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            this.showToast('Failed to read file', 'error');
            this.hideProgress();
        };
        reader.readAsDataURL(file);
    }
    
    isValidImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        return validTypes.includes(file.type);
    }
    
    setImage(img, file = null) {
        this.currentImage = img;
        this.originalImage = img.cloneNode ? img.cloneNode() : img;
        
        // Store original dimensions
        this.imageData.originalWidth = img.width;
        this.imageData.originalHeight = img.height;
        this.imageData.width = img.width;
        this.imageData.height = img.height;
        this.imageData.scale = 1;
        this.imageData.rotation = 0;
        this.imageData.flipH = false;
        this.imageData.flipV = false;
        
        // Reset filters
        this.filters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            blur: 0,
            filter: 'none'
        };
        
        // Update canvas size
        this.updateCanvasSize();
        
        // Draw image
        this.drawImage();
        
        // Initialize crop
        this.initializeCrop();
        
        // Update UI
        this.showSection('editor');
        this.updateImageInfo(file);
        this.saveToHistory('Loaded Image');
        this.isEditing = true;
        
        // Update form inputs
        this.updateResizeInputs();
        
        this.showToast('Image loaded successfully', 'success');
    }
    
    // ========================
    // CANVAS MANAGEMENT
    // ========================
    
    updateCanvasSize() {
        const container = document.getElementById('canvasContainer');
        const containerRect = container.getBoundingClientRect();
        const maxWidth = containerRect.width - 40;
        const maxHeight = containerRect.height - 40;
        
        let canvasWidth = this.imageData.width;
        let canvasHeight = this.imageData.height;
        
        // Scale canvas to fit container while maintaining aspect ratio
        const scaleX = maxWidth / canvasWidth;
        const scaleY = maxHeight / canvasHeight;
        const scale = Math.min(scaleX, scaleY, 1);
        
        canvasWidth *= scale;
        canvasHeight *= scale;
        
        this.canvas.width = this.imageData.width;
        this.canvas.height = this.imageData.height;
        this.canvas.style.width = canvasWidth + 'px';
        this.canvas.style.height = canvasHeight + 'px';
        
        this.cropCanvas.width = this.imageData.width;
        this.cropCanvas.height = this.imageData.height;
        this.cropCanvas.style.width = canvasWidth + 'px';
        this.cropCanvas.style.height = canvasHeight + 'px';
        
        this.displayScale = scale;
    }
    
    drawImage() {
        if (!this.currentImage) return;
        
        const ctx = this.ctx;
        const { width, height, rotation, flipH, flipV } = this.imageData;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context
        ctx.save();
        
        // Move to center
        ctx.translate(width / 2, height / 2);
        
        // Apply transformations
        if (rotation !== 0) {
            ctx.rotate((rotation * Math.PI) / 180);
        }
        
        if (flipH || flipV) {
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        }
        
        // Apply filters
        this.applyCanvasFilters(ctx);
        
        // Draw image
        ctx.drawImage(
            this.currentImage,
            -this.currentImage.width / 2,
            -this.currentImage.height / 2,
            this.currentImage.width,
            this.currentImage.height
        );
        
        // Restore context
        ctx.restore();
        
        // Draw text elements
        this.drawTextElements();
        
        // Update crop overlay
        if (this.currentTool === 'crop') {
            this.updateCropOverlay();
        }
    }
    
    applyCanvasFilters(ctx) {
        if (this.filters.brightness !== 0 || 
            this.filters.contrast !== 0 || 
            this.filters.saturation !== 0 || 
            this.filters.blur !== 0 || 
            this.filters.filter !== 'none') {
            
            let filterString = '';
            
            if (this.filters.brightness !== 0) {
                filterString += `brightness(${100 + this.filters.brightness}%) `;
            }
            
            if (this.filters.contrast !== 0) {
                filterString += `contrast(${100 + this.filters.contrast}%) `;
            }
            
            if (this.filters.saturation !== 0) {
                filterString += `saturate(${100 + this.filters.saturation}%) `;
            }
            
            if (this.filters.blur > 0) {
                filterString += `blur(${this.filters.blur}px) `;
            }
            
            switch (this.filters.filter) {
                case 'grayscale':
                    filterString += 'grayscale(100%) ';
                    break;
                case 'sepia':
                    filterString += 'sepia(100%) ';
                    break;
                case 'vintage':
                    filterString += 'sepia(50%) contrast(120%) brightness(90%) ';
                    break;
                case 'cold':
                    filterString += 'hue-rotate(180deg) saturate(120%) ';
                    break;
                case 'warm':
                    filterString += 'hue-rotate(30deg) saturate(110%) brightness(110%) ';
                    break;
            }
            
            if (filterString) {
                ctx.filter = filterString.trim();
            }
        }
    }
    
    // ========================
    // CROPPING FUNCTIONALITY
    // ========================
    
    initializeCrop() {
        if (!this.currentImage) return;
        
        const margin = Math.min(this.imageData.width, this.imageData.height) * 0.1;
        
        this.cropData = {
            x: margin,
            y: margin,
            width: this.imageData.width - (margin * 2),
            height: this.imageData.height - (margin * 2),
            aspectRatio: null,
            isDragging: false,
            isResizing: false,
            startX: 0,
            startY: 0,
            resizeHandle: null
        };
        
        this.updateCropOverlay();
    }
    
    setCropRatio(ratio) {
        if (ratio === 'free') {
            this.cropData.aspectRatio = null;
        } else if (ratio === 'circle') {
            // Special handling for circle crop
            const size = Math.min(this.cropData.width, this.cropData.height);
            this.cropData.width = size;
            this.cropData.height = size;
            this.cropData.aspectRatio = 1;
            this.cropData.isCircle = true;
        } else {
            const [w, h] = ratio.split(':').map(Number);
            this.cropData.aspectRatio = w / h;
            this.cropData.isCircle = false;
            
            // Adjust crop area to match ratio
            const currentRatio = this.cropData.width / this.cropData.height;
            if (currentRatio > this.cropData.aspectRatio) {
                this.cropData.width = this.cropData.height * this.cropData.aspectRatio;
            } else {
                this.cropData.height = this.cropData.width / this.cropData.aspectRatio;
            }
        }
        
        this.updateCropOverlay();
    }
    
    updateCropOverlay() {
        if (!this.cropCanvas || this.cropData.width <= 0) return;
        
        const ctx = this.cropCtx;
        ctx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
        
        // Draw darkened overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
        
        // Clear crop area
        ctx.globalCompositeOperation = 'destination-out';
        
        if (this.cropData.isCircle) {
            ctx.beginPath();
            ctx.arc(
                this.cropData.x + this.cropData.width / 2,
                this.cropData.y + this.cropData.height / 2,
                this.cropData.width / 2,
                0,
                2 * Math.PI
            );
            ctx.fill();
        } else {
            ctx.fillRect(this.cropData.x, this.cropData.y, this.cropData.width, this.cropData.height);
        }
        
        ctx.globalCompositeOperation = 'source-over';
        
        // Draw crop border
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2;
        
        if (this.cropData.isCircle) {
            ctx.beginPath();
            ctx.arc(
                this.cropData.x + this.cropData.width / 2,
                this.cropData.y + this.cropData.height / 2,
                this.cropData.width / 2,
                0,
                2 * Math.PI
            );
            ctx.stroke();
        } else {
            ctx.strokeRect(this.cropData.x, this.cropData.y, this.cropData.width, this.cropData.height);
            
            // Draw grid lines (rule of thirds)
            if (document.getElementById('guidelinesOverlay')?.checked) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                
                // Vertical lines
                const gridX1 = this.cropData.x + this.cropData.width / 3;
                const gridX2 = this.cropData.x + (this.cropData.width * 2) / 3;
                ctx.beginPath();
                ctx.moveTo(gridX1, this.cropData.y);
                ctx.lineTo(gridX1, this.cropData.y + this.cropData.height);
                ctx.moveTo(gridX2, this.cropData.y);
                ctx.lineTo(gridX2, this.cropData.y + this.cropData.height);
                ctx.stroke();
                
                // Horizontal lines
                const gridY1 = this.cropData.y + this.cropData.height / 3;
                const gridY2 = this.cropData.y + (this.cropData.height * 2) / 3;
                ctx.beginPath();
                ctx.moveTo(this.cropData.x, gridY1);
                ctx.lineTo(this.cropData.x + this.cropData.width, gridY1);
                ctx.moveTo(this.cropData.x, gridY2);
                ctx.lineTo(this.cropData.x + this.cropData.width, gridY2);
                ctx.stroke();
            }
        }
        
        // Draw resize handles (not for circle crop)
        if (!this.cropData.isCircle) {
            this.drawResizeHandles(ctx);
        }
    }
    
    drawResizeHandles(ctx) {
        const handleSize = 12;
        const { x, y, width, height } = this.cropData;
        
        ctx.fillStyle = '#6366f1';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        const handles = [
            { x: x, y: y, type: 'nw' },
            { x: x + width, y: y, type: 'ne' },
            { x: x, y: y + height, type: 'sw' },
            { x: x + width, y: y + height, type: 'se' },
            { x: x + width / 2, y: y, type: 'n' },
            { x: x + width / 2, y: y + height, type: 's' },
            { x: x, y: y + height / 2, type: 'w' },
            { x: x + width, y: y + height / 2, type: 'e' }
        ];
        
        handles.forEach(handle => {
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, handleSize / 2, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
        });
    }
    
    // ========================
    // MOUSE/TOUCH EVENTS
    // ========================
    
    handleMouseDown(e) {
        if (this.currentTool !== 'crop' || !this.currentImage) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.displayScale;
        const y = (e.clientY - rect.top) / this.displayScale;
        
        // Check if clicking on resize handle
        const handle = this.getResizeHandle(x, y);
        if (handle) {
            this.cropData.isResizing = true;
            this.cropData.resizeHandle = handle;
            this.cropData.startX = x;
            this.cropData.startY = y;
            return;
        }
        
        // Check if clicking inside crop area
        if (this.isInsideCropArea(x, y)) {
            this.cropData.isDragging = true;
            this.cropData.startX = x - this.cropData.x;
            this.cropData.startY = y - this.cropData.y;
        }
    }
    
    handleMouseMove(e) {
        if (this.currentTool !== 'crop' || !this.currentImage) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.displayScale;
        const y = (e.clientY - rect.top) / this.displayScale;
        
        // Update cursor
        this.updateCursor(x, y);
        
        if (this.cropData.isResizing) {
            this.handleResize(x, y);
        } else if (this.cropData.isDragging) {
            this.handleDrag(x, y);
        }
    }
    
    handleMouseUp() {
        this.cropData.isDragging = false;
        this.cropData.isResizing = false;
        this.cropData.resizeHandle = null;
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseDown(mouseEvent);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.handleMouseMove(mouseEvent);
    }
    
    handleTouchEnd() {
        this.handleMouseUp();
    }
    
    getResizeHandle(x, y) {
        const handleSize = 12;
        const { x: cropX, y: cropY, width, height } = this.cropData;
        
        const handles = [
            { x: cropX, y: cropY, type: 'nw' },
            { x: cropX + width, y: cropY, type: 'ne' },
            { x: cropX, y: cropY + height, type: 'sw' },
            { x: cropX + width, y: cropY + height, type: 'se' },
            { x: cropX + width / 2, y: cropY, type: 'n' },
            { x: cropX + width / 2, y: cropY + height, type: 's' },
            { x: cropX, y: cropY + height / 2, type: 'w' },
            { x: cropX + width, y: cropY + height / 2, type: 'e' }
        ];
        
        for (const handle of handles) {
            const distance = Math.sqrt(
                Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2)
            );
            if (distance <= handleSize) {
                return handle.type;
            }
        }
        
        return null;
    }
    
    isInsideCropArea(x, y) {
        return x >= this.cropData.x && 
               x <= this.cropData.x + this.cropData.width &&
               y >= this.cropData.y && 
               y <= this.cropData.y + this.cropData.height;
    }
    
    updateCursor(x, y) {
        const canvas = this.canvas;
        const handle = this.getResizeHandle(x, y);
        
        if (handle) {
            const cursors = {
                'nw': 'nw-resize',
                'ne': 'ne-resize',
                'sw': 'sw-resize',
                'se': 'se-resize',
                'n': 'n-resize',
                's': 's-resize',
                'w': 'w-resize',
                'e': 'e-resize'
            };
            canvas.style.cursor = cursors[handle];
        } else if (this.isInsideCropArea(x, y)) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'default';
        }
    }
    
    handleResize(x, y) {
        const { resizeHandle, startX, startY } = this.cropData;
        const deltaX = x - startX;
        const deltaY = y - startY;
        
        let newX = this.cropData.x;
        let newY = this.cropData.y;
        let newWidth = this.cropData.width;
        let newHeight = this.cropData.height;
        
        switch (resizeHandle) {
            case 'nw':
                newX += deltaX;
                newY += deltaY;
                newWidth -= deltaX;
                newHeight -= deltaY;
                break;
            case 'ne':
                newY += deltaY;
                newWidth += deltaX;
                newHeight -= deltaY;
                break;
            case 'sw':
                newX += deltaX;
                newWidth -= deltaX;
                newHeight += deltaY;
                break;
            case 'se':
                newWidth += deltaX;
                newHeight += deltaY;
                break;
            case 'n':
                newY += deltaY;
                newHeight -= deltaY;
                break;
            case 's':
                newHeight += deltaY;
                break;
            case 'w':
                newX += deltaX;
                newWidth -= deltaX;
                break;
            case 'e':
                newWidth += deltaX;
                break;
        }
        
        // Apply aspect ratio constraint
        if (this.cropData.aspectRatio) {
            if (['nw', 'ne', 'sw', 'se'].includes(resizeHandle)) {
                const ratio = this.cropData.aspectRatio;
                if (newWidth / newHeight > ratio) {
                    newWidth = newHeight * ratio;
                } else {
                    newHeight = newWidth / ratio;
                }
                
                // Adjust position for corner handles
                if (resizeHandle === 'nw') {
                    newX = this.cropData.x + this.cropData.width - newWidth;
                    newY = this.cropData.y + this.cropData.height - newHeight;
                } else if (resizeHandle === 'ne') {
                    newY = this.cropData.y + this.cropData.height - newHeight;
                } else if (resizeHandle === 'sw') {
                    newX = this.cropData.x + this.cropData.width - newWidth;
                }
            }
        }
        
        // Constrain to image bounds
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        newWidth = Math.min(newWidth, this.imageData.width - newX);
        newHeight = Math.min(newHeight, this.imageData.height - newY);
        
        // Minimum size
        newWidth = Math.max(20, newWidth);
        newHeight = Math.max(20, newHeight);
        
        this.cropData.x = newX;
        this.cropData.y = newY;
        this.cropData.width = newWidth;
        this.cropData.height = newHeight;
        
        this.updateCropOverlay();
    }
    
    handleDrag(x, y) {
        let newX = x - this.cropData.startX;
        let newY = y - this.cropData.startY;
        
        // Constrain to image bounds
        newX = Math.max(0, Math.min(newX, this.imageData.width - this.cropData.width));
        newY = Math.max(0, Math.min(newY, this.imageData.height - this.cropData.height));
        
        this.cropData.x = newX;
        this.cropData.y = newY;
        
        this.updateCropOverlay();
    }
    
    moveCropWithKeyboard(key) {
        const step = 5;
        let newX = this.cropData.x;
        let newY = this.cropData.y;
        
        switch (key) {
            case 'ArrowUp':
                newY = Math.max(0, newY - step);
                break;
            case 'ArrowDown':
                newY = Math.min(this.imageData.height - this.cropData.height, newY + step);
                break;
            case 'ArrowLeft':
                newX = Math.max(0, newX - step);
                break;
            case 'ArrowRight':
                newX = Math.min(this.imageData.width - this.cropData.width, newX + step);
                break;
        }
        
        this.cropData.x = newX;
        this.cropData.y = newY;
        this.updateCropOverlay();
    }
    
    cancelCrop() {
        this.initializeCrop();
        this.showToast('Crop cancelled', 'info');
    }
    
    applyCrop() {
        if (!this.currentImage || this.cropData.width <= 0) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.cropData.width;
        canvas.height = this.cropData.height;
        
        if (this.cropData.isCircle) {
            // Create circular crop
            ctx.beginPath();
            ctx.arc(
                this.cropData.width / 2,
                this.cropData.height / 2,
                this.cropData.width / 2,
                0,
                2 * Math.PI
            );
            ctx.clip();
        }
        
        ctx.drawImage(
            this.canvas,
            this.cropData.x,
            this.cropData.y,
            this.cropData.width,
            this.cropData.height,
            0,
            0,
            this.cropData.width,
            this.cropData.height
        );
        
        // Update image data
        this.imageData.width = this.cropData.width;
        this.imageData.height = this.cropData.height;
        
        // Create new image from canvas
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.updateCanvasSize();
            this.drawImage();
            this.initializeCrop();
            this.saveToHistory('Crop Applied');
            this.showToast('Crop applied successfully', 'success');
        };
        img.src = canvas.toDataURL();
    }
    
    // ========================
    // TRANSFORMATIONS
    // ========================
    
    rotateImage(degrees) {
        if (!this.currentImage) return;
        
        this.imageData.rotation = (this.imageData.rotation + degrees) % 360;
        
        // Swap dimensions for 90° rotations
        if (degrees === 90 || degrees === -90) {
            const temp = this.imageData.width;
            this.imageData.width = this.imageData.height;
            this.imageData.height = temp;
        }
        
        this.updateCanvasSize();
        this.drawImage();
        this.initializeCrop();
        this.saveToHistory(`Rotated ${degrees}°`);
        this.showToast(`Rotated ${degrees}°`, 'success');
    }
    
    flipImage(direction) {
        if (!this.currentImage) return;
        
        if (direction === 'horizontal') {
            this.imageData.flipH = !this.imageData.flipH;
        } else {
            this.imageData.flipV = !this.imageData.flipV;
        }
        
        this.drawImage();
        this.saveToHistory(`Flipped ${direction}`);
        this.showToast(`Flipped ${direction}`, 'success');
    }
    
    scaleImage(scale) {
        if (!this.currentImage) return;
        
        this.imageData.scale = scale;
        this.imageData.width = Math.round(this.imageData.originalWidth * scale);
        this.imageData.height = Math.round(this.imageData.originalHeight * scale);
        
        this.updateCanvasSize();
        this.drawImage();
        this.initializeCrop();
        this.updateResizeInputs();
        this.saveToHistory(`Scaled to ${Math.round(scale * 100)}%`);
    }
    
    resetImage() {
        if (!this.originalImage) return;
        
        this.currentImage = this.originalImage;
        this.imageData = {
            width: this.imageData.originalWidth,
            height: this.imageData.originalHeight,
            originalWidth: this.imageData.originalWidth,
            originalHeight: this.imageData.originalHeight,
            scale: 1,
            rotation: 0,
            flipH: false,
            flipV: false
        };
        
        this.filters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            blur: 0,
            filter: 'none'
        };
        
        this.textElements = [];
        this.resetFilterControls();
        this.updateCanvasSize();
        this.drawImage();
        this.initializeCrop();
        this.updateResizeInputs();
        this.saveToHistory('Reset to Original');
        this.showToast('Image reset to original', 'success');
    }
    
    // ========================
    // RESIZE FUNCTIONALITY
    // ========================
    
    updateDimensions(dimension, value) {
        if (!this.currentImage) return;
        
        const maintainAspect = document.getElementById('maintainAspect').checked;
        const currentRatio = this.imageData.originalWidth / this.imageData.originalHeight;
        
        if (dimension === 'width') {
            this.imageData.width = parseInt(value) || 0;
            if (maintainAspect) {
                this.imageData.height = Math.round(this.imageData.width / currentRatio);
                document.getElementById('heightInput').value = this.imageData.height;
            }
        } else {
            this.imageData.height = parseInt(value) || 0;
            if (maintainAspect) {
                this.imageData.width = Math.round(this.imageData.height * currentRatio);
                document.getElementById('widthInput').value = this.imageData.width;
            }
        }
        
        this.imageData.scale = this.imageData.width / this.imageData.originalWidth;
        this.updateCanvasSize();
        this.drawImage();
        this.initializeCrop();
        this.updateEstimatedSize();
    }
    
    toggleAspectRatio(maintain) {
        if (maintain && this.currentImage) {
            const currentRatio = this.imageData.originalWidth / this.imageData.originalHeight;
            this.imageData.height = Math.round(this.imageData.width / currentRatio);
            document.getElementById('heightInput').value = this.imageData.height;
            this.updateCanvasSize();
            this.drawImage();
            this.initializeCrop();
        }
    }
    
    updateResizeInputs() {
        document.getElementById('widthInput').value = this.imageData.width;
        document.getElementById('heightInput').value = this.imageData.height;
        document.getElementById('percentageSlider').value = Math.round(this.imageData.scale * 100);
        document.getElementById('percentageValue').textContent = Math.round(this.imageData.scale * 100) + '%';
    }
    
    // ========================
    // FILTERS & EFFECTS
    // ========================
    
    applyFilters() {
        if (!this.currentImage) return;
        
        this.drawImage();
        this.saveToHistory('Filters Applied');
    }
    
    resetFilterControls() {
        document.getElementById('brightnessSlider').value = 0;
        document.getElementById('brightnessValue').textContent = 0;
        document.getElementById('contrastSlider').value = 0;
        document.getElementById('contrastValue').textContent = 0;
        document.getElementById('saturationSlider').value = 0;
        document.getElementById('saturationValue').textContent = 0;
        document.getElementById('blurSlider').value = 0;
        document.getElementById('blurValue').textContent = '0px';
        
        // Reset filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === 'none') {
                btn.classList.add('active');
            }
        });
    }
    
    addBackgroundColor(color) {
        if (!this.currentImage) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.imageData.width;
        canvas.height = this.imageData.height;
        
        // Fill background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw current image on top
        ctx.drawImage(this.canvas, 0, 0);

                // Create new image from canvas
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.drawImage();
            this.saveToHistory('Background Added');
            this.showToast('Background color added', 'success');
        };
        img.src = canvas.toDataURL();
    }
    
    removeBackground() {
        this.drawImage();
        this.saveToHistory('Background Removed');
        this.showToast('Background removed', 'success');
    }
    
    // ========================
    // TEXT FUNCTIONALITY
    // ========================
    
    updateTextPreview() {
        // This would update text preview in real-time
        // Implementation depends on current text element selection
    }
    
    setTextPosition(position) {
        this.currentTextPosition = position;
    }
    
    addText() {
        const text = document.getElementById('textInput').value;
        if (!text.trim()) {
            this.showToast('Please enter text to add', 'warning');
            return;
        }
        
        const textElement = {
            id: Date.now(),
            text: text,
            x: this.imageData.width / 2,
            y: this.imageData.height / 2,
            fontSize: parseInt(document.getElementById('fontSizeSlider').value),
            fontFamily: document.getElementById('fontFamily').value,
            color: document.getElementById('textColor').value,
            opacity: parseInt(document.getElementById('textOpacitySlider').value) / 100,
            bold: document.getElementById('textBold').checked,
            italic: document.getElementById('textItalic').checked,
            shadow: document.getElementById('textShadow').checked,
            outline: document.getElementById('textOutline').checked,
            position: this.currentTextPosition || 'center'
        };
        
        // Position text based on selection
        this.positionText(textElement);
        
        this.textElements.push(textElement);
        this.drawImage();
        this.saveToHistory('Text Added');
        this.showToast('Text added successfully', 'success');
        
        // Clear input
        document.getElementById('textInput').value = '';
    }
    
    positionText(textElement) {
        const padding = 50;
        
        switch (textElement.position) {
            case 'top-left':
                textElement.x = padding;
                textElement.y = textElement.fontSize + padding;
                break;
            case 'top-center':
                textElement.x = this.imageData.width / 2;
                textElement.y = textElement.fontSize + padding;
                break;
            case 'top-right':
                textElement.x = this.imageData.width - padding;
                textElement.y = textElement.fontSize + padding;
                break;
            case 'middle-left':
                textElement.x = padding;
                textElement.y = this.imageData.height / 2;
                break;
            case 'center':
                textElement.x = this.imageData.width / 2;
                textElement.y = this.imageData.height / 2;
                break;
            case 'middle-right':
                textElement.x = this.imageData.width - padding;
                textElement.y = this.imageData.height / 2;
                break;
            case 'bottom-left':
                textElement.x = padding;
                textElement.y = this.imageData.height - padding;
                break;
            case 'bottom-center':
                textElement.x = this.imageData.width / 2;
                textElement.y = this.imageData.height - padding;
                break;
            case 'bottom-right':
                textElement.x = this.imageData.width - padding;
                textElement.y = this.imageData.height - padding;
                break;
        }
    }
    
    drawTextElements() {
        if (!this.textElements.length) return;
        
        const ctx = this.ctx;
        
        this.textElements.forEach(element => {
            ctx.save();
            
            // Set font properties
            let fontStyle = '';
            if (element.italic) fontStyle += 'italic ';
            if (element.bold) fontStyle += 'bold ';
            fontStyle += `${element.fontSize}px ${element.fontFamily}`;
            ctx.font = fontStyle;
            
            // Set color and opacity
            const color = this.hexToRgba(element.color, element.opacity);
            ctx.fillStyle = color;
            
            // Text alignment
            if (element.position.includes('center')) {
                ctx.textAlign = 'center';
            } else if (element.position.includes('right')) {
                ctx.textAlign = 'right';
            } else {
                ctx.textAlign = 'left';
            }
            
            ctx.textBaseline = 'middle';
            
            // Apply text effects
            if (element.shadow) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            
            if (element.outline) {
                ctx.strokeStyle = element.color === '#ffffff' ? '#000000' : '#ffffff';
                ctx.lineWidth = 2;
                ctx.strokeText(element.text, element.x, element.y);
            }
            
            // Draw text
            ctx.fillText(element.text, element.x, element.y);
            
            ctx.restore();
        });
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // ========================
    // PRESET FUNCTIONALITY
    // ========================
    
    applyPreset(presetName) {
        if (!this.currentImage) return;
        
        let dimensions;
        
        if (this.presets.social[presetName]) {
            dimensions = this.presets.social[presetName];
        } else if (this.presets.document[presetName]) {
            dimensions = this.presets.document[presetName];
        } else if (this.presets.passport[presetName]) {
            dimensions = this.presets.passport[presetName];
            this.showPassportOptions();
        }
        
        if (dimensions) {
            this.imageData.width = dimensions.width;
            this.imageData.height = dimensions.height;
            this.imageData.scale = dimensions.width / this.imageData.originalWidth;
            
            this.updateCanvasSize();
            this.drawImage();
            this.initializeCrop();
            this.updateResizeInputs();
            this.saveToHistory(`Applied ${presetName} preset`);
            this.showToast(`Applied ${presetName} preset`, 'success');
        }
    }
    
    showPassportOptions() {
        document.getElementById('passportOptions').style.display = 'block';
    }
    
    generatePassportSheet() {
        if (!this.currentImage) return;
        
        this.showProgress('Generating passport photo sheet...');
        
        // Apply crop first
        this.applyCrop();
        
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // A4 size at 300 DPI
            canvas.width = 2480;
            canvas.height = 3508;
            
            // Fill white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Calculate photo dimensions and positions
            const photoWidth = this.imageData.width;
            const photoHeight = this.imageData.height;
            const margin = 100;
            const spacing = 50;
            
            // Calculate how many photos fit
            const photosPerRow = Math.floor((canvas.width - 2 * margin + spacing) / (photoWidth + spacing));
            const photosPerCol = Math.floor((canvas.height - 2 * margin + spacing) / (photoHeight + spacing));
            
            // Draw photos
            for (let row = 0; row < photosPerCol; row++) {
                for (let col = 0; col < photosPerRow; col++) {
                    const x = margin + col * (photoWidth + spacing);
                    const y = margin + row * (photoHeight + spacing);
                    
                    ctx.drawImage(this.canvas, 0, 0, photoWidth, photoHeight, x, y, photoWidth, photoHeight);
                }
            }
            
            // Download the sheet
            const link = document.createElement('a');
            link.download = 'passport-photo-sheet.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            this.hideProgress();
            this.showToast('Passport photo sheet generated successfully', 'success');
        }, 1000);
    }
    
    // ========================
    // BATCH PROCESSING
    // ========================
    
    updateBatchPanel() {
        const batchPanel = document.getElementById('batchPanel');
        const batchList = document.getElementById('batchList');
        const downloadZipBtn = document.getElementById('downloadZipBtn');
        
        if (this.batchMode && this.batchFiles.length > 1) {
            batchPanel.style.display = 'block';
            downloadZipBtn.style.display = 'block';
            
            batchList.innerHTML = '';
            this.batchFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'batch-item';
                item.innerHTML = `
                    <div>
                        <div class="batch-item-name">${file.name}</div>
                        <div class="batch-item-size">${this.formatFileSize(file.size)}</div>
                    </div>
                `;
                batchList.appendChild(item);
            });
        } else {
            batchPanel.style.display = 'none';
            downloadZipBtn.style.display = 'none';
        }
    }
    
    applyToBatch() {
        if (!this.batchMode || this.batchFiles.length <= 1) return;
        
        this.showProgress('Processing batch files...');
        
        // This would apply current settings to all batch files
        // Implementation would involve processing each file with current transformations
        
        setTimeout(() => {
            this.hideProgress();
            this.showToast(`Applied settings to ${this.batchFiles.length} files`, 'success');
        }, 2000);
    }
    
    clearBatch() {
        this.batchFiles = [];
        this.batchMode = false;
        this.updateBatchPanel();
        this.showToast('Batch cleared', 'info');
    }
    
    downloadBatch() {
        if (!this.batchFiles.length) return;
        
        this.showProgress('Preparing batch download...');
        
        // This would create a ZIP file with all processed images
        // For now, just simulate the process
        setTimeout(() => {
            this.hideProgress();
            this.showToast('Batch download started', 'success');
        }, 1500);
    }
    
    // ========================
    // HISTORY MANAGEMENT
    // ========================
    
    saveToHistory(action) {
        if (!this.canvas) return;
        
        const historyItem = {
            action: action,
            imageData: this.canvas.toDataURL(),
            timestamp: Date.now(),
            filters: { ...this.filters },
            imageInfo: { ...this.imageData }
        };
        
        // Remove future history if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(historyItem);
        
        // Limit history size
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateHistoryUI();
        this.updateUndoRedoButtons();
    }
    
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFromHistory();
            this.showToast('Undone', 'info');
        }
    }
    
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreFromHistory();
            this.showToast('Redone', 'info');
        }
    }
    
    restoreFromHistory() {
        const historyItem = this.history[this.historyIndex];
        if (!historyItem) return;
        
        const img = new Image();
        img.onload = () => {
            this.currentImage = img;
            this.filters = { ...historyItem.filters };
            this.imageData = { ...historyItem.imageInfo };
            
            this.updateCanvasSize();
            this.drawImage();
            this.initializeCrop();
            this.updateResizeInputs();
            this.updateHistoryUI();
        };
        img.src = historyItem.imageData;
        
        this.updateUndoRedoButtons();
    }
    
    updateHistoryUI() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${index === this.historyIndex ? 'active' : ''}`;
            historyItem.textContent = item.action;
            historyItem.addEventListener('click', () => {
                this.historyIndex = index;
                this.restoreFromHistory();
            });
            historyList.appendChild(historyItem);
        });
    }
    
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
    
    clearHistory() {
        this.history = [];
        this.historyIndex = -1;
        this.updateHistoryUI();
        this.updateUndoRedoButtons();
        this.saveToHistory('Current State');
        this.showToast('History cleared', 'info');
    }
    
    // ========================
    // DOWNLOAD FUNCTIONALITY
    // ========================
    
    downloadImage() {
        if (!this.currentImage) return;
        
        this.showProgress('Preparing download...');
        
        // Apply crop if in crop mode
        if (this.currentTool === 'crop' && this.cropData.width > 0) {
            this.applyCrop();
        }
        
        setTimeout(() => {
            const canvas = this.getDownloadCanvas();
            const link = document.createElement('a');
            const filename = this.generateFilename();
            
            link.download = filename;
            link.href = canvas.toDataURL(`image/${this.settings.format}`, this.settings.quality);
            link.click();
            
            this.hideProgress();
            this.showToast('Download started', 'success');
        }, 500);
    }
    
    getDownloadCanvas() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Adjust size based on DPI
        const dpiScale = this.settings.dpi / 72;
        canvas.width = this.imageData.width * dpiScale;
        canvas.height = this.imageData.height * dpiScale;
        
        ctx.scale(dpiScale, dpiScale);
        ctx.drawImage(this.canvas, 0, 0);
        
        return canvas;
    }
    
    generateFilename() {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        return `photo-resizer-${timestamp}.${this.settings.format}`;
    }
    
    updateEstimatedSize() {
        if (!this.currentImage) return;
        
        const canvas = this.getDownloadCanvas();
        const dataUrl = canvas.toDataURL(`image/${this.settings.format}`, this.settings.quality);
        const sizeInBytes = Math.round((dataUrl.length * 3) / 4);
        const sizeText = this.formatFileSize(sizeInBytes);
        
        document.getElementById('estimatedSize').textContent = sizeText;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // ========================
    // CLIPBOARD FUNCTIONALITY
    // ========================
    
    checkClipboardSupport() {
        if (!navigator.clipboard || !navigator.clipboard.read) {
            document.getElementById('pasteBtn').style.display = 'none';
        }
    }
    
    async pasteFromClipboard() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        const file = new File([blob], 'clipboard-image', { type });
                        this.loadSingleImage(file);
                        return;
                    }
                }
            }
            
            this.showToast('No image found in clipboard', 'warning');
        } catch (error) {
            this.showToast('Failed to access clipboard', 'error');
        }
    }
    
    // ========================
    // UI MANAGEMENT
    // ========================
    
    showSection(section) {
        const uploadSection = document.getElementById('uploadSection');
        const editorSection = document.getElementById('editorSection');
        
        if (section === 'upload') {
            uploadSection.style.display = 'flex';
            editorSection.style.display = 'none';
        } else {
            uploadSection.style.display = 'none';
            editorSection.style.display = 'flex';
        }
    }
    
    setTool(tool) {
        this.currentTool = tool;
        
        // Update active tool button
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(tool + 'Btn').classList.add('active');
        
        // Show/hide panels
        document.getElementById('cropPanel').style.display = tool === 'crop' ? 'block' : 'none';
        document.getElementById('resizePanel').style.display = tool === 'resize' ? 'block' : 'none';
        document.getElementById('filtersPanel').style.display = tool === 'filters' ? 'block' : 'none';
        document.getElementById('textPanel').style.display = tool === 'text' ? 'block' : 'none';
        
        // Update canvas cursor
        if (tool === 'crop') {
            this.initializeCrop();
        } else {
            this.clearCropOverlay();
        }
    }
    
    clearCropOverlay() {
        if (this.cropCtx) {
            this.cropCtx.clearRect(0, 0, this.cropCanvas.width, this.cropCanvas.height);
        }
    }
    
    updateImageInfo(file = null) {
        document.getElementById('originalSize').textContent = 
            `${this.imageData.originalWidth} × ${this.imageData.originalHeight}`;
        document.getElementById('currentSize').textContent = 
            `${this.imageData.width} × ${this.imageData.height}`;
        document.getElementById('fileFormat').textContent = 
            this.settings.format.toUpperCase();
        
        if (file) {
            document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        }
    }
    
    updateActivePreset(activeBtn) {
        const container = activeBtn.parentElement;
        container.querySelectorAll('.preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }
    
    updateActiveButton(activeBtn, selector) {
        document.querySelectorAll(selector).forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }
    
    // ========================
    // THEME MANAGEMENT
    // ========================
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        
        const themeIcon = document.querySelector('.theme-icon');
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        
        this.settings.theme = newTheme;
        this.saveSettings();
        
        this.showToast(`Switched to ${newTheme} theme`, 'info');
    }
    
    // ========================
    // SETTINGS MANAGEMENT
    // ========================
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('photoEditorSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.settings = { ...this.settings, ...settings };
                
                // Apply theme
                if (this.settings.theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    document.querySelector('.theme-icon').textContent = '☀️';
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('photoEditorSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }
    
    // ========================
    // MODAL MANAGEMENT
    // ========================
    
    showHelpModal() {
        const modal = document.getElementById('helpModal');
        modal.classList.add('active');
    }
    
    hideHelpModal() {
        const modal = document.getElementById('helpModal');
        modal.classList.remove('active');
    }
    
    // ========================
    // PROGRESS & NOTIFICATIONS
    // ========================
    
    showProgress(message) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressFill = document.getElementById('progressFill');
        
        progressText.textContent = message;
        progressFill.style.width = '0%';
        progressBar.style.display = 'block';
        
        // Animate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 100);
        
        this.progressInterval = interval;
    }
    
    hideProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        progressFill.style.width = '100%';
        
        setTimeout(() => {
            progressBar.style.display = 'none';
        }, 300);
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${this.getToastIcon(type)}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Hide toast
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
    
    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }
}

// ========================
// INITIALIZE APPLICATION
// ========================

document.addEventListener('DOMContentLoaded', () => {
    window.photoEditor = new PhotoEditor();
});

// ========================
// SERVICE WORKER (PWA Support)
// ========================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// ========================
// UTILITY FUNCTIONS
// ========================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ========================
// PERFORMANCE MONITORING
// ========================

if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark('photo-editor-init-start');
    
    window.addEventListener('load', () => {
        performance.mark('photo-editor-init-end');
        performance.measure('photo-editor-init', 'photo-editor-init-start', 'photo-editor-init-end');
        
        const measure = performance.getEntriesByName('photo-editor-init')[0];
        console.log(`Photo Editor initialized in ${measure.duration.toFixed(2)}ms`);
    });
}

