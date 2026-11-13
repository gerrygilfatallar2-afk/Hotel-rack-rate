  const track = document.getElementById('sliderTrack');
  const slides = document.querySelectorAll('.hotel-page');
  const dotsWrap = document.getElementById('sliderDots');
  const countLabel = document.getElementById('sliderCount');
  let idx = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const topContactText = document.getElementById('topContactText');

  function goTo(i){
    idx = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
    window.scrollTo(0, 0);
    [...dotsWrap.children].forEach((d, j) => d.classList.toggle('active', j === idx));
    countLabel.textContent = `${idx + 1} / ${slides.length}`;
    const phone = slides[idx].dataset.phone;
    if (phone && topContactText) topContactText.textContent = phone;
  }

  document.getElementById('prevBtn').addEventListener('click', () => goTo(idx - 1));
  document.getElementById('nextBtn').addEventListener('click', () => goTo(idx + 1));
  document.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.matches('input, textarea, select') || t.isContentEditable)) return;
    if (document.querySelector('.modal-overlay:not([hidden])')) return;
    if (e.key === 'ArrowLeft') goTo(idx - 1);
    if (e.key === 'ArrowRight') goTo(idx + 1);
  });

  /* ---------- hotel search ----------
     Binabasa nito ang pangalan, tagline, at address ng bawat
     hotel-page nang direkta sa page, kaya kahit palitan mo ang
     mga pangalan/lokasyon sa HTML, automatic na sumusunod ang search. */
  const searchWrap    = document.getElementById('hotelSearch');
  const searchInput   = document.getElementById('hotelSearchInput');
  const searchResults = document.getElementById('hotelSearchResults');

  const hotelIndex = [...slides].map((el, i) => {
    const brandEl = el.querySelector('.brand > div');
    const name = (brandEl && brandEl.childNodes[0] ? brandEl.childNodes[0].textContent.trim() : '') || `Hotel ${i + 1}`;
    const tagline = el.querySelector('.hero .tagline')?.textContent.trim() || '';
    const addressSpan = [...el.querySelectorAll('.foot-contact span')].find(s => s.textContent.includes(','));
    const address = addressSpan ? addressSpan.textContent.trim() : '';
    return { index: i, name, tagline, address, haystack: (name + ' ' + tagline + ' ' + address).toLowerCase() };
  });

  function renderResults(list){
    if (!list.length){
      searchResults.innerHTML = '<div class="hotel-search-empty">No hotel matched your search.</div>';
      searchResults.classList.add('open');
      return;
    }
    searchResults.innerHTML = list.map(h =>
      `<button type="button" class="hotel-search-item" data-index="${h.index}">
         <div class="hs-name">${h.name}</div>
         <div class="hs-sub">${h.tagline || h.address}</div>
       </button>`
    ).join('');
    searchResults.classList.add('open');
    searchResults.querySelectorAll('.hotel-search-item').forEach(btn => {
      btn.addEventListener('click', () => {
        goTo(parseInt(btn.dataset.index, 10));
        searchResults.classList.remove('open');
        searchInput.value = '';
        searchInput.blur();
      });
    });
  }

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q){ searchResults.classList.remove('open'); return; }
    renderResults(hotelIndex.filter(h => h.haystack.includes(q)));
  });
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim()) searchResults.classList.add('open');
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter'){
      const first = searchResults.querySelector('.hotel-search-item');
      if (first) first.click();
    }
    if (e.key === 'Escape'){ searchResults.classList.remove('open'); searchInput.blur(); }
  });
  document.addEventListener('click', (e) => {
    if (!searchWrap.contains(e.target)) searchResults.classList.remove('open');
  });

  /* ---------- mobile hamburger nav ---------- */
  document.querySelectorAll('.hamburger').forEach(btn => {
    const nav = btn.closest('.wrap.nav').querySelector('.navlinks');
    btn.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open'); btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }));
  });

  /* ---------- room type + minimum rating filter (per hotel) ----------
     Room type: show/hide cards inside that hotel's room grid.
     Minimum rating: this is a per-hotel overall score, so if the hotel's
     own rating is below the chosen minimum, none of its rooms qualify. */
  [1, 2, 3].forEach(n => {
    const typeSel   = document.getElementById(`roomTypeFilter${n}`);
    const ratingSel = document.getElementById(`ratingFilter${n}`);
    const grid      = document.getElementById(`roomsGrid${n}`);
    const emptyMsg  = document.getElementById(`roomsEmpty${n}`);
    const section   = document.getElementById(`rooms-${n}`);
    if (!typeSel || !ratingSel || !grid || !section) return;
    const hotelScore = parseFloat(section.dataset.hotelScore || '0');
    const cards = [...grid.querySelectorAll('.room-card')];

    function apply(){
      const typeVal = typeSel.value;
      const ratingVal = ratingSel.value;
      const minRating = ratingVal.startsWith('3.5') ? 3.5
                       : ratingVal.startsWith('4.0') ? 4.0
                       : ratingVal.startsWith('4.5') ? 4.5 : 0;
      const hotelQualifies = hotelScore >= minRating;
      let visible = 0;
      cards.forEach(card => {
        const matchesType = (typeVal === 'Any room type') || (card.dataset.type === typeVal.toLowerCase());
        const show = matchesType && hotelQualifies;
        card.hidden = !show;
        if (show) visible++;
      });
      emptyMsg.hidden = visible > 0;
    }
    typeSel.addEventListener('change', apply);
    ratingSel.addEventListener('change', apply);
  });

  /* ---------- back to top ---------- */
  const backToTop = document.getElementById('backToTop');
  function toggleBackToTop(){ backToTop.hidden = window.scrollY < 400; }
  window.addEventListener('scroll', toggleBackToTop);
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  toggleBackToTop();

  /* ---------- sticky header shadow on scroll ---------- */
  const headers = document.querySelectorAll('.hotel-page header');
  function toggleHeaderShadow(){
    headers.forEach(h => h.classList.toggle('scrolled', window.scrollY > 12));
  }
  window.addEventListener('scroll', toggleHeaderShadow);
  toggleHeaderShadow();

  /* ---------- room detail modal ---------- */
  const roomModal = document.getElementById('roomModal');
  const rmPhoto = document.getElementById('roomModalPhoto');
  const rmHotel = document.getElementById('roomModalHotel');
  const rmTitle = document.getElementById('roomModalTitle');
  const rmMeta = document.getElementById('roomModalMeta');
  const rmPrice = document.getElementById('roomModalPrice');
  const rmPer = document.getElementById('roomModalPer');
  const rmAmenities = document.getElementById('roomModalAmenities');

  function openRoomModal(card){
    rmHotel.textContent = card.dataset.hotel || '';
    rmTitle.textContent = card.dataset.name || '';
    rmMeta.textContent = (card.dataset.meta || '') + ' · ' + (card.dataset.size || '');
    rmPrice.textContent = card.dataset.amt || '';
    rmPer.textContent = ' ' + (card.dataset.per || '');
    rmPhoto.className = 'modal-photo art-' + (card.dataset.type || 'standard');
    const amenities = (card.dataset.amenities || '').split('|').filter(Boolean);
    rmAmenities.innerHTML = amenities.map(a => `<li>${a}</li>`).join('');
    roomModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeModal(overlay){
    overlay.hidden = true;
    document.body.style.overflow = '';
  }
  document.querySelectorAll('.room-view-btn').forEach(btn => {
    btn.addEventListener('click', () => openRoomModal(btn.closest('.room-card')));
  });
  document.getElementById('roomModalClose').addEventListener('click', () => closeModal(roomModal));
  roomModal.addEventListener('click', e => { if (e.target === roomModal) closeModal(roomModal); });

  /* ---------- compare hotels modal ---------- */
  const compareModal = document.getElementById('compareModal');
  const compareTable = document.getElementById('compareTable');
  const HOTELS = [
    { name: 'Hotel & Motel', range: '₱1,450–₱2,800', rating: '4.5', reviews: '312', dot: 'DOT-ACC-2024-1142' },
    { name: 'Verde Grove Suites', range: '₱1,600–₱3,000', rating: '4.8', reviews: '189', dot: 'DOT-ACC-2024-1287' },
    { name: 'Highway Hotel & Motel', range: '₱1,750–₱3,200', rating: '4.2', reviews: '401', dot: 'DOT-ACC-2024-0965' },
  ];
  const FREEBIES = ['Breakfast (2 guests)', 'Free WiFi', 'Welcome Drink', 'Parking (1 vehicle)'];
  function buildCompareTable(){
    let head = '<tr><th>Hotel</th>' + HOTELS.map(h => `<th>${h.name}</th>`).join('') + '</tr>';
    let rows = '';
    rows += '<tr><td class="ct-label">Rack rate / night</td>' + HOTELS.map(h => `<td>${h.range}</td>`).join('') + '</tr>';
    rows += '<tr><td class="ct-label">Overall rating</td>' + HOTELS.map(h => `<td>${h.rating} ★ (${h.reviews})</td>`).join('') + '</tr>';
    rows += '<tr><td class="ct-label">DOT accreditation</td>' + HOTELS.map(h => `<td>${h.dot}</td>`).join('') + '</tr>';
    FREEBIES.forEach(f => {
      rows += `<tr><td class="ct-label">${f}</td>` + HOTELS.map(() => '<td class="ct-yes">✓ Included</td>').join('') + '</tr>';
    });
    compareTable.innerHTML = head + rows;
  }
  buildCompareTable();
  document.querySelectorAll('.compare-trigger').forEach(btn => {
    btn.addEventListener('click', () => { compareModal.hidden = false; document.body.style.overflow = 'hidden'; });
  });
  document.getElementById('compareModalClose').addEventListener('click', () => closeModal(compareModal));
  compareModal.addEventListener('click', e => { if (e.target === compareModal) closeModal(compareModal); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape'){
      if (!roomModal.hidden) closeModal(roomModal);
      if (!compareModal.hidden) closeModal(compareModal);
    }
  });

  /* ---------- sort rooms by price ---------- */
  [1, 2, 3].forEach(n => {
    const sel = document.getElementById(`sortSelect${n}`);
    const grid = document.getElementById(`roomsGrid${n}`);
    if (!sel || !grid) return;
    const originalOrder = [...grid.querySelectorAll('.room-card')];
    sel.addEventListener('change', () => {
      const cards = [...grid.querySelectorAll('.room-card')];
      if (sel.value === 'featured'){
        originalOrder.forEach(c => grid.appendChild(c));
      } else {
        const dir = sel.value === 'price-asc' ? 1 : -1;
        cards.sort((a, b) => dir * (parseFloat(a.dataset.price) - parseFloat(b.dataset.price)));
        cards.forEach(c => grid.appendChild(c));
      }
    });
  });

  /* ---------- favorite hotel (localStorage) ---------- */
  document.querySelectorAll('.hotel-page').forEach((page, idx) => {
    const n = idx + 1;
    const btn = page.querySelector('.fav-heart');
    if (!btn) return;
    const key = `favHotel_${n}`;
    function refresh(){ btn.setAttribute('aria-pressed', localStorage.getItem(key) === '1' ? 'true' : 'false'); }
    try { refresh(); } catch(e) {}
    btn.addEventListener('click', () => {
      try {
        const isFav = localStorage.getItem(key) === '1';
        localStorage.setItem(key, isFav ? '0' : '1');
        refresh();
      } catch(e) {}
    });
  });

  /* ---------- inquiry form (no backend — local confirmation only) ---------- */
  document.querySelectorAll('.inquire-form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!form.checkValidity()){ form.reportValidity(); return; }
      form.querySelector('.if-success').hidden = false;
      form.querySelectorAll('input, textarea').forEach(el => el.value = '');
    });
  });

  /* ---------- tabbed sections (Rooms / Gallery / Amenities / Rates / About / Contact) ---------- */
  function switchTab(page, tabKey){
    page.querySelectorAll('[data-tab-panel]').forEach(el => {
      el.classList.toggle('active', el.dataset.tabPanel === tabKey);
    });
    page.querySelectorAll('[data-tab]').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tabKey);
    });
    const activePanel = page.querySelector(`[data-tab-panel="${tabKey}"]`);
    if (activePanel) activePanel.classList.add('tab-fade');
  }

  document.querySelectorAll('.hotel-page').forEach(page => switchTab(page, 'rooms'));

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-tab]');
    if (!trigger) return;
    const page = trigger.closest('.hotel-page');
    if (!page) return;
    const tabKey = trigger.dataset.tab;
    if (tabKey === 'home'){
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    e.preventDefault();
    switchTab(page, tabKey);
    const chips = page.querySelector('.jump-chips');
    if (chips) chips.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
