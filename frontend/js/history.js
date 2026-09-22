// History page: fetches all scans once, renders table + mobile cards,
// then filters client-side when a chip is clicked (no refetch needed).
requireLogin();

const CATEGORY_ICON = {
  plastic: '<circle cx="12" cy="13" r="4"/><path d="M4 8h3l2-3h6l2 3h3v11H4z"/>',
  paper: '<path d="M4 4h16v16H4z"/><path d="M4 10h16"/>',
  glass: '<path d="M8 2h8l1 6-3 4v10H10V12L7 8z"/>',
  metal: '<circle cx="12" cy="12" r="9"/>',
  organic: '<path d="M12 21c-4-2-7-6-7-10a7 7 0 0 1 14 0c0 4-3 8-7 10z"/>',
  ewaste: '<rect x="5" y="2" width="14" height="20" rx="2"/>'
};

function iconSvg(category) {
  const path = CATEGORY_ICON[category] || CATEGORY_ICON.plastic;
  return `<svg viewBox="0 0 24 24" fill="none" stroke-width="2">${path}</svg>`;
}

function formatDate(isoString) {
  const date = new Date(isoString + 'Z');
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
}

const tableBody = document.getElementById('historyTableBody');
const cardList = document.getElementById('historyCards');
const emptyState = document.getElementById('emptyState');
const chips = document.querySelectorAll('#chipRow .chip');

let allScans = [];

function renderScans(scans) {
  if (!scans.length) {
    tableBody.innerHTML = '';
    cardList.innerHTML = '';
    emptyState.classList.add('active');
    return;
  }
  emptyState.classList.remove('active');

  tableBody.innerHTML = scans.map((s) => `
    <tr data-type="${s.category}">
      <td><span class="history-item-name"><span class="history-swatch">${iconSvg(s.category)}</span>${s.item_name}</span></td>
      <td>${s.bin}</td>
      <td class="history-pts">+${s.points}</td>
      <td>${formatDate(s.created_at)}</td>
    </tr>
  `).join('');

  cardList.innerHTML = scans.map((s) => `
    <div class="history-card" data-type="${s.category}">
      <div class="history-card-top">
        <span class="history-card-name"><span class="history-swatch">${iconSvg(s.category)}</span>${s.item_name}</span>
        <span class="history-pts">+${s.points}</span>
      </div>
      <div class="history-card-meta"><span>${s.bin}</span><span>${formatDate(s.created_at)}</span></div>
    </div>
  `).join('');
}

function applyFilter(filter) {
  const filtered = filter === 'all' ? allScans : allScans.filter((s) => s.category === filter);
  renderScans(filtered);
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    applyFilter(chip.dataset.filter);
  });
});

async function loadHistory() {
  try {
    const data = await apiFetch('/scans');
    allScans = data.scans;
    applyFilter('all');
  } catch (err) {
    tableBody.innerHTML = `<tr><td colspan="4" style="color:var(--ink-soft);">Couldn't load history — is the backend running?</td></tr>`;
  }
}

loadHistory();
