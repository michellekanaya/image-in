const API_BASE_URL = 'https://michellekanaya--image-in-backend-flask-app.us-east.modal.run';

// Initialize Icons
lucide.createIcons();

let activeFeature = null;
let uploadedFiles = []; // Menyimpan daftar file gambar yang dipilih
let compressAspectRatio = null;
let compressOriginalWidth = null;
let compressOriginalHeight = null;

function setCompressOriginalDimensions(width, height) {
    if (!width || !height) return;

    compressOriginalWidth = width;
    compressOriginalHeight = height;
    compressAspectRatio = width / height;

    const widthInput = document.getElementById('customWidth');
    const heightInput = document.getElementById('customHeight');

    if (!widthInput || !heightInput) return;

    // Batas maksimal mengikuti dimensi asli gambar.
    widthInput.max = width;
    heightInput.max = height;

    widthInput.value = width;
    heightInput.value = height;

    // Menyimpan nilai valid terakhir.
    widthInput.dataset.lastValid = width;
    heightInput.dataset.lastValid = height;
}

function validateCompressDimension(changedField) {
    if (activeFeature !== 'compress' || uploadedFiles.length !== 1) return;

    const widthInput = document.getElementById('customWidth');
    const heightInput = document.getElementById('customHeight');

    if (!widthInput || !heightInput || !compressAspectRatio) return;

    const input = changedField === 'width' ? widthInput : heightInput;
    const maxValue = Number(input.max);
    const currentValue = Number(input.value);
    const lastValid = Number(input.dataset.lastValid);

    // Tolak nilai yang melewati dimensi asli.
    if (
        currentValue > maxValue ||
        currentValue <= 0 ||
        !Number.isFinite(currentValue)
    ) {
        input.value = lastValid || maxValue;
        return;
    }

    input.dataset.lastValid = currentValue;

    // Otomatis menjaga rasio aspek.
    if (changedField === 'width') {
        const calculatedHeight = Math.round(
            currentValue / compressAspectRatio
        );

        if (calculatedHeight <= compressOriginalHeight) {
            heightInput.value = calculatedHeight;
            heightInput.dataset.lastValid = calculatedHeight;
        }
    } else {
        const calculatedWidth = Math.round(
            currentValue * compressAspectRatio
        );

        if (calculatedWidth <= compressOriginalWidth) {
            widthInput.value = calculatedWidth;
            widthInput.dataset.lastValid = calculatedWidth;
        }
    }
}

// Memantau perubahan dimensi saat pengguna mengetik.
document.getElementById('customWidth').addEventListener('input', () => {
    validateCompressDimension('width');
});

document.getElementById('customHeight').addEventListener('input', () => {
    validateCompressDimension('height');
});


function setCompressAspectRatio(width, height) {
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
        compressAspectRatio = width / height;
    } else {
        compressAspectRatio = null;
    }
}

function syncCompressDimension(changedField) {
    if (activeFeature !== 'compress' || uploadedFiles.length !== 1 || !compressAspectRatio) return;

    const widthInput = document.getElementById('customWidth');
    const heightInput = document.getElementById('customHeight');
    if (!widthInput || !heightInput) return;

    if (changedField === 'width') {
        const width = Number(widthInput.value);
        if (Number.isFinite(width) && width > 0) {
            heightInput.value = Math.max(1, Math.round(width / compressAspectRatio));
        }
    } else if (changedField === 'height') {
        const height = Number(heightInput.value);
        if (Number.isFinite(height) && height > 0) {
            widthInput.value = Math.max(1, Math.round(height * compressAspectRatio));
        }
    }
}

// Sinkronisasi dimensi dilakukan saat pengguna mengubah salah satu kolom.
const customWidthInput = document.getElementById('customWidth');
const customHeightInput = document.getElementById('customHeight');

if (customWidthInput && customHeightInput) {
    customWidthInput.addEventListener('input', () => syncCompressDimension('width'));
    customHeightInput.addEventListener('input', () => syncCompressDimension('height'));
}

