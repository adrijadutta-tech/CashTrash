// Scan page: upload -> preview -> real API analysis -> result
requireLogin();

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
  document.querySelector('.result-banner div:last-child div:last-child').textContent =
    `${scan.category.charAt(0).toUpperCase() + scan.category.slice(1)} · ${scan.item_name}`;

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
      const formData = new FormData();
      formData.append('photo', selectedFile);

      const data = await apiFetch('/scans', { method: 'POST', body: formData });

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
