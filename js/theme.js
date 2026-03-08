/* === Dark Mode Toggle === */
(function () {
  const STORAGE_KEY = 'theme';

  function getPreferred() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.querySelector('.theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  // Apply immediately to avoid flash
  apply(getPreferred());

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    // Re-apply to update button icon
    apply(getPreferred());
    btn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      apply(next);
    });
  });
})();
