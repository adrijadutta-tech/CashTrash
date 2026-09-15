// Scan page: upload -> preview -> simulated analysis -> result
const uploadState = document.getElementById('uploadState');
const previewWrap = document.getElementById('previewWrap');
const resultState = document.getElementById('resultState');
const photoInput = document.getElementById('photoInput');
const previewImg = document.getElementById('previewImg');
const scanningBadge = document.getElementById('scanningBadge');

const cameraBtn = document.getElementById('cameraBtn');
const uploadBtn = document.getElementById('uploadBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const retakeBtn = document.getElementById('retakeBtn');
const scanAnotherBtn = document.getElementById('scanAnotherBtn');
const dropzone = document.getElementById('dropzone');

function showPreview(file) {
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  scanningBadge.style.display = 'none';
  uploadState.style.display = 'none';
  previewWrap.classList.add('active');
  resultState.classList.remove('active');
}

function openPicker(useCamera) {
  if (useCamera) {
    photoInput.setAttribute('capture', 'environment');
  } else {
    photoInput.removeAttribute('capture');
  }
  photoInput.click();
}

if (cameraBtn) cameraBtn.addEventListener('click', () => openPicker(true));
if (uploadBtn) uploadBtn.addEventListener('click', () => openPicker(false));

if (photoInput) {
  photoInput.addEventListener('change', () => {
    if (photoInput.files && photoInput.files[0]) {
      showPreview(photoInput.files[0]);
    }
  });
}

// Drag & drop support
if (dropzone) {
  ['dragover', 'dragleave', 'drop'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => e.preventDefault());
  });
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) showPreview(file);
  });
}

if (analyzeBtn) {
  analyzeBtn.addEventListener('click', () => {
    scanningBadge.style.display = 'inline-block';
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing…';

    // Simulated AI processing delay for the prototype demo
    setTimeout(() => {
      previewWrap.classList.remove('active');
      resultState.classList.add('active');
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze photo';
    }, 1200);
  });
}

if (retakeBtn) {
  retakeBtn.addEventListener('click', () => {
    previewWrap.classList.remove('active');
    uploadState.style.display = 'block';
    photoInput.value = '';
  });
}

if (scanAnotherBtn) {
  scanAnotherBtn.addEventListener('click', () => {
    resultState.classList.remove('active');
    uploadState.style.display = 'block';
    photoInput.value = '';
  });
}