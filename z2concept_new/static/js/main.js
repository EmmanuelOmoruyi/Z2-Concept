// NAV SCROLL
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.style.background = window.scrollY > 60 ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.92)';
});

// MOBILE BURGER
const burger = document.getElementById('navBurger');
const menu   = document.getElementById('navMenu');
if (burger && menu) {
  burger.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
}

// CAROUSEL
function initCarousel(trackId, dotsId) {
  const track = document.getElementById(trackId);
  const dotsWrap = document.getElementById(dotsId);
  if (!track) return;
  const slides = Array.from(track.querySelectorAll('.carousel__slide'));
  const total = slides.length;
  let current = 0;

  const dots = [];
  if (dotsWrap) {
    for (let i = 0; i < total; i++) {
      const d = document.createElement('div');
      d.className = 'carousel__dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
      dots.push(d);
    }
  }

  function visibleCount() {
    const tw = track.parentElement.offsetWidth;
    const sw = slides[0] ? slides[0].offsetWidth + 20 : tw;
    return Math.max(1, Math.round(tw / sw));
  }

  function goTo(idx) {
    const max = Math.max(0, total - visibleCount());
    current = Math.max(0, Math.min(idx, max));
    const sw = slides[0] ? slides[0].offsetWidth + 20 : 0;
    track.style.transform = `translateX(-${current * sw}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  const container = track.closest('.carousel');
  if (container) {
    container.querySelector('.carousel__btn--prev')?.addEventListener('click', () => goTo(current - 1));
    container.querySelector('.carousel__btn--next')?.addEventListener('click', () => goTo(current + 1));
  }

  let auto = setInterval(() => goTo(current + 1), 5000);
  container?.addEventListener('mouseenter', () => clearInterval(auto));
  container?.addEventListener('mouseleave', () => { clearInterval(auto); auto = setInterval(() => goTo(current + 1), 5000); });

  // Touch swipe
  let tx = 0;
  track.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const d = tx - e.changedTouches[0].clientX;
    if (Math.abs(d) > 50) d > 0 ? goTo(current + 1) : goTo(current - 1);
  }, { passive: true });

  window.addEventListener('resize', () => goTo(current));
  goTo(0);
}

initCarousel('videoTrack', 'videoDots');

// LIGHTBOX
function openLightbox(filename, caption) {
  const lb  = document.getElementById('lightbox');
  const img = document.getElementById('lightboxImg');
  const cap = document.getElementById('lightboxCap');
  if (!lb) return;
  img.src = filename.startsWith('http') ? filename : '/static/uploads/' + filename;
  img.alt = caption || 'Z2 Concept';
  cap.textContent = caption || '';
  lb.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// BOOKING FORM
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
  const dateInput = document.getElementById('event_date');
  if (dateInput) dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);

  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn     = document.getElementById('submitBtn');
    const errBox  = document.getElementById('bfErrors');
    const sucBox  = document.getElementById('bfSuccess');
    const inner   = btn?.querySelector('.cta-btn__inner');

    if (errBox) errBox.style.display = 'none';
    if (sucBox) sucBox.style.display = 'none';
    if (btn) btn.disabled = true;
    if (inner) inner.textContent = 'SENDING...';

    try {
      const res  = await fetch('/book', { method: 'POST', body: new FormData(bookingForm) });
      if (res.redirected || res.status === 302 || res.status === 401) {
        window.location.href = '/login'; return;
      }
      const data = await res.json();
      if (data.success) {
        if (sucBox) { sucBox.textContent = data.message; sucBox.style.display = 'block'; }
        bookingForm.reset();
        sucBox?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        if (errBox) { errBox.innerHTML = data.errors.join('<br>'); errBox.style.display = 'block'; }
      }
    } catch {
      if (errBox) { errBox.innerHTML = 'Something went wrong. Please try again or call us directly.'; errBox.style.display = 'block'; }
    } finally {
      if (btn) btn.disabled = false;
      if (inner) inner.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z"/></svg> CONFIRM BOOKING`;
    }
  });
}

// SCROLL FADE IN
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.gallery-section, .about-teaser, .book-cta, .ticker, .videos-section, .about-page, .contact-page, .booking-page').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(36px)';
  el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  observer.observe(el);
});