// Configuration Mapping
const featureConfig = {
    convert: {
        title: "Convert Format Gambar",
        desc: "Ubah format gambar (.jpg, .png, .webp, .heif) secara massal dengan mudah.",
        icon: "refresh-cw"
    },
    compress: {
        title: "Compress Ukuran Gambar",
        desc: "Kecilkan ukuran file gambar tanpa mengurangi kualitas secara signifikan.",
        icon: "minimize-2"
    },
    upscale: {
        title: "Upscale Gambar",
        desc: "Perbesar resolusi & tajamkan tekstur detail gambar menggunakan AI (Maks. 1 file).",
        icon: "sparkles"
    }
};

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

function triggerFileInput() {
    fileInput.click();
}

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#191b1e';
});
dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '#191b1e';
});
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#191b1e';
    if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
    }
});

function selectFeature(feature) {
    activeFeature = feature;
    uploadedFiles = [];

    resetOptionsForm();

    document.getElementById('result-panel').classList.add('hidden');
    document.getElementById('result-cards-wrapper').innerHTML = '';
    document.getElementById('options-panel').classList.add('hidden');
    updateGalleryUI();
    updateFloatingDownloadAllBtn();

    document.querySelectorAll('.feature-btn').forEach(btn => {
        btn.classList.remove('feature-btn-active');
        btn.classList.add('feature-btn-inactive');
    });

    const activeBtn = document.getElementById(`btn-${feature}`);
    activeBtn.classList.remove('feature-btn-inactive');
    activeBtn.classList.add('feature-btn-active');

    document.getElementById('workspace').classList.remove('hidden');
    document.getElementById('active-title').innerText = featureConfig[feature].title;
    document.getElementById('active-desc').innerText = featureConfig[feature].desc;

    document.querySelectorAll('.feature-control').forEach(el => el.classList.add('hidden'));
    document.getElementById(`controls-${feature}`).classList.remove('hidden');
}

function resetOptionsForm() {
    compressAspectRatio = null;
    compressOriginalWidth = null;
    compressOriginalHeight = null;

    const targetFormat = document.getElementById('targetFormat');
    if (targetFormat) targetFormat.selectedIndex = 0;

    const targetSizeMB = document.getElementById('targetSizeMB');
    if (targetSizeMB) targetSizeMB.value = '';

    const customWidth = document.getElementById('customWidth');
    if (customWidth) customWidth.value = '';

    const customHeight = document.getElementById('customHeight');
    if (customHeight) customHeight.value = '';

    const targetSizeUnit = document.getElementById('targetSizeUnit');
    if (targetSizeUnit) targetSizeUnit.value = 'MB';

    const dimensionGroup = document.getElementById('compress-dimension-group');
    if (dimensionGroup) dimensionGroup.style.display = 'block';
}

function resetAll() {
    activeFeature = null;
    uploadedFiles = [];
    resetOptionsForm();

    document.getElementById('workspace').classList.add('hidden');
    document.getElementById('options-panel').classList.add('hidden');
    document.getElementById('result-panel').classList.add('hidden');
    document.getElementById('result-cards-wrapper').innerHTML = '';

    updateGalleryUI();
    updateFloatingDownloadAllBtn();

    document.querySelectorAll('.feature-btn').forEach(btn => {
        btn.classList.remove('feature-btn-active');
        btn.classList.add('feature-btn-inactive');
    });
}

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        handleFiles(e.target.files);
        fileInput.value = '';
    }
}

async function handleFiles(files) {
    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

    // Daftar ekstensi atau tipe MIME yang diizinkan (gambar pada umumnya)
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'tiff', 'bmp'];

    const prevCount = uploadedFiles.length;

    for (let file of files) {
        // Mendapatkan ekstensi file dari nama file
        const fileExt = file.name.split('.').pop().toLowerCase();

        // Validasi apakah ekstensi termasuk dalam format gambar yang didukung
        // Atau Anda juga bisa mengecek file.type.startsWith('image/')
        const isImageExtension = allowedExtensions.includes(fileExt);
        const isMimeImage = file.type && file.type.startsWith('image/');

        if (!isImageExtension && !isMimeImage) {
            alert("Sistem tidak mendukung format yang dipilih");
            continue; // Lewati file yang tidak valid
        }

        if (file.size > MAX_SIZE) {
            alert(`File ${file.name} terlalu besar! Maksimal 10 MB.`);
            continue;
        }

        if (activeFeature === 'upscale') {
            uploadedFiles = [file];
            break;
        } else {
            uploadedFiles.push(file);
        }
    }

    if (uploadedFiles.length > 0) {
        updateGalleryUI();
        updateFloatingDownloadAllBtn();
        document.getElementById('options-panel').classList.remove('hidden');

        checkCompressDimensionVisibility();

        if (activeFeature === 'compress' && prevCount <= 1 && uploadedFiles.length > 1) {
            showCompressWarningModal();
        }

        if (activeFeature === 'compress' && uploadedFiles.length === 1) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    setCompressOriginalDimensions(img.width, img.height);
                };

                img.src = e.target.result;
            };

            reader.readAsDataURL(uploadedFiles[0]);
        }
    }
}

