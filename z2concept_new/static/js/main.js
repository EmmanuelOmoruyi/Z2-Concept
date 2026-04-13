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


// COLLECTION PHOTOS DATA (injected from Cloudinary)
const COLLECTION_DATA = {
  weddings: {
    title: 'WEDDINGS',
    photos: [
      'WeddingDSC01008-2Photos_srgbzg','WeddingDSC01016-1Photos_hxlopa','WeddingDSC01049-1Photos_adnvwu',
      'WeddingDSC00924-2Photos_xwtwst','Wedding2_o6jkqm','WeddingDSC00847Photos_mvpptq',
      'WeddingDSC00881-1Photos_usrbcs','Wedding_ewwodp','WeddingDSC00851Photos_r0xqiz',
      'WeddingDSC00879-1Photos_ceu3','WeddingDSC00975-1Photos_q2lqrn',
      'WeddingP_R-Standesamt-069_1_gv4kdd','WeddingP_R-Standesamt-086_1_qfrkgj',
      'WeddingP_R-Standesamt-060_qkf5l9','WeddingP_R-Standesamt-071_ib03wm','WeddingP_R-Standesamt-064_zghn37'
    ]
  },
  birthdays: {
    title: 'BIRTHDAYS',
    photos: [
      'Birthdaysimage00018_mcue67','BirthdaysDSC00067a_hj6x3j','Birthdaysimage00014_qymeso',
      'Birthdaysimage00017_rhu6ng','BirthdaysDSC00026a_ckmow5','Birthdaysimage00011_ptg6vt',
      'Birthdaysimage00001_ewmkkc','BirthdaysDSC00070_ddhfps','BirthdaysDSC00061_axeybv',
      'BirthdaysDSC00048_cizthq','Birthdaysimage00010_muq0xn','Birthdaysimage00008_ajbuft',
      'Birthdaysimage00007_tjyrpm','BirthdaysDSC00054_gydxax',
      '656251185_1413698020802827_5479065206795647904_n_oqp6wo',
      '654800285_1413697914136171_6470243813399565788_n_gh6di4',
      '655508905_1413697944136168_7858579123878504310_n_of0kha'
    ]
  },
  modeling: {
    title: 'MODELING',
    photos: [
      'KefeeHP2_54_p6ky8h','KefeeHP2_47_mlj8z3','KefeeHP2_43_pjtnjk','KefeeHP2_42_ssawxm',
      'KefeeHP2_46_mec2hf','KefeeHP2_49_lzuwel','KefeeHP2_52_szggos','KefeeHP2_51_jcsh6s',
      'KefeeHP_22_j5vh4j','KefeeHP_21_izrsgt','KefeeHP2_2_ns1wyr','KefeeHP_23_nyjz05',
      'KefeeHP2_5_wycfvk','KefeeHP2_4_yvgaov','KefeeHP2_3_q0a4jd','KefeeHP2_22_a1wors',
      'KefeeHP2_13_obu9tl','KefeeHP2_20_lik7ac','KefeeHP2_30_xz1ie8','KefeeHP2_24_xhgtin',
      'KefeeHP2_29_nyehqp','KefeeHP2_34_eningj','KefeeHP2_28_qxgwdy','KefeeHP2_32_gbrxxp'
    ]
  }
};

const CLOUD = 'dekw9tcyl';

let colPhotos = [];
let colIndex = 0;

function openCollection(cat) {
  const data = COLLECTION_DATA[cat];
  if (!data) return;
  colPhotos = data.photos.map(id => `https://res.cloudinary.com/${CLOUD}/image/upload/${id}`);
  colIndex = 0;

  const modal = document.getElementById('collectionModal');
  const backdrop = document.getElementById('collectionBackdrop');
  document.getElementById('collectionTitle').textContent = data.title;

  // Build thumbnail strip
  const strip = document.getElementById('collectionStrip');
  strip.innerHTML = '';
  colPhotos.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.loading = 'lazy';
    img.onerror = () => { img.parentElement && (img.parentElement.style.display='none'); };
    img.onclick = () => showColPhoto(i);
    img.className = i === 0 ? 'active' : '';
    strip.appendChild(img);
  });

  showColPhoto(0);
  modal.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function showColPhoto(idx) {
  colIndex = (idx + colPhotos.length) % colPhotos.length;
  const main = document.getElementById('collectionMainImg');
  main.src = colPhotos[colIndex];
  main.onerror = () => { showColPhoto(colIndex + 1); };
  // Update strip active state
  document.querySelectorAll('#collectionStrip img').forEach((img, i) => {
    img.classList.toggle('active', i === colIndex);
    if (i === colIndex) img.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  });
}

function closeCollection() {
  document.getElementById('collectionModal')?.classList.remove('open');
  document.getElementById('collectionBackdrop')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Arrow key nav for collection
document.addEventListener('keydown', e => {
  if (!document.getElementById('collectionModal')?.classList.contains('open')) return;
  if (e.key === 'ArrowRight') showColPhoto(colIndex + 1);
  if (e.key === 'ArrowLeft') showColPhoto(colIndex - 1);
  if (e.key === 'Escape') closeCollection();
});

// -- CHAT WIDGET --
function toggleChat() {
  const box = document.getElementById('chatBox');
  box.classList.toggle('open');
  if (box.classList.contains('open')) {
    document.getElementById('chatInput').focus();
  }
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;

  // Show user message
  const messages = document.getElementById('chatMessages');
  const userDiv = document.createElement('div');
  userDiv.className = 'chat-box__msg chat-box__msg--out';
  userDiv.innerHTML = `<p>${msg}</p>`;
  messages.appendChild(userDiv);
  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // Show sending indicator
  const sending = document.createElement('div');
  sending.className = 'chat-box__sending';
  sending.textContent = 'Sending...';
  messages.appendChild(sending);

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    const data = await res.json();
    sending.remove();
    const replyDiv = document.createElement('div');
    replyDiv.className = 'chat-box__msg chat-box__msg--in';
    replyDiv.innerHTML = `<p>${data.reply || "Thanks for reaching out! We'll get back to you soon."}</p>`;
    messages.appendChild(replyDiv);
  } catch {
    sending.textContent = "Message sent!";
    setTimeout(() => sending.remove(), 2000);
  }
  messages.scrollTop = messages.scrollHeight;
}
