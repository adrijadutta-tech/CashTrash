// Shared across dashboard/scan/history/centers: requires login, fills in
// the nav's points pill + avatar from the cached user, then refreshes
// from the API in case points changed elsewhere.
requireLogin();

function renderUserChrome(user) {
  if (!user) return;
  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  document.querySelectorAll('.avatar').forEach((el) => { el.textContent = initials; });
  document.querySelectorAll('.points-pill').forEach((el) => { el.textContent = `${user.points.toLocaleString()} pts`; });
  document.querySelectorAll('.mobile-points span:first-child').forEach((el) => { el.textContent = user.name; });
  document.querySelectorAll('.mobile-points span:last-child').forEach((el) => { el.textContent = `${user.points.toLocaleString()} pts`; });
}

// Paint immediately from cache so the page doesn't flash empty, then confirm from the server.
renderUserChrome(Auth.getUser());

apiFetch('/auth/me')
  .then((data) => {
    Auth.setSession(Auth.getToken(), data.user);
    renderUserChrome(data.user);
  })
  .catch(() => {
    // requireLogin() already redirects on a real 401 via apiFetch's own handling
  });

document.querySelectorAll('.avatar, #logoutLink').forEach((el) => {
  el.style.cursor = 'pointer';
  el.addEventListener('click', (e) => {
    e.preventDefault();
    Auth.clearSession();
    window.location.href = 'login.html';
  });
});
