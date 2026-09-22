// Centers page: fetches from the API whenever the search text or material
// chip changes (debounced so typing doesn't fire a request per keystroke).
// This page is public — no requireLogin() here, matching the backend route.

const searchInput = document.getElementById('centerSearch');
const materialChips = document.querySelectorAll('#materialChips .chip');
const centerList = document.getElementById('centerList');
const centersEmpty = document.getElementById('centersEmpty');

let activeMaterial = 'all';
let debounceTimer = null;

function centerCardHtml(c) {
  const tags = c.materials.map((m) => `<span class="center-tag">${m.charAt(0).toUpperCase() + m.slice(1)}</span>`).join('');
  const statusText = c.isOpen ? `Open · ${c.hoursNote.split('·')[1] || ''}`.trim() : c.hoursNote;
  return `
    <div class="card center-card">
      <div class="center-card-left">
        <h3>${c.name}</h3>
        <p class="center-addr">${c.address}</p>
        <div class="center-tags">${tags}</div>
      </div>
      <div class="center-card-right">
        <div class="center-dist">${c.distanceKm} km</div>
        <div class="center-hours">${c.hoursNote}</div>
        <a href="#" class="btn btn-outline" style="padding:9px 16px; font-size:0.85rem;">Directions</a>
      </div>
    </div>
  `;
}

async function loadCenters() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
  if (activeMaterial !== 'all') params.set('material', activeMaterial);

  try {
    const data = await apiFetch(`/centers?${params.toString()}`);
    if (!data.centers.length) {
      centerList.innerHTML = '';
      centersEmpty.classList.add('active');
      return;
    }
    centersEmpty.classList.remove('active');
    centerList.innerHTML = data.centers.map(centerCardHtml).join('');
  } catch (err) {
    centerList.innerHTML = `<p style="color:var(--ink-soft);">Couldn't load centers — is the backend running?</p>`;
  }
}

if (searchInput) {
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadCenters, 300);
  });
}

materialChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    materialChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeMaterial = chip.dataset.material;
    loadCenters();
  });
});

loadCenters();
