// Aplica tema no <html> (class 'dark'), respeitando preferência salva ou do sistema
export function applyTheme(theme) {
  const root = document.documentElement; // <html>
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function initTheme() {
  const saved = localStorage.getItem('theme'); // 'light' | 'dark' | null
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved);
    return saved;
  }
  // Auto via sistema
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
  return prefersDark ? 'dark' : 'light';
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const next = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
  return next;
}
