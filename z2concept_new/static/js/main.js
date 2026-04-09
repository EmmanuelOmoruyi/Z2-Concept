// NAV SCROLL
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.style.background = window.scrollY > 60 ? 'rgba(10,10,10,0.98)' : 'rgba(10,10,10,0.92)';
});

// MOBILE BURGER
const burger = document.getElementById('navBurger');
const menu   = document.getElementById('navMenu');

function openMenu() {
  menu.style.display = 'flex';
  menu.style.position = 'fixed';
  menu.style.top = '64px';
  menu.style.left = '0';
  menu.style.right = '0';
  menu.style.bottom = '0';
  menu.style.flexDirection = 'column';
  menu.style.alignItems = 'center';
  menu.style.justifyContent = 'flex-start';
  menu.style.paddingTop = '40px';
  menu.style.background = '#0a0a0a';
  menu.style.zIndex = '1000';
  menu.style.overflowY = 'auto';
  menu.classList.add('open');
  const spans = burger.querySelectorAll('span');
  spans[0].style.cssText = 'transform:rotate(45deg) translate(5px,5px)';
  spans[1].style.cssText = 'opacity:0';
  spans[2].style.cssText = 'transform:rotate(-45deg) translate(5px,-5px)';
  document.body.style.overflow = 'hidden';
}

function closeMenu() {
  menu.style.display = '';
  menu.classList.remove('open');
  burger.querySelectorAll('span').forEach(s => s.style.cssText = '');
  document.body.style.overflow = '';
}

if (burger && menu) {
  burger.addEventListener('click', () => {
    if (menu.classList.contains('open')) { closeMenu(); } else { openMenu(); }
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !burger.contains(e.target)) {
      closeMenu();
    }
  });
}

// VIDEO CAROUSEL
function initCarousel(trackId, dotsId) {
  const track = document.getElementById(trackId);
  const dotsWrap = document.getElementById(dotsId);
  if (!track) return;
  const slides = Array.from(track.querySelectorAll('.carousel__slide'));
  const total = slides.length;
  let current = 0;

  const dots = [];
  if (dotsWrap) {
    slides.forEach((_, i) => {
      const d = document.createElement('div');
      d.className = 'carousel__dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
      dots.push(d);
    });
  }

  function visibleCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 1;
    return 2;
  }

  function goTo(idx) {
    const max = Math.max(0, total - visibleCount());
    current = Math.max(0, Math.min(idx, max));
    const sw = slides[0] ? slides[0].offsetWidth + 20 : 0;
    track.style.transform = `translateX(-${current * sw}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  const container = track.closest('.carousel');
  container.querySelector('.carousel__btn--prev')?.addEventListener('click', () => goTo(current - 1));
  container.querySelector('.carousel__btn--next')?.addEventListener('click', () => goTo(current + 1));

  let auto = setInterval(() => goTo(current + 1 >= total - visibleCount() + 1 ? 0 : current + 1), 5000);
  container.addEventListener('mouseenter', () => clearInterval(auto));
  container.addEventListener('mouseleave', () => { clearInterval(auto); auto = setInterval(() => goTo(current + 1 >= total - visibleCount() + 1 ? 0 : current + 1), 5000); });

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

// PHOTO CAROUSEL — initializes a single carousel by track + dots IDs
function initPhotoCarousel(trackId, dotsId) {
  const track = document.getElementById(trackId);
  const dotsWrap = document.getElementById(dotsId);
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.photo-carousel__slide'));
  const total = slides.length;
  if (!total) return;

  let current = 0;
  const dots = [];

  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const d = document.createElement('button');
      d.className = 'photo-carousel__dot' + (i === 0 ? ' active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
      dots.push(d);
    });
  }

  function visibleCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 4;
  }

  function slideWidth() {
    return slides[0] ? slides[0].offsetWidth + 14 : 0;
  }

  function goTo(idx) {
    const vc = visibleCount();
    const max = Math.max(0, total - vc);
    current = Math.max(0, Math.min(idx, max));
    track.style.transition = 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)';
    track.style.transform = `translateX(-${current * slideWidth()}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  const container = track.closest('.photo-carousel');
  container.querySelector('.photo-carousel__btn--prev')?.addEventListener('click', () => goTo(current - 1));
  container.querySelector('.photo-carousel__btn--next')?.addEventListener('click', () => goTo(current + 1));

  let tx = 0;
  track.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const d = tx - e.changedTouches[0].clientX;
    if (Math.abs(d) > 40) d > 0 ? goTo(current + 1) : goTo(current - 1);
  }, { passive: true });

  window.addEventListener('resize', () => goTo(current));
  goTo(0);
}

// Init all photo carousels
initPhotoCarousel('pctAll', 'pcdAll');
initPhotoCarousel('pctWeddings', 'pcdWeddings');
initPhotoCarousel('pctBirthdays', 'pcdBirthdays');

// GALLERY CATEGORY TABS — switch between separate carousels
(function() {
  const tabs = document.querySelectorAll('.gallery-tab');
  if (!tabs.length) return;

  const carouselMap = {
    'all':       document.getElementById('pcAll'),
    'weddings':  document.getElementById('pcWeddings'),
    'birthdays': document.getElementById('pcBirthdays'),
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;

      Object.entries(carouselMap).forEach(([key, el]) => {
        if (!el) return;
        if (key === cat) {
          el.style.display = 'block';
          // Re-init to recalc widths after display change
          const trackId = 'pct' + key.charAt(0).toUpperCase() + key.slice(1);
          const dotsId  = 'pcd' + key.charAt(0).toUpperCase() + key.slice(1);
          initPhotoCarousel(trackId, dotsId);
        } else {
          el.style.display = 'none';
        }
      });
    });
  });
})();

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

// HERO IMAGE SLIDER
(function() {
  const slider = document.getElementById('heroSlider');
  if (!slider) return;
  const slides = Array.from(slider.querySelectorAll('.hero__slide'));
  const dotsWrap = document.getElementById('heroSliderDots');
  if (!slides.length) return;

  let current = 0;
  const dots = [];

  slides.forEach((_, i) => {
    const d = document.createElement('button');
    d.className = 'hero__slider-dot' + (i === 0 ? ' active' : '');
    d.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(d);
    dots.push(d);
  });

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (idx + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  setInterval(() => goTo(current + 1), 2000);
})();

// SCROLL FADE IN
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.gallery-section, .about-section, .services-section, .videos-section, .contact-footer').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(32px)';
  el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  observer.observe(el);
});
