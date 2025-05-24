// Global variables to store image data
let uploadedImages = [];
let currentImageCount = 0;

// DOM elements
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const uploadBtn = document.querySelector('.upload-btn'); // Added to reference the label
const uploadSection = document.getElementById('upload-section');
const previewSection = document.getElementById('preview-section');
const settingsSection = document.getElementById('settings-section');
const thumbnailsContainer = document.getElementById('thumbnails-container');
const addMoreBtn = document.getElementById('add-more-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const generatePdfBtn = document.getElementById('generate-pdf-btn');
const loaderContainer = document.getElementById('loader-container');
const loadingText = document.getElementById('loading-text'); // Added for dynamic loader text

// Initialize SortableJS
let sortable = new Sortable(thumbnailsContainer, {
    animation: 150,
    ghostClass: 'ghost',
    onEnd: function() {
        updateImageNumbers();
    }
});

// Event listeners
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Upload area event listeners
    uploadArea.addEventListener('click', triggerFileInput);
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Prevent upload-btn click from propagating to upload-area
    uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from bubbling to upload-area
    });
    
    // Button event listeners
    addMoreBtn.addEventListener('click', triggerFileInput);
    clearAllBtn.addEventListener('click', clearAllImages);
    generatePdfBtn.addEventListener('click', generatePDF);
}

// Event handlers
function triggerFileInput(e) {
    if (!e.target.closest('.upload-btn')) { // Only trigger if not clicking the upload button
        fileInput.click();
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    uploadArea.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
    }
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        processFiles(e.target.files);
    }
}

// Process uploaded files
async function processFiles(files) {
    const validFiles = Array.from(files).filter(file => {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/bmp', 'image/gif'];
        return validTypes.includes(file.type);
    });
    
    if (validFiles.length === 0) {
        alert('Please upload valid image files (PNG, JPG, JPEG, WEBP, BMP, GIF)');
        return;
    }
    
    // Show loader
    loaderContainer.classList.remove('hidden');
    
    // Process files sequentially with progress feedback
    for (let i = 0; i < validFiles.length; i++) {
        loadingText.textContent = `Processing image ${i + 1} of ${validFiles.length}...`;
        try {
            await processFile(validFiles[i]);
        } catch (error) {
            console.error(`Error processing ${validFiles[i].name}:`, error);
            alert(`Failed to process ${validFiles[i].name}. Skipping this file.`);
        }
    }
    
    // Show preview and settings sections if hidden
    if (uploadedImages.length > 0) {
        uploadSection.classList.add('hidden');
        previewSection.classList.remove('hidden');
        settingsSection.classList.remove('hidden');
    }
    
    // Hide loader
    loaderContainer.classList.add('hidden');
    
    // Reset file input
    fileInput.value = '';
    
    // Update image numbering
    updateImageNumbers();
}

// Process a single file
async function processFile(file) {
    return new Promise((resolve, reject) => {
        currentImageCount++;
        const imageObject = {
            id: `img-${Date.now()}-${currentImageCount}`,
            file: file,
            url: URL.createObjectURL(file),
            name: file.name
        };
        
        // Load image to ensure it's valid
        const imgElement = new Image();
        imgElement.src = imageObject.url;
        imgElement.onload = () => {
            uploadedImages.push(imageObject);
            createThumbnail(imageObject);
            resolve();
        };
        imgElement.onerror = () => {
            URL.revokeObjectURL(imageObject.url);
            reject(new Error('Invalid image file'));
        };
    });
}

// Create thumbnail element
function createThumbnail(imageObject) {
    const thumbnailItem = document.createElement('div');
    thumbnailItem.className = 'thumbnail-item';
    thumbnailItem.dataset.id = imageObject.id;
    
    const img = document.createElement('img');
    img.src = imageObject.url;
    img.alt = imageObject.name;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteThumbnail(imageObject.id);
    });
    
    const imageNumber = document.createElement('div');
    imageNumber.className = 'image-number';
    
    thumbnailItem.appendChild(img);
    thumbnailItem.appendChild(deleteBtn);
    thumbnailItem.appendChild(imageNumber);
    
    thumbnailsContainer.appendChild(thumbnailItem);
}