function checkCompressDimensionVisibility() {
    if (activeFeature !== 'compress') return;

    const dimensionGroup = document.getElementById('compress-dimension-group');
    const gridContainer = document.querySelector('#controls-compress .control-grid-2');

    if (!dimensionGroup || !gridContainer) return;

    if (uploadedFiles.length > 1) {
        dimensionGroup.style.display = 'none';
        gridContainer.classList.remove('single-mode');
        gridContainer.classList.add('mass-mode');
    } else {
        dimensionGroup.style.display = 'block';
        gridContainer.classList.remove('mass-mode');
        gridContainer.classList.add('single-mode');
    }
}

function showCompressWarningModal() {
    const existingModal = document.getElementById('custom-modal-overlay');
    if (existingModal) existingModal.remove();

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'custom-modal-overlay';
    modalOverlay.className = 'modal-overlay';

    modalOverlay.innerHTML = `
        <div class="modal-box">
            <div class="modal-icon-badge">
                <i data-lucide="info" class="modal-icon-svg"></i>
            </div>
            <h3 class="modal-title">Pemberitahuan Kompresi Massal</h3>
            <p class="modal-body-text">
                Untuk pemrosesan compress gambar lebih dari satu, pengaturan dimensi gambar ditiadakan agar dimensi dan rasio asli tetap terjaga secara otomatis guna mencegah penurunan kualitas akibat kompresi ekstrem.
            </p>
            <button id="modal-close-btn" class="modal-close-btn">
                Mengerti
            </button>
        </div>
    `;

    document.body.appendChild(modalOverlay);
    lucide.createIcons();

    document.getElementById('modal-close-btn').onclick = () => {
        modalOverlay.remove();
    };
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);

    const resultPanel = document.getElementById('result-panel');
    const wrapper = document.getElementById('result-cards-wrapper');

    if (wrapper) {
        wrapper.innerHTML = '';
    }

    if (uploadedFiles.length === 0) {
        document.getElementById('options-panel').classList.add('hidden');
        if (resultPanel) resultPanel.classList.add('hidden');
        resetOptionsForm();
    } else {
        checkCompressDimensionVisibility();

        // Jika sisa file sekarang tepat 1 buah, perbarui otomatis nilai input dimensi
        // dengan dimensi foto yang tersisa tersebut (bukan foto pertama sebelumnya)
        if (uploadedFiles.length === 1 && activeFeature === 'compress') {
            const remainingFile = uploadedFiles[0];
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    setCompressOriginalDimensions(img.width, img.height);
                };

                img.src = e.target.result;
            };

            reader.readAsDataURL(remainingFile);
        }

        if (resultPanel && !resultPanel.classList.contains('hidden')) {
            processImages();
        }
    }

    updateGalleryUI();
    updateFloatingDownloadAllBtn();
}

