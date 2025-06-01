// ===== GLOBAL VARIABLES =====
let uploadedFile = null;
let isUploading = false;

// ===== DOM ELEMENTS =====
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('file');
const uploadPreview = document.getElementById('uploadPreview');
const uploadContent = document.querySelector('.upload-content');
const previewImage = document.getElementById('previewImage');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const submitBtn = document.getElementById('submitBtn');
const submitText = document.getElementById('submitText');
const uploadForm = document.getElementById('uploadForm');
const loadingOverlay = document.getElementById('loadingOverlay');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupSmoothScrolling();
    setupProgressBarAnimation();
    setupFormValidation();
    setupTooltips();
    setupParallaxEffect();
    
    // Add entrance animations
    animateOnScroll();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // File upload events
    if (uploadArea && fileInput) {
        // Click to upload
        uploadArea.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !isUploading) {
                fileInput.click();
            }
        });

        // File input change
        fileInput.addEventListener('change', handleFileSelect);

        // Drag and drop events
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults);
            document.body.addEventListener(eventName, preventDefaults);
        });
    }

    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleFormSubmit);
    }

    // Window events
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // Navbar scroll effect
    setupNavbarScrollEffect();
}

// ===== FILE UPLOAD HANDLING =====
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function handleDragOver(e) {
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function processFile(file) {
    // Validate file
    if (!validateFile(file)) {
        return;
    }

    uploadedFile = file;

    // Show preview
    showFilePreview(file);

    // Enable submit button
    enableSubmitButton();

    // Update file input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
}

function validateFile(file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
    const maxSize = 16 * 1024 * 1024; // 16MB

    if (!allowedTypes.includes(file.type)) {
        showAlert('Định dạng file không được hỗ trợ. Vui lòng chọn file JPG, PNG, GIF, BMP hoặc TIFF.', 'danger');
        return false;
    }

    if (file.size > maxSize) {
        showAlert('File quá lớn. Vui lòng chọn file nhỏ hơn 16MB.', 'danger');
        return false;
    }

    return true;
}

function showFilePreview(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        previewImage.src = e.target.result;
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        
        // Hide upload content and show preview
        uploadContent.classList.add('d-none');
        uploadPreview.classList.remove('d-none');
        
        // Add animation
        uploadPreview.style.opacity = '0';
        uploadPreview.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            uploadPreview.style.transition = 'all 0.3s ease-out';
            uploadPreview.style.opacity = '1';
            uploadPreview.style.transform = 'translateY(0)';
        }, 50);
    };
    
    reader.readAsDataURL(file);
}

function clearPreview() {
    uploadedFile = null;
    uploadContent.classList.remove('d-none');
    uploadPreview.classList.add('d-none');
    fileInput.value = '';
    disableSubmitButton();
    
    // Reset upload area
    uploadArea.classList.remove('dragover');
}

function enableSubmitButton() {
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove('btn-secondary');
        submitBtn.classList.add('btn-success');
        submitText.textContent = 'Phân tích bằng AI';
    }
}

function disableSubmitButton() {
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-secondary');
        submitText.textContent = 'Vui lòng chọn ảnh';
    }
}

// ===== FORM HANDLING =====
function handleFormSubmit(e) {
    if (!uploadedFile) {
        e.preventDefault();
        showAlert('Vui lòng chọn file ảnh để phân tích.', 'warning');
        return;
    }

    if (isUploading) {
        e.preventDefault();
        return;
    }

    isUploading = true;
    showLoadingOverlay();
    updateSubmitButton('uploading');
}

function updateSubmitButton(state) {
    if (!submitBtn || !submitText) return;

    switch(state) {
        case 'uploading':
            submitBtn.disabled = true;
            submitText.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang phân tích...';
            break;
        case 'success':
            submitBtn.disabled = false;
            submitText.innerHTML = '<i class="fas fa-magic me-2"></i>Phân tích bằng AI';
            break;
        default:
            submitBtn.disabled = false;
            submitText.innerHTML = '<i class="fas fa-magic me-2"></i>Phân tích bằng AI';
    }
}

// ===== LOADING OVERLAY =====
function showLoadingOverlay() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add random tips
        const tips = [
            'AI đang phân tích hình ảnh của bạn...',
            'Đang so sánh với hàng triệu mẫu dữ liệu...',
            'Sử dụng mạng nơ-ron sâu để nhận diện...',
            'Chỉ còn vài giây nữa...'
        ];
        
        let tipIndex = 0;
        const tipElement = loadingOverlay.querySelector('p');
        
        const tipInterval = setInterval(() => {
            tipIndex = (tipIndex + 1) % tips.length;
            if (tipElement) {
                tipElement.style.opacity = '0';
                setTimeout(() => {
                    tipElement.textContent = tips[tipIndex];
                    tipElement.style.opacity = '1';
                }, 300);
            }
        }, 2000);
        
        // Store interval for cleanup
        loadingOverlay.tipInterval = tipInterval;
    }
}

