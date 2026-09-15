// Centers page: text search + material chip filtering, combined
const searchInput = document.getElementById('centerSearch');
const materialChips = document.querySelectorAll('#materialChips .chip');
const centerCards = document.querySelectorAll('#centerList .center-card');
const centersEmpty = document.getElementById('centersEmpty');

let activeMaterial = 'all';

function applyCenterFilters() {
  const query = (searchInput.value || '').trim().toLowerCase();
  let visibleCount = 0;

  centerCards.forEach((card) => {
    const name = card.dataset.name || '';
    const materials = card.dataset.materials || '';

    const matchesMaterial = activeMaterial === 'all' || materials.includes(activeMaterial);
    const matchesQuery = query === '' || name.includes(query);
    const match = matchesMaterial && matchesQuery;

    card.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });

  if (centersEmpty) {
    centersEmpty.classList.toggle('active', visibleCount === 0);
  }
}

if (searchInput) {
  searchInput.addEventListener('input', applyCenterFilters);
}

materialChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    materialChips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    activeMaterial = chip.dataset.material;
    applyCenterFilters();
  });
});