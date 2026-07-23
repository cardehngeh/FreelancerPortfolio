const reviewsGrid = document.getElementById('reviews-grid');
const contactForm = document.querySelector('.contact-form');
const contactFeedback = document.querySelector('.form-feedback');

const upworkProfileUrl = 'https://upwork.com/freelancers/~01eb27c0fd81270912';
const upworkReviewsEndpoint = '/api/reviews';

const sampleReviews = [
  {
    name: 'Valerie M., Business Development Manager',
    text: "I secured Charles' services in the development of my consultancy website — web admin and delivery of the scope of work exceeded expectations. Highly recommend his services to any prospective client.",
    rating: 5,
  },
  {
    name: 'Verified Upwork Client — WordPress.com Technical Support (2,880 hrs)',
    text: 'Charles demonstrated excellent communication skills and a willingness to go above and beyond. Their positive attitude was evident in every interaction, making the process smoother and more enjoyable.',
    rating: 5,
  },
  {
    name: 'Verified Upwork Client — On-call Remote IT Support',
    text: 'Charles did an excellent job. He was professional, quick to respond and very detail-oriented throughout the task. Communication was very timely and he went above and beyond.',
    rating: 5,
  },
  {
    name: 'Verified Upwork Client — Part-Time Client Success Representative',
    text: 'Highly recommend Charles! Charles is a great freelancer who is smart and responsive.',
    rating: 5,
  },
  {
    name: 'Verified Upwork Client — B2B Email Lead Virtual Assistant',
    text: "It was great working with Charles. I'd recommend him to anyone looking for reliable support.",
    rating: 5,
  },
  {
    name: 'Verified Upwork Client — WordPress Post Cleanup',
    text: 'Fluent, technically skilled and amazing to work with. Definitely recommend!',
    rating: 5,
  },
  {
    name: 'Verified Upwork Client — Part-Time Client Success Representative',
    text: 'Charles is a good problem solver who speaks great English.',
    rating: 5,
  },
];

function renderCards(reviews) {
  reviewsGrid.innerHTML = reviews
    .map((review) => {
      const displayName = review.name.replace(/^Verified Upwork Client\s*—\s*/, '').trim();
      return `
      <article class="review-card">
        <div class="review-head">
          <img class="review-upwork-logo" src="upwork-ios-27-outlined-32.png" alt="Upwork" />
          <h3>${displayName}</h3>
        </div>
        <p>${review.text}</p>
        <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
      </article>
    `;
    })
    .join('');
  setupReviewsCarousel();
}

async function loadReviews() {
  try {
    const response = await fetch(upworkReviewsEndpoint);
    if (!response.ok) throw new Error('Reviews API not available');
    const data = await response.json();
    const reviews = data.reviews || data;
    renderCards(Array.isArray(reviews) ? reviews.slice(0, 10) : sampleReviews);
    return;
  } catch (error) {
    console.warn('Reviews API unavailable, falling back to static file:', error);
  }

  try {
    const response = await fetch('upwork-reviews.json');
    if (!response.ok) throw new Error('Static reviews file not available');
    const reviews = await response.json();
    renderCards(Array.isArray(reviews) ? reviews.slice(0, 10) : sampleReviews);
    return;
  } catch (error) {
    console.warn('Unable to load static reviews file, using built-in sample reviews:', error);
    renderCards(sampleReviews);
  }
}

function setupReviewsCarousel() {
  const track = reviewsGrid;
  const dotsContainer = document.getElementById('reviews-dots');
  if (!track || !dotsContainer) return;

  const cards = Array.from(track.querySelectorAll('.review-card'));
  if (cards.length === 0) return;

  const desktopQuery = window.matchMedia('(min-width: 641px)');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let PAGE_SIZE = desktopQuery.matches ? 2 : 1;
  let pageCount = Math.ceil(cards.length / PAGE_SIZE);
  let dots = [];
  let activeIndex = 0;
  let autoTimer = null;
  let resumeTimer = null;

  function buildDots() {
    dotsContainer.innerHTML = Array.from({ length: pageCount })
      .map((_, i) => `<button type="button" class="reviews-dot" aria-label="Show reviews page ${i + 1}"></button>`)
      .join('');
    dots = Array.from(dotsContainer.querySelectorAll('.reviews-dot'));
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        scrollToIndex(i);
        pauseThenResume();
      });
    });
    setActive(0);
  }

  function setActive(index) {
    activeIndex = index;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  function scrollToIndex(index) {
    const card = cards[index * PAGE_SIZE];
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' });
    setActive(index);
  }

  function startAuto() {
    if (prefersReducedMotion) return;
    stopAuto();
    autoTimer = setInterval(() => {
      scrollToIndex((activeIndex + 1) % pageCount);
    }, 4000);
  }

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
    autoTimer = null;
  }

  function pauseThenResume() {
    stopAuto();
    if (resumeTimer) clearTimeout(resumeTimer);
    resumeTimer = setTimeout(startAuto, 6000);
  }

  track.addEventListener('mouseenter', stopAuto);
  track.addEventListener('mouseleave', startAuto);
  track.addEventListener('touchstart', stopAuto, { passive: true });
  track.addEventListener('touchend', pauseThenResume, { passive: true });

  let scrollDebounce;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(() => {
      const trackRect = track.getBoundingClientRect();
      let closestIndex = 0;
      let closestDist = Infinity;
      cards.forEach((card, i) => {
        const dist = Math.abs(card.getBoundingClientRect().left - trackRect.left);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
      });
      setActive(Math.floor(closestIndex / PAGE_SIZE));
    }, 100);
  });

  desktopQuery.addEventListener('change', (event) => {
    PAGE_SIZE = event.matches ? 2 : 1;
    pageCount = Math.ceil(cards.length / PAGE_SIZE);
    buildDots();
    scrollToIndex(0);
  });

  buildDots();
  startAuto();
}

function showContactFeedback(message) {
  if (!contactFeedback) return;
  contactFeedback.textContent = message;
  contactFeedback.hidden = false;
}

if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    const body = `Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0A${message}`;
    const mailtoUrl = `mailto:contact@bryantkadenge.com?subject=Website%20Inquiry&body=${body}`;

    showContactFeedback('Opening your email client so you can send this message instantly.');
    window.location.href = mailtoUrl;
  });
}

loadReviews();

const footerYear = document.getElementById('footer-year');
if (footerYear) footerYear.textContent = new Date().getFullYear();

const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  const closeMenu = () => {
    mainNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    if (!mainNav.classList.contains('is-open')) return;
    if (mainNav.contains(event.target) || navToggle.contains(event.target)) return;
    closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}