function hideLoadingOverlay() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        document.body.style.overflow = '';
        isUploading = false;
        
        // Clear tip interval
        if (loadingOverlay.tipInterval) {
            clearInterval(loadingOverlay.tipInterval);
        }
        
        updateSubmitButton('success');
    }
}

// ===== SMOOTH SCROLLING =====
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== NAVBAR SCROLL EFFECT =====
function setupNavbarScrollEffect() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(40, 167, 69, 0.98)';
            navbar.style.backdropFilter = 'blur(15px)';
        } else {
            navbar.style.background = 'rgba(40, 167, 69, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        }
    });
}

// ===== PROGRESS BAR ANIMATION =====
function setupProgressBarAnimation() {
    const progressBars = document.querySelectorAll('.progress-bar[data-confidence]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const confidence = progressBar.getAttribute('data-confidence');
                
                setTimeout(() => {
                    progressBar.style.width = confidence + '%';
                }, 500);
                
                observer.unobserve(progressBar);
            }
        });
    }, { threshold: 0.5 });
    
    progressBars.forEach(bar => observer.observe(bar));
}

// ===== SCROLL ANIMATIONS =====
function animateOnScroll() {
    const animatedElements = document.querySelectorAll('.feature-card, .info-card, .top-predictions, .api-docs-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}

// ===== PARALLAX EFFECT =====
function setupParallaxEffect() {
    const heroImage = document.querySelector('.hero-image img');
    if (!heroImage) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const speed = 0.5;
        heroImage.style.transform = `translateY(${scrolled * speed}px)`;
    });
}

// ===== FORM VALIDATION =====
function setupFormValidation() {
    const plantTypeSelect = document.getElementById('plant_type');
    if (plantTypeSelect) {
        plantTypeSelect.addEventListener('change', function() {
            this.style.borderColor = this.value ? '#28a745' : '#ced4da';
        });
    }
}

// ===== TOOLTIPS =====
function setupTooltips() {
    // Initialize Bootstrap tooltips if available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
}

// ===== UTILITY FUNCTIONS =====
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showAlert(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertContainer.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertContainer);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (alertContainer.parentNode) {
            alertContainer.remove();
        }
    }, 5000);
}

function handleScroll() {
    // Update navbar active state based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        if (sectionTop <= 150) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

function handleResize() {
    // Handle responsive behavior
    if (window.innerWidth < 768) {
        // Mobile optimizations
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.style.padding = '1.5rem 1rem';
        }
    }
}

// ===== PAGE VISIBILITY API =====
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden
        if (isUploading) {
            console.log('Page hidden during upload');
        }
    } else {
        // Page is visible
        if (isUploading) {
            console.log('Page visible during upload');
        }
    }
});

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    if (isUploading) {
        hideLoadingOverlay();
        showAlert('Đã xảy ra lỗi trong quá trình xử lý. Vui lòng thử lại.', 'danger');
    }
});

// ===== CLEANUP ON PAGE UNLOAD =====
window.addEventListener('beforeunload', function() {
    if (isUploading) {
        return 'Quá trình phân tích đang diễn ra. Bạn có chắc muốn rời khỏi trang?';
    }
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // ESC to close loading overlay
    if (e.key === 'Escape' && loadingOverlay && loadingOverlay.style.display === 'flex') {
        // Don't close during actual upload
        if (!isUploading) {
            hideLoadingOverlay();
        }
    }
    
    // Ctrl/Cmd + U to trigger file upload
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        if (fileInput && !isUploading) {
            fileInput.click();
        }
    }
});

// ===== PERFORMANCE OPTIMIZATION =====
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

// Debounced scroll handler
const debouncedScrollHandler = debounce(handleScroll, 10);
window.addEventListener('scroll', debouncedScrollHandler);

// ===== THEME SUPPORT =====
function initializeTheme() {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    if (prefersDarkScheme.matches) {
        document.body.classList.add('dark-theme');
    }
    
    prefersDarkScheme.addEventListener('change', (e) => {
        if (e.matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    });
}

// ===== ANALYTICS =====
function trackEvent(eventName, properties = {}) {
    // Placeholder for analytics tracking
    console.log('Event:', eventName, properties);
}

// Track file uploads
if (uploadForm) {
    uploadForm.addEventListener('submit', () => {
        trackEvent('file_upload_started', {
            fileType: uploadedFile?.type,
            fileSize: uploadedFile?.size
        });
    });
}

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateFile,
        formatFileSize,
        processFile,
        showAlert
    };
}