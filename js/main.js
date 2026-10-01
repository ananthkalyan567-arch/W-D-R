/**
 * ASR Water & Drainage - Main Interactive Engine
 * Handles Navbar, Mobile Menu, Toasts, Live Stats Counters, and Quick Search
 */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const toggleBtn = document.querySelector('.mobile-nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
    });
  }

  // Close mobile nav when clicking outside
  document.addEventListener('click', (e) => {
    if (navLinks && navLinks.classList.contains('open')) {
      if (!navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        navLinks.classList.remove('open');
      }
    }
  });

  // Highlight active page link
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Initialize Home Statistics if on home page
  initHomeStats();

  // Initialize Quick Track Box if present
  initQuickTrack();
});

/**
 * Initialize live statistics counters on Home Page
 */
function initHomeStats() {
  const statsContainer = document.querySelector('.stats-grid');
  if (!statsContainer || typeof ASR_STORE === 'undefined') return;

  const stats = ASR_STORE.getStats();

  const countElements = {
    'stat-total': stats.total,
    'stat-water': stats.water,
    'stat-drainage': stats.drainage,
    'stat-pending': stats.pending,
    'stat-progress': stats.progress,
    'stat-resolved': stats.resolved
  };

  Object.entries(countElements).forEach(([id, targetVal]) => {
    const el = document.getElementById(id);
    if (el) {
      animateCounter(el, targetVal);
    }
  });
}

/**
 * Smooth counter animation
 */
function animateCounter(element, target, duration = 800) {
  if (target === 0) {
    element.textContent = '0';
    return;
  }
  const start = 0;
  const startTime = performance.now();

  function updateCount(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOutQuad = progress * (2 - progress);
    const current = Math.floor(easeOutQuad * (target - start) + start);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      element.textContent = target.toLocaleString();
    }
  }

  requestAnimationFrame(updateCount);
}

/**
 * Quick Complaint Tracking form on Home Page
 */
function initQuickTrack() {
  const form = document.getElementById('quick-track-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('quick-track-input');
    if (input && input.value.trim()) {
      const cleanId = encodeURIComponent(input.value.trim());
      window.location.href = `track.html?id=${cleanId}`;
    }
  });
}

/**
 * Toast Notification Dispatcher
 */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Common Helpers for status and verification badges
 */
function getStatusBadge(status) {
  const s = (status || '').toLowerCase().replace(/\s+/g, '-');
  const label = typeof ASR_I18N !== 'undefined' ? ASR_I18N.t(`status${status.replace(/\s+/g, '')}`) : status;
  return `<span class="status-badge status-${s}">${label || status}</span>`;
}

function getVerificationBadge(level) {
  if (level === 'Verified/Official') {
    return `<span class="verify-tag verified">✓ Verified Official</span>`;
  }
  if (level === 'Administrator Reviewed') {
    return `<span class="verify-tag admin">🛡️ Admin Reviewed</span>`;
  }
  return `<span class="verify-tag citizen">👤 Citizen Reported</span>`;
}
