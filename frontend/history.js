// History page: filter chips show/hide matching rows and cards
const chips = document.querySelectorAll('#chipRow .chip');
const tableRows = document.querySelectorAll('#historyTable tbody tr');
const historyCards = document.querySelectorAll('#historyCards .history-card');
const emptyState = document.getElementById('emptyState');

function applyFilter(filter) {
  let visibleCount = 0;

  tableRows.forEach((row) => {
    const match = filter === 'all' || row.dataset.type === filter;
    row.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });

  historyCards.forEach((card) => {
    const match = filter === 'all' || card.dataset.type === filter;
    card.style.display = match ? '' : 'none';
  });

  if (emptyState) {
    emptyState.classList.toggle('active', visibleCount === 0);
  }
}

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    applyFilter(chip.dataset.filter);
  });
});
