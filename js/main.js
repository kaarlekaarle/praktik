import { initAnimations } from './animations.js';

const slugMap = {
  index: {
    fi: 'index',
    en: 'index',
    sv: 'index',
  },
  'kotimaiset-yksityisasiat': {
    fi: 'kotimaiset-yksityisasiat',
    en: 'domestic-individuals',
    sv: 'inhemska-privatpersoner',
  },
  'kotimaiset-yritysasiat': {
    fi: 'kotimaiset-yritysasiat',
    en: 'domestic-business',
    sv: 'inhemska-foretagsarenden',
  },
  'kansainvaliset-yksityisasiat': {
    fi: 'kansainvaliset-yksityisasiat',
    en: 'international-individuals',
    sv: 'internationella-privatarenden',
  },
  'kansainvaliset-yritysasiat': {
    fi: 'kansainvaliset-yritysasiat',
    en: 'international-business',
    sv: 'internationella-foretagsarenden',
  },
  riidanratkaisu: {
    fi: 'riidanratkaisu',
    en: 'dispute-resolution',
    sv: 'tvistelosning',
  },
  yhteystiedot: {
    fi: 'yhteystiedot',
    en: 'contact',
    sv: 'kontakt',
  },
};

export async function loadComponent(path, placeholderId) {
  const target = document.getElementById(placeholderId);
  if (!target) return;

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load component: ${path}`);
    }
    const html = await response.text();
    target.innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

function updateLangSwitcher(language, slug) {
  const mapping = slugMap[slug];
  if (!mapping) {
    console.warn(`Unknown slug for language switcher: ${slug}`);
    return;
  }

  const items = document.querySelectorAll('.nav-lang-item');

  items.forEach((item) => {
    const lang = item.getAttribute('data-lang');
    const langSlug = mapping[lang];
    if (!langSlug) return;

    item.href = `/${lang}/${langSlug}.html`;
    item.classList.toggle('is-active', lang === language);
  });
}

function updateActiveNavLink(slug) {
  const links = document.querySelectorAll('.nav-link[data-slug]');
  links.forEach((link) => {
    const linkSlug = link.getAttribute('data-slug');
    link.classList.toggle('is-active', linkSlug === slug);
  });
}

function initHamburger() {
  const hamburger = document.querySelector('.nav-hamburger');
  const overlay = document.getElementById('nav-mobile-overlay');
  if (!hamburger || !overlay) return;

  function closeOverlay() {
    hamburger.setAttribute('aria-expanded', 'false');
    overlay.hidden = true;
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    overlay.hidden = isOpen;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      closeOverlay();
    }
  });

  overlay.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', closeOverlay);
  });
}

function updateNavHeight() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  document.documentElement.style.setProperty('--nav-height', nav.offsetHeight + 'px');
}

function updateFooterHeight() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  document.documentElement.style.setProperty('--footer-height', footer.offsetHeight + 'px');
}

function initLogoReload() {
  const logo = document.querySelector('.nav-logo');
  if (!logo) return;

  logo.addEventListener('click', (event) => {
    const href = logo.getAttribute('href');
    if (!href) return;

    const targetUrl = new URL(href, window.location.origin);

    // If the logo already points to the current page, force a full reload
    if (targetUrl.pathname === window.location.pathname) {
      event.preventDefault();
      window.location.href = targetUrl.href;
    }
  });
}

async function injectIllustration() {
  const containers = document.querySelectorAll('[data-illustration]');
  if (!containers.length) return;
  for (const container of containers) {
    const name = container.dataset.illustration;
    try {
      const res = await fetch(`/praktik/illustrations/${name}.svg`);
      if (!res.ok) continue;
      const text = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'image/svg+xml');
      const svg = doc.querySelector('svg');
      if (!svg) continue;
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('stroke', 'none');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.removeAttribute('id');
      svg.removeAttribute('xmlns:sodipodi');
      svg.removeAttribute('xmlns:inkscape');
      const namedview = svg.querySelector('namedview');
      if (namedview) namedview.remove();
      container.appendChild(svg);
    } catch (e) {
      // fail silently
    }
  }
}

export async function initPage(language, slug) {
  const navPath = `/praktik/components/nav-${language}.html`;
  const footerPath = `/praktik/components/footer.html`;

  await Promise.all([
    loadComponent(navPath, 'nav-placeholder'),
    loadComponent(footerPath, 'footer'),
  ]);

  initLogoReload();
  updateLangSwitcher(language, slug);
  updateActiveNavLink(slug);
  initHamburger();
  injectIllustration();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      updateNavHeight();
      updateFooterHeight();
    });
  });
  initAnimations();

  // initPage() is called once per page — single listener is safe.
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateNavHeight();
      updateFooterHeight();
    }, 100);
  });
}