function updateGalleryUI() {
    const initialContent = document.getElementById('dropzone-initial-content');
    const galleryGrid = document.getElementById('image-gallery-grid');

    if (uploadedFiles.length === 0) {
        initialContent.classList.remove('hidden');
        galleryGrid.classList.add('hidden');
        galleryGrid.innerHTML = '';
        return;
    }

    initialContent.classList.add('hidden');
    galleryGrid.classList.remove('hidden');
    galleryGrid.innerHTML = '';

    uploadedFiles.forEach((file, index) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const card = document.createElement('div');
                card.className = 'gallery-card-wrapper';

                const fileExt = file.name.split('.').pop().toUpperCase();

                card.innerHTML = `
                    <div class="gallery-thumbnail-card">
                        <img src="${e.target.result}" class="gallery-thumbnail-img">
                        <button type="button" class="gallery-delete-btn" onclick="event.stopPropagation(); removeFile(${index})">✕</button>
                        <div class="gallery-badge-ext">
                            ${fileExt}
                        </div>
                    </div>
                    <div class="gallery-meta-info">
                        <div><b>Ukuran:</b> ${formatFileSize(file.size)}</div>
                        <div><b>Dimensi:</b> ${img.width} x ${img.height} px</div>
                    </div>
                `;

                galleryGrid.appendChild(card);
            };

            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    });

    if (activeFeature !== 'upscale') {
        const addBtnContainer = document.createElement('div');
        addBtnContainer.className = 'gallery-card-wrapper';

        const addBtn = document.createElement('div');
        addBtn.className = 'gallery-add-btn';
        addBtn.innerHTML = `
            <i data-lucide="plus" class="icon-add-plus"></i>
            <span class="gallery-add-text">Tambah</span>
        `;

        addBtn.onclick = (e) => {
            e.stopPropagation();
            fileInput.click();
        };

        addBtnContainer.appendChild(addBtn);
        galleryGrid.appendChild(addBtnContainer);
        lucide.createIcons();
    }
}