// Delete a thumbnail
function deleteThumbnail(id) {
    // Remove from DOM
    const thumbnailToRemove = document.querySelector(`.thumbnail-item[data-id="${id}"]`);
    if (thumbnailToRemove) {
        thumbnailToRemove.remove();
    }
    
    // Remove from array and revoke object URL
    const index = uploadedImages.findIndex(img => img.id === id);
    if (index !== -1) {
        URL.revokeObjectURL(uploadedImages[index].url);
        uploadedImages.splice(index, 1);
    }
    
    // Update UI based on remaining images
    if (uploadedImages.length === 0) {
        uploadSection.classList.remove('hidden');
        previewSection.classList.add('hidden');
        settingsSection.classList.add('hidden');
    }
    
    // Update image numbering
    updateImageNumbers();
}

// Clear all images
function clearAllImages() {
    // Confirm before clearing
    if (uploadedImages.length > 0) {
        const confirmation = confirm('Are you sure you want to clear all images?');
        if (!confirmation) return;
        
        // Revoke all object URLs
        uploadedImages.forEach(img => {
            URL.revokeObjectURL(img.url);
        });
        
        // Clear arrays and DOM
        uploadedImages = [];
        thumbnailsContainer.innerHTML = '';
        
        // Reset UI
        uploadSection.classList.remove('hidden');
        previewSection.classList.add('hidden');
        settingsSection.classList.add('hidden');
    }
}

// Update image numbers
function updateImageNumbers() {
    const thumbnails = document.querySelectorAll('.thumbnail-item');
    thumbnails.forEach((thumbnail, index) => {
        const numberElement = thumbnail.querySelector('.image-number');
        numberElement.textContent = `Page ${index + 1}`;
    });
}

// Generate PDF
async function generatePDF() {
    if (uploadedImages.length === 0) {
        alert('Please upload at least one image to generate a PDF.');
        return;
    }
    
    // Show loader
    loaderContainer.classList.remove('hidden');
    loadingText.textContent = 'Preparing PDF...';
    
    // Use setTimeout to ensure loader is rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        // Get settings
        const pageSize = document.getElementById('page-size').value;
        const orientation = document.getElementById('orientation').value;
        const margin = parseInt(document.getElementById('margin').value) || 10;
        const imageQuality = parseFloat(document.getElementById('image-quality').value) || 0.85;
        
        // Create new jsPDF instance
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: pageSize
        });
        
        // Get page dimensions
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const contentWidth = pageWidth - (2 * margin);
        const contentHeight = pageHeight - (2 * margin);
        
        // Get all thumbnails in current order
        const thumbnails = document.querySelectorAll('.thumbnail-item');
        const sortedImages = Array.from(thumbnails).map(thumb => {
            const id = thumb.dataset.id;
            return uploadedImages.find(img => img.id === id);
        });
        
        // Process each image and add to PDF
        let isFirstPage = true;
        
        for (let i = 0; i < sortedImages.length; i++) {
            const img = sortedImages[i];
            
            // Add new page if not the first image
            if (!isFirstPage) {
                doc.addPage();
            }
            isFirstPage = false;
            
            // Update loader text
            loadingText.textContent = `Processing image ${i + 1} of ${sortedImages.length}...`;
            
            // Load image for processing
            const imgElement = new Image();
            imgElement.src = img.url;
            
            await new Promise(resolve => {
                imgElement.onload = resolve;
                imgElement.onerror = () => {
                    throw new Error(`Failed to load image ${img.name}`);
                };
            });
            
            // Calculate aspect ratios and positioning for best fit
            const imgRatio = imgElement.width / imgElement.height;
            const pageRatio = contentWidth / contentHeight;
            
            let imgWidth, imgHeight, xOffset, yOffset;
            
            if (imgRatio > pageRatio) {
                // Image is wider than page content area (relative to height)
                imgWidth = contentWidth;
                imgHeight = contentWidth / imgRatio;
                xOffset = margin;
                yOffset = margin + (contentHeight - imgHeight) / 2;
            } else {
                // Image is taller than page content area (relative to width)
                imgHeight = contentHeight;
                imgWidth = contentHeight * imgRatio;
                xOffset = margin + (contentWidth - imgWidth) / 2;
                yOffset = margin;
            }
            
            // Add image to PDF
            doc.addImage(
                imgElement, 
                'JPEG', 
                xOffset, 
                yOffset, 
                imgWidth, 
                imgHeight, 
                undefined, 
                'MEDIUM', 
                0
            );
        }
        
        // Update loader text
        loadingText.textContent = 'Finalizing PDF...';
        
        // Save PDF
        const filename = `PDF_Craft Unify X${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        
        // Hide loader
        setTimeout(() => {
            loaderContainer.classList.add('hidden');
        }, 500);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
        loaderContainer.classList.add('hidden');
    }
}
