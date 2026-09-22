// Dashboard: pulls stats + recent activity from the API and fills in the page.
// requireLogin() + user chrome (avatar/points) already handled by app.js.

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
  const date = new Date(isoString + 'Z'); // SQLite gives UTC without a suffix
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

function renderActivity(scans) {
  const el = document.getElementById('activityList');
  if (!scans.length) {
    el.innerHTML = '<p style="color:var(--ink-soft); font-size:0.9rem; padding:14px 0;">No scans yet — head to the Scan page to log your first item.</p>';
    return;
  }
  el.innerHTML = scans.map((scan) => `
    <div class="activity-row">
      <div class="activity-left">
        <div class="activity-icon">${iconSvg(scan.category)}</div>
        <div>
          <div class="activity-name">${scan.item_name} — ${scan.bin}</div>
          <div class="activity-date">${formatDate(scan.created_at)}</div>
        </div>
      </div>
      <div class="activity-pts">+${scan.points} pts</div>
    </div>
  `).join('');
}

function renderNearbyCenters(centers) {
  const el = document.getElementById('nearbyCenters');
  if (!centers.length) {
    el.innerHTML = '<p style="color:var(--ink-soft); font-size:0.9rem;">No centers found.</p>';
    return;
  }
  el.innerHTML = centers.slice(0, 3).map((c) => `
    <div class="center-mini">
      <div class="center-mini-name">${c.name}</div>
      <div class="center-mini-dist">${c.distanceKm} km away</div>
    </div>
  `).join('');
}

async function loadDashboard() {
  try {
    const [dashboard, centersData] = await Promise.all([
      apiFetch('/dashboard'),
      apiFetch('/centers').catch(() => ({ centers: [] })) // centers are non-critical for this page
    ]);

    const user = Auth.getUser();
    if (user) {
      const firstName = user.name.split(' ')[0];
      document.getElementById('greeting').textContent = `Hi ${firstName}, here's where things stand`;
    }
    document.getElementById('greetingSub').textContent = dashboard.itemsThisMonth > 0
      ? `You've logged ${dashboard.itemsThisMonth} scan${dashboard.itemsThisMonth === 1 ? '' : 's'} this month. Nice work.`
      : `Scan an item this month to start building your streak.`;

    document.getElementById('statPoints').textContent = dashboard.points.toLocaleString();
    document.getElementById('statItems').textContent = dashboard.itemsScanned.toLocaleString();
    document.getElementById('statItemsMonth').textContent = `${dashboard.itemsThisMonth} this month`;
    document.getElementById('statAccuracy').textContent = dashboard.accuracy === null ? '—' : `${dashboard.accuracy}%`;

    const target = dashboard.nextRewardTarget;
    const pct = Math.min(100, Math.round((dashboard.points / target) * 100));
    document.getElementById('rewardTarget').textContent = `${dashboard.points.toLocaleString()} / ${target.toLocaleString()} pts`;
    document.getElementById('rewardProgressFill').style.width = `${pct}%`;
    document.getElementById('rewardNote').textContent = dashboard.pointsToNextReward > 0
      ? `${dashboard.pointsToNextReward.toLocaleString()} points to a free reusable tote from a partner recycling center.`
      : `You've earned enough for a reward — redeem it at any partner recycling center.`;

    renderActivity(dashboard.recentActivity);
    renderNearbyCenters(centersData.centers || []);
  } catch (err) {
    console.error(err);
  }
}

loadDashboard();
