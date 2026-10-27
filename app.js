(() => {
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const toast = $('#toast');
  let toastTimer;
  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
  }

  // Mobile navigation
  const menuToggle = $('#menuToggle');
  const mainNav = $('#mainNav');
  menuToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  $$('#mainNav a').forEach(a => a.addEventListener('click', () => {
    mainNav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));

  // Menu category tabs
  $$('.menu-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.menu-tab').forEach(t => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-selected', String(t === tab));
    });
    const category = tab.dataset.category;
    $$('.dish-card').forEach(card => {
      card.classList.toggle('hidden-card', category !== 'all' && card.dataset.category !== category);
    });
  }));

  // Demo favorites
  $$('.dish-heart').forEach(button => button.addEventListener('click', () => {
    button.classList.toggle('liked');
    button.textContent = button.classList.contains('liked') ? '♥' : '♡';
    notify(button.classList.contains('liked') ? 'Додано до обраного на цьому пристрої' : 'Видалено з обраного');
  }));

  // Review form, stored locally in this browser only (not sent to a server)
  const typeSelect = $('#reviewType');
  const dishField = $('#dishField');
  const dishName = $('#dishName');
  const ratingInput = $('#ratingValue');
  const starButtons = $$('#starPicker button');
  const reviewForm = $('#reviewForm');
  const reviewsList = $('#reviewsList');
  const formFeedback = $('#formFeedback');
  const STORAGE_KEY = 'dynastiya_demo_reviews_v1';
  let currentRating = 5;

  function updateStars(value) {
    currentRating = Number(value);
    ratingInput.value = String(currentRating);
    starButtons.forEach(btn => {
      const active = Number(btn.dataset.star) <= currentRating;
      btn.classList.toggle('selected', active);
      btn.setAttribute('aria-checked', String(Number(btn.dataset.star) === currentRating));
    });
  }
  starButtons.forEach(btn => btn.addEventListener('click', () => updateStars(btn.dataset.star)));
  updateStars(5);

  typeSelect.addEventListener('change', () => {
    const isDish = typeSelect.value === 'Страва';
    dishField.classList.toggle('hidden', !isDish);
    dishName.required = isDish;
  });

  $$('.review-dish').forEach(button => button.addEventListener('click', () => {
    typeSelect.value = 'Страва';
    dishField.classList.remove('hidden');
    dishName.required = true;
    dishName.value = button.dataset.dish;
    $('#reviews').scrollIntoView({behavior: 'smooth'});
    setTimeout(() => $('#reviewText').focus({preventScroll: true}), 500);
  }));

  function readReviews() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data.filter(r => r && typeof r.text === 'string' && Number(r.rating) >= 1 && Number(r.rating) <= 5) : [];
    } catch (_) { return []; }
  }
  function safeText(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  function renderReviews() {
    const reviews = readReviews();
    $('#reviewCount').textContent = reviews.length ? `${reviews.length} відгук(ів) у цьому браузері` : 'Поки немає відгуків у цьому браузері';
    $('#averageRating').textContent = reviews.length ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1) : '—';
    reviewsList.innerHTML = reviews.slice().reverse().map(review => {
      const stars = '★'.repeat(Number(review.rating)) + '☆'.repeat(5 - Number(review.rating));
      const detail = review.type === 'Страва' && review.dish ? ` · ${safeText(review.dish)}` : '';
      return `<article class="review-item"><div class="review-item-top"><strong>${safeText(review.name || 'Гість')}</strong><span class="review-stars">${stars}</span></div><div class="review-meta">${safeText(review.date || '')}</div><p>${safeText(review.text)}</p><span class="review-tag">${safeText(review.type)}${detail}</span></article>`;
    }).join('');
  }

  reviewForm.addEventListener('submit', event => {
    event.preventDefault();
    const text = $('#reviewText').value.trim();
    const dish = dishName.value.trim();
    if (!text) { formFeedback.textContent = 'Напишіть кілька слів про ваш досвід.'; return; }
    if (typeSelect.value === 'Страва' && !dish) { formFeedback.textContent = 'Вкажіть, яку страву ви куштували.'; dishName.focus(); return; }
    const reviews = readReviews();
    reviews.push({
      name: $('#reviewName').value.trim().slice(0, 50),
      type: typeSelect.value,
      dish: typeSelect.value === 'Страва' ? dish.slice(0, 80) : '',
      rating: currentRating,
      text: text.slice(0, 600),
      date: new Date().toLocaleDateString('uk-UA')
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews.slice(-60)));
      formFeedback.textContent = 'Відгук збережено лише у вашому браузері. Він не надсилається власниці чи іншим гостям.';
      reviewForm.reset();
      dishField.classList.add('hidden');
      dishName.required = false;
      updateStars(5);
      renderReviews();
      notify('Дякуємо! Демо-відгук збережено на цьому пристрої.');
    } catch (_) {
      formFeedback.textContent = 'Браузер не дозволив зберегти відгук. Перевірте налаштування приватності.';
    }
  });

  $('#year').textContent = new Date().getFullYear();
  renderReviews();
})();