async function processImages() {
    if (uploadedFiles.length === 0) return;
    // Validasi target ukuran file sebelum memulai proses.
    if (activeFeature === 'compress') {
        const targetInput = document.getElementById('targetSizeMB');
        const targetUnit = document.getElementById('targetSizeUnit');

        const targetValue = parseFloat(targetInput.value);
        const unit = targetUnit.value;

        if (!isNaN(targetValue) && targetValue > 0) {
            const multiplier = unit === 'MB'
                ? 1024 * 1024
                : 1024;

            const targetBytes = targetValue * multiplier;

            for (const file of uploadedFiles) {
                if (targetBytes > file.size) {
                    alert(
                        'Target ukuran file kompresi melebihi ukuran gambar sebenarnya, harap diubah.'
                    );
                    return;
                }
            }
        }
    }

    const resultPanel = document.getElementById('result-panel');
    const wrapper = document.getElementById('result-cards-wrapper');

    wrapper.innerHTML = '';
    resultPanel.classList.remove('hidden');

    const floatContainer = document.getElementById('floating-download-all-container');
    if (floatContainer) floatContainer.style.display = 'none';

    if (activeFeature === 'upscale') {
        const file = uploadedFiles[0];
        const cardId = 'result-upscale';

        wrapper.innerHTML = `
            <div class="preview-card" id="${cardId}">
                <h4 class="preview-title">Memproses AI Upscale: ${file.name}</h4>
                <div class="image-preview-container image-preview-container-upscale relative-container">
                    <div class="loading-overlay" id="upscaleLoadingOverlay">
                        <div class="spinner"></div>
                        <span class="spinner-text spinner-text-upscale" id="loadingText">Memproses AI Upscaling... 0 detik</span>
                        <span class="spinner-text spinner-text-upscale-hint hidden" id="upscaleTimeHint">Gambar beresolusi besar dapat membutuhkan beberapa menit.</span>
                    </div>
                </div>
            </div>
        `;

        const originalDataUrl = await new Promise((resolve) => {
            const r = new FileReader();
            r.onload = (e) => resolve(e.target.result);
            r.readAsDataURL(file);
        });

        const origImgObj = new Image();
        await new Promise((r) => {
            origImgObj.onload = r;
            origImgObj.src = originalDataUrl;
        });

        const origWidth = origImgObj.width;
        const origHeight = origImgObj.height;

        const formData = new FormData();
        formData.append('image', file);

        let elapsedTimer = null;
        const upscaleStartedAt = Date.now();

        try {
            const loadingTextEl = document.getElementById('loadingText');
            const timeHintEl = document.getElementById('upscaleTimeHint');

            elapsedTimer = setInterval(() => {
                const elapsedSeconds = Math.floor((Date.now() - upscaleStartedAt) / 1000);

                if (loadingTextEl) {
                    loadingTextEl.innerText = `Memproses AI Upscaling... ${elapsedSeconds} detik`;
                }

                if (elapsedSeconds > 15 && timeHintEl) {
                    timeHintEl.classList.remove('hidden');
                }
            }, 1000);

            const response = await fetch(`${API_BASE_URL}/upscale`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = 'Gagal memproses server Python.';

                try {
                    const errorData = await response.json();
                    if (errorData.error) errorMessage = errorData.error;
                } catch (_) {
                    // Respons bukan JSON; gunakan pesan default.
                }

                throw new Error(errorMessage);
            }

            const blob = await response.blob();
            clearInterval(elapsedTimer);

            const resultUrl = URL.createObjectURL(blob);
            const upscaledWidth = origWidth * 4;
            const upscaledHeight = origHeight * 4;
            const origExt = file.name.split('.').pop().toUpperCase();

            document.getElementById(cardId).innerHTML = `
                <h4 class="preview-title">Pratinjau AI Upscale: ${file.name}</h4>
                <div class="preview-comparison-grid">
                    <div>
                        <p class="preview-col-label-orig">Foto Asli</p>
                        <div class="image-preview-container image-preview-container-compact">
                            <img src="${originalDataUrl}" class="preview-img">
                        </div>
                        <div class="meta-box">
                            <p><b>Format:</b> ${origExt}</p>
                            <p><b>Ukuran:</b> ${formatFileSize(file.size)}</p>
                            <p><b>Dimensi:</b> ${origWidth} x ${origHeight} px</p>
                        </div>
                    </div>
                    <div>
                        <p class="preview-col-label-res">Hasil Upscale (4x)</p>
                        <div class="image-preview-container image-preview-container-compact">
                            <img src="${resultUrl}" class="preview-img">
                        </div>
                        <div class="meta-box">
                            <p><b>Format:</b> PNG</p>
                            <p><b>Ukuran:</b> ${formatFileSize(blob.size)}</p>
                            <p><b>Dimensi:</b> ${upscaledWidth} x ${upscaledHeight} px</p>
                        </div>
                    </div>
                </div>
                <a href="${resultUrl}" download="upscaled_${file.name}" class="download-btn">
                    <i data-lucide="download"></i>Unduh Gambar
                </a>
            `;

            lucide.createIcons();

        } catch (error) {
            if (elapsedTimer) clearInterval(elapsedTimer);
            alert('Error: ' + error.message);
            resultPanel.classList.add('hidden');
        }

        return;
    }
    for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const cardId = `result-item-${i}`;

        const cardDiv = document.createElement('div');
        cardDiv.className = 'preview-card';
        cardDiv.id = cardId;
        cardDiv.innerHTML = `
            <h4 class="preview-title">Memproses: ${file.name}</h4>
            <div class="image-preview-container relative-container">
                <div class="loading-overlay">
                    <div class="spinner"></div>
                    <span class="spinner-text">Memproses...</span>
                </div>
            </div>
        `;
        wrapper.appendChild(cardDiv);

        await new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = async (e) => {
                const originalDataUrl = e.target.result;
                const img = new Image();

                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    let targetWidth = img.width;
                    let targetHeight = img.height;
                    let outputMime = "image/jpeg";
                    let quality = 0.92;
                    let preEncodedResultUrl = null;

                    if (activeFeature === 'convert') {
                        outputMime = document.getElementById('targetFormat').value;

                        canvas.width = targetWidth;
                        canvas.height = targetHeight;

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0);

                        quality = 0.95;

                    } else if (activeFeature === 'compress') {
                        const origName = file.name.toLowerCase();

                        if (origName.endsWith('.png') || origName.endsWith('.webp') || file.type === 'image/png' || file.type === 'image/webp') {
                            outputMime = 'image/webp';
                        } else if (origName.endsWith('.heic') || origName.endsWith('.heif')) {
                            outputMime = 'image/heif';
                        } else {
                            outputMime = 'image/jpeg';
                        }

                        if (uploadedFiles.length > 1) {
                            targetWidth = img.width;
                            targetHeight = img.height;
                        } else {
                            const userWidth = parseInt(document.getElementById('customWidth').value, 10);
                            const userHeight = parseInt(document.getElementById('customHeight').value, 10);

                            if (Number.isFinite(userWidth) && userWidth > 0) {
                                targetWidth = userWidth;
                                targetHeight = Math.max(1, Math.round(userWidth / (img.width / img.height)));
                            } else if (Number.isFinite(userHeight) && userHeight > 0) {
                                targetHeight = userHeight;
                                targetWidth = Math.max(1, Math.round(userHeight * (img.width / img.height)));
                            }
                        }

                        const targetSizeInput = parseFloat(
                            document.getElementById('targetSizeMB').value
                        );

                        const targetSizeUnit = document.getElementById('targetSizeUnit').value;

                        const sizeMultiplier = targetSizeUnit === 'MB'
                            ? 1024 * 1024
                            : 1024;

                        const targetMaxBytes = targetSizeInput * sizeMultiplier;

                        // Target 2 MB berarti sasaran antara 1 MB sampai 2 MB.
                        // Target 1 MB berarti hasil maksimal 1 MB.
                        const targetMinBytes = targetSizeInput > 1
                            ? (targetSizeInput - 1) * sizeMultiplier
                            : 0;

                        canvas.width = targetWidth;
                        canvas.height = targetHeight;

                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';

                        let currentImg = img;
                        let currWidth = img.width;
                        let currHeight = img.height;

                        while (currWidth / 2 >= targetWidth) {
                            currWidth = Math.floor(currWidth / 2);
                            currHeight = Math.floor(currHeight / 2);

                            let stepCanvas = document.createElement('canvas');
                            stepCanvas.width = currWidth;
                            stepCanvas.height = currHeight;

                            let stepCtx = stepCanvas.getContext('2d');
                            stepCtx.imageSmoothingEnabled = true;
                            stepCtx.imageSmoothingQuality = 'high';
                            stepCtx.drawImage(currentImg, 0, 0, currWidth, currHeight);

                            currentImg = stepCanvas;
                        }

                        ctx.drawImage(currentImg, 0, 0, targetWidth, targetHeight);

                        if (
                            !isNaN(targetSizeInput) &&
                            targetSizeInput > 0
                        ) {
                            let minQuality = 0.01;
                            let maxQuality = 1.0;

                            let bestQuality = minQuality;
                            let bestUrl = canvas.toDataURL(outputMime, bestQuality);

                            const getDataUrlSize = (dataUrl) => {
                                const base64 = dataUrl.split(',')[1];
                                return Math.ceil(base64.length * 3 / 4);
                            };

                            let bestSize = getDataUrlSize(bestUrl);

                            // Mencari kualitas tertinggi yang masih memenuhi batas maksimal.
                            for (let attempt = 0; attempt < 18; attempt++) {
                                const testQuality = (minQuality + maxQuality) / 2;

                                const testUrl = canvas.toDataURL(
                                    outputMime,
                                    testQuality
                                );

                                const testSize = getDataUrlSize(testUrl);

                                if (testSize <= targetMaxBytes) {
                                    bestQuality = testQuality;
                                    bestUrl = testUrl;
                                    bestSize = testSize;

                                    minQuality = testQuality;
                                } else {
                                    maxQuality = testQuality;
                                }
                            }

                            // Menyimpan hasil encoding agar tidak perlu encoding ulang.
                            preEncodedResultUrl = bestUrl;
                            quality = bestQuality;
                        }
                    }

                    const resultUrl = preEncodedResultUrl || canvas.toDataURL(outputMime, quality);
                    const head = `data:${outputMime};base64,`;
                    const sizeInBytes = Math.round((resultUrl.length - head.length) * 3 / 4);
                    const ext = outputMime.includes('jpeg') ? 'jpg' : outputMime.split('/')[1];

                    const origSize = file.size;
                    let diffPercent = Number((((origSize - sizeInBytes) / origSize) * 100).toFixed(2));

                    const percentText = activeFeature === 'compress' && diffPercent !== 0
                        ? (diffPercent > 0 ? ` (-${diffPercent.toFixed(2)}%)` : ` (+${Math.abs(diffPercent).toFixed(2)}%)`)
                        : '';

                    const origExt = file.name.split('.').pop().toUpperCase();

                    cardDiv.innerHTML = `
                        <h4 class="preview-title">Pratinjau: ${file.name}</h4>
                        <div class="preview-comparison-grid">
                            <div>
                                <p class="preview-col-label-orig">Foto Asli</p>
                                <div class="image-preview-container image-preview-container-compact">
                                    <img src="${originalDataUrl}" class="preview-img">
                                </div>
                                <div class="meta-box">
                                    <p><b>Format:</b> ${origExt}</p>
                                    <p><b>Ukuran:</b> ${formatFileSize(file.size)}</p>
                                    <p><b>Dimensi:</b> ${img.width} x ${img.height} px</p>
                                </div>
                            </div>
                            <div>
                                <p class="preview-col-label-res">Hasil Proses</p>
                                <div class="image-preview-container image-preview-container-compact">
                                    <img src="${resultUrl}" class="preview-img">
                                </div>
                                <div class="meta-box">
                                    <p><b>Format:</b> ${ext.toUpperCase()}</p>
                                    <p><b>Ukuran:</b> ${formatFileSize(sizeInBytes)}${percentText}</p>
                                    <p><b>Dimensi:</b> ${targetWidth} x ${targetHeight} px</p>
                                </div>
                            </div>
                        </div>
                        <a href="${resultUrl}" download="result_${Date.now()}_${i}.${ext}" class="download-btn">
                            <i data-lucide="download"></i>Unduh Gambar
                        </a>
                    `;

                    lucide.createIcons();
                    resolve();
                };

                img.src = originalDataUrl;
            };

            reader.readAsDataURL(file);
        });
    }

    setTimeout(() => {
        updateFloatingDownloadAllBtn();
    }, 500);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 KB';

    const kb = bytes / 1024;

    if (kb < 1024) {
        return kb.toFixed(2) + ' KB';
    } else {
        const mb = kb / 1024;
        const roundedMb = Math.ceil(mb * 100) / 100;
        return roundedMb.toFixed(2) + ' MB';
    }
}

