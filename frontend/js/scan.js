// Scan page: upload -> preview -> REAL classification (Teachable Machine
// model running in the browser) -> save result to backend -> result state.
requireLogin();

// ====================================================================
// SET THIS once your Teachable Machine model is trained and published:
// Teachable Machine gives you a link like
//   https://teachablemachine.withgoogle.com/models/AbCdEfGh/
// paste that whole thing here (keep the trailing slash).
//
// IMPORTANT: your model's class names must be EXACTLY these seven,
// lowercase, no spaces — matching backend/src/utils/classifier.js:
//   plastic, paper, glass, metal, organic, ewaste, trash
//
// "trash" is a catch-all: train it on stuff that ISN'T a clean example
// of the other six (chip bags, styrofoam, greasy/soiled paper, broken
// ceramics, mixed-material wrappers, etc.) — anything that doesn't look
// like a clearly recyclable/compostable/e-waste item falls here.
// ====================================================================
const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/8hF2txhTT/';

let tmModel = null;
let modelLoadFailed = false;

async function loadModel() {
  if (!MODEL_URL) return; // nothing trained yet — analyze will use a mock fallback
  try {
    const modelURL = MODEL_URL + 'model.json';
    const metadataURL = MODEL_URL + 'metadata.json';
    tmModel = await tmImage.load(modelURL, metadataURL);
    console.log('Teachable Machine model loaded:', tmModel.getTotalClasses(), 'classes');
  } catch (err) {
    modelLoadFailed = true;
    console.error('Could not load the Teachable Machine model. Check MODEL_URL in scan.js.', err);
  }
}
loadModel();

const KNOWN_CATEGORIES = ['plastic', 'paper', 'glass', 'metal', 'organic', 'ewaste', 'trash'];

// Runs the loaded model against the preview photo. Falls back to a random
// (but clearly-labeled) mock result if no model is loaded yet, so the page
// stays usable while the model is still being trained.
async function classifyPreviewImage() {
  if (tmModel) {
    try { await previewImg.decode(); } catch (_) { /* image may already be ready */ }
    const predictions = await tmModel.predict(previewImg);
    predictions.sort((a, b) => b.probability - a.probability);
    const top = predictions[0];
    return { category: top.className, confidence: Math.round(top.probability * 100), isMock: false };
  }

  const category = KNOWN_CATEGORIES[Math.floor(Math.random() * KNOWN_CATEGORIES.length)];
  const confidence = 80 + Math.floor(Math.random() * 15);
  return { category, confidence, isMock: true };
}

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

let selectedFile = null;

function showPreview(file) {
  selectedFile = file;
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

function renderResult(scan) {
  document.querySelector('.result-pts').textContent = `+${scan.points} pts`;
  document.querySelector('.result-banner div:last-child div:last-child').textContent = scan.item_name;

  const badge = document.getElementById('recyclableBadge');
  if (scan.recyclable) {
    badge.textContent = '♻️ Recyclable — take it to a recycling center';
    badge.className = 'recyclable-badge is-recyclable';
  } else {
    badge.textContent = `🚫 Not recyclable — goes in the ${scan.bin}`;
    badge.className = 'recyclable-badge is-not-recyclable';
  }

  const findCenterBtn = document.getElementById('findCenterBtn');
  findCenterBtn.style.display = scan.recyclable ? '' : 'none';

  const rows = document.querySelectorAll('.result-detail-row span:last-child');
  rows[0].textContent = scan.bin;
  rows[1].textContent = `${scan.confidence}%`;
  rows[2].textContent = scan.disposal_note;
}

if (analyzeBtn) {
  analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    scanningBadge.style.display = 'inline-block';
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing…';

    try {
      const prediction = await classifyPreviewImage();

      if (prediction.isMock) {
        console.warn('No trained model loaded yet — showing a random demo result. Set MODEL_URL in js/scan.js once your Teachable Machine model is published.');
      }

      const data = await apiFetch('/scans', {
        method: 'POST',
        body: JSON.stringify({
          category: prediction.category,
          confidence: prediction.confidence
        })
      });

      renderResult(data.scan);
      previewWrap.classList.remove('active');
      resultState.classList.add('active');

      // Points changed — refresh the nav's points pill from the server
      apiFetch('/auth/me').then((res) => {
        Auth.setSession(Auth.getToken(), res.user);
        if (typeof renderUserChrome === 'function') renderUserChrome(res.user);
      }).catch(() => {});
    } catch (err) {
      alert(err.message || 'Could not analyze this photo. Is the backend running?');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.textContent = 'Analyze photo';
    }
  });
}

if (retakeBtn) {
  retakeBtn.addEventListener('click', () => {
    previewWrap.classList.remove('active');
    uploadState.style.display = 'block';
    photoInput.value = '';
    selectedFile = null;
  });
}

if (scanAnotherBtn) {
  scanAnotherBtn.addEventListener('click', () => {
    resultState.classList.remove('active');
    uploadState.style.display = 'block';
    photoInput.value = '';
    selectedFile = null;
  });
}
