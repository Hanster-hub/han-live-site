'use strict';

const GITHUB_USER = 'Hanster-hub';

/* ─── Nav scroll behaviour ───────────────────────────────────── */
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ─── Hamburger toggle ───────────────────────────────────────── */
const burger  = document.getElementById('navBurger');
const navMenu = document.getElementById('navMenu');

burger.addEventListener('click', () => {
  const open = navMenu.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
});

navMenu.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
  });
});

/* ─── Active nav link via IntersectionObserver ───────────────── */
const navLinks = document.querySelectorAll('.nav__link');
const sections = document.querySelectorAll('main section[id]');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(l => l.classList.remove('is-active'));
    const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
    if (active) active.classList.add('is-active');
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

/* ─── Scroll-reveal animation ────────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('in-view');
    revealObserver.unobserve(entry.target);
  });
}, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ─── Language colour map ────────────────────────────────────── */
const LANG_COLORS = {
  JavaScript:  '#f1e05a',
  TypeScript:  '#3178c6',
  Python:      '#3572A5',
  Java:        '#b07219',
  'C#':        '#178600',
  'C++':       '#f34b7d',
  C:           '#555555',
  HTML:        '#e34c26',
  CSS:         '#563d7c',
  Go:          '#00ADD8',
  Rust:        '#dea584',
  PHP:         '#4F5D95',
  Ruby:        '#701516',
  Swift:       '#F05138',
  Kotlin:      '#A97BFF',
  Shell:       '#89e051',
  Dart:        '#00B4AB',
};

/* ─── Skeleton cards ─────────────────────────────────────────── */
function makeSkeleton() {
  const el = document.createElement('div');
  el.className = 'skeleton';
  el.innerHTML = `
    <div class="skeleton__line skeleton__line--short"></div>
    <div class="skeleton__line skeleton__line--med"></div>
    <div class="skeleton__line"></div>
    <div class="skeleton__line skeleton__line--short"></div>
  `;
  return el;
}

/* ─── Repo card ──────────────────────────────────────────────── */
function makeRepoCard(repo) {
  const lang      = repo.language || null;
  const langColor = lang ? (LANG_COLORS[lang] || '#8b949e') : null;
  const desc      = repo.description ? repo.description.slice(0, 120) : 'No description provided.';
  const stars     = repo.stargazers_count;

  const card = document.createElement('article');
  card.className = 'card reveal';
  card.innerHTML = `
    <div class="card__header">
      <svg class="card__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
      ${lang ? `<div class="tags"><span class="tag tag--sm">${escHtml(lang)}</span></div>` : ''}
    </div>
    <h3 class="card__title">${escHtml(repo.name)}</h3>
    <p class="card__desc">${escHtml(desc)}</p>
    <div class="card__footer">
      ${lang ? `
        <span class="card__stat">
          <span class="lang-dot" style="background:${langColor}" aria-hidden="true"></span>
          ${escHtml(lang)}
        </span>` : '<span></span>'}
      <span class="card__stat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        ${stars}
      </span>
    </div>
    <a class="card__link" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">View on GitHub →</a>
  `;

  return card;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── State: empty / error ───────────────────────────────────── */
function stateCard(icon, message) {
  const el = document.createElement('div');
  el.className = 'repos-state';
  el.innerHTML = `
    <svg class="repos-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>
    <p>${message}</p>
  `;
  return el;
}

/* ─── Fetch repos ────────────────────────────────────────────── */
async function loadRepos() {
  const grid = document.getElementById('reposGrid');

  /* show skeletons while fetching */
  const skeletons = Array.from({ length: 6 }, makeSkeleton);
  skeletons.forEach(s => grid.appendChild(s));

  try {
    const res = await fetch(
      `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=12`,
      { headers: { Accept: 'application/vnd.github+json' } }
    );

    if (res.status === 403 || res.status === 429) {
      throw new Error('rate-limited');
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const repos = await res.json();
    grid.innerHTML = '';

    if (!Array.isArray(repos) || repos.length === 0) {
      grid.appendChild(stateCard(
        '<path d="M3 3h18v18H3zM12 8v4M12 16h.01"/>',
        'No public repositories found.'
      ));
      return;
    }

    /* filter out forks if desired — show all for now */
    repos.forEach(repo => {
      const card = makeRepoCard(repo);
      grid.appendChild(card);
      /* trigger reveal observer on newly added cards */
      revealObserver.observe(card);
    });

  } catch (err) {
    grid.innerHTML = '';
    const isRateLimit = err.message === 'rate-limited';
    grid.appendChild(stateCard(
      '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
      isRateLimit
        ? 'GitHub API rate limit reached. Please try again in a few minutes.'
        : 'Could not load repositories. Check your connection and try again.'
    ));
  }
}

loadRepos();