function updateFloatingDownloadAllBtn() {
    let floatContainer = document.getElementById('floating-download-all-container');

    if (!floatContainer) {
        floatContainer = document.createElement('div');
        floatContainer.id = 'floating-download-all-container';
        floatContainer.className = 'floating-download-container';
        document.body.appendChild(floatContainer);
    }

    const resultPanel = document.getElementById('result-panel');
    const isResultVisible = resultPanel && !resultPanel.classList.contains('hidden');

    const remainingCardsCount = document.querySelectorAll('#result-cards-wrapper .download-btn').length;

    if (remainingCardsCount > 1 && (activeFeature === 'convert' || activeFeature === 'compress') && isResultVisible) {
        floatContainer.style.display = 'block';
        floatContainer.innerHTML = `
            <button onclick="downloadAllImages()" class="floating-download-btn">
                <i data-lucide="download" class="icon-download-svg"></i>Unduh Semua (${remainingCardsCount})
            </button>
        `;

        lucide.createIcons();
    } else {
        floatContainer.style.display = 'none';
    }
}

async function downloadAllImages() {
    if (typeof JSZip === 'undefined') {
        const downloadButtons = document.querySelectorAll('#result-cards-wrapper .download-btn');

        downloadButtons.forEach((btn, index) => {
            setTimeout(() => btn.click(), index * 300);
        });

        return;
    }

    const zip = new JSZip();
    const folder = zip.folder("hasil_image_in");
    const downloadButtons = document.querySelectorAll('#result-cards-wrapper .download-btn');

    if (downloadButtons.length === 0) return;

    const floatContainer = document.getElementById('floating-download-all-container');

    if (floatContainer) {
        const btnEl = floatContainer.querySelector('button');
        if (btnEl) btnEl.innerText = "Menyiapkan ZIP...";
    }

    try {
        for (let i = 0; i < downloadButtons.length; i++) {
            const btn = downloadButtons[i];
            const url = btn.href;
            const filename = btn.getAttribute('download') || `image_${i + 1}.jpg`;

            const response = await fetch(url);
            const blob = await response.blob();

            folder.file(filename, blob);
        }

        const content = await zip.generateAsync({ type: "blob" });
        const zipUrl = URL.createObjectURL(content);

        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = `ImageIn_Batch_${Date.now()}.zip`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(zipUrl);

    } catch (error) {
        console.error("Gagal membuat zip:", error);
        alert("Terjadi kesalahan saat mengompresi file ke ZIP.");
    } finally {
        updateFloatingDownloadAllBtn();
    }
}
