// ===========================
// Language Switcher
// ===========================
(function initLangSwitcher() {
  document.addEventListener('DOMContentLoaded', () => {
    const langBtn = document.getElementById('langBtn');
    const langDropdown = document.getElementById('langDropdown');
    const currentLangEl = document.getElementById('currentLang');
    const langOptions = document.querySelectorAll('.lang-option');

    if (!langBtn || !langDropdown) return;

    const langLabels = {
      en: 'EN', fr: 'FR', de: 'DE', es: 'ES', nl: 'NL', sv: 'SV'
    };

    // Toggle dropdown
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle('open');
    });

    // Close on outside click
    document.addEventListener('click', () => {
      langDropdown.classList.remove('open');
    });

    langDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Language selection
    langOptions.forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.dataset.lang;

        // Update UI
        langOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        currentLangEl.textContent = langLabels[lang] || lang.toUpperCase();
        langDropdown.classList.remove('open');

        // Trigger Google Translate
        triggerGoogleTranslate(lang);
      });
    });

    // Restore language from cookie on load
    const savedLang = getGoogleTranslateCookie();
    if (savedLang && savedLang !== 'en') {
      currentLangEl.textContent = langLabels[savedLang] || savedLang.toUpperCase();
      langOptions.forEach(o => {
        o.classList.toggle('active', o.dataset.lang === savedLang);
      });
    }
  });

  function triggerGoogleTranslate(lang) {
    if (lang === 'en') {
      // Reset to original
      const frame = document.querySelector('.goog-te-banner-frame');
      if (frame) {
        const innerDoc = frame.contentDocument || frame.contentWindow.document;
        const restoreBtn = innerDoc.querySelector('.goog-close-link');
        if (restoreBtn) restoreBtn.click();
      }
      // Also try cookie reset
      document.cookie = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'googtrans=; path=/; domain=.' + window.location.hostname + '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.reload();
      return;
    }

    // Set the Google Translate cookie and trigger
    document.cookie = 'googtrans=/en/' + lang + '; path=/';
    document.cookie = 'googtrans=/en/' + lang + '; path=/; domain=.' + window.location.hostname;

    // Try using the Google Translate combo box
    const retries = 10;
    let attempt = 0;

    function trySelect() {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change'));
      } else if (attempt < retries) {
        attempt++;
        setTimeout(trySelect, 300);
      }
    }
    trySelect();
  }

  function getGoogleTranslateCookie() {
    const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
    return match ? match[1] : null;
  }
})();

// ===========================
// Contact Form → Google Sheets
// ===========================
(function initContactForm() {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyMj8fOYIVE9WP7qFFiRho-ip2d7PBhGKAlD4a2Wz2eI_O1oZuHuqz15L1B57T_3tA/exec';

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('form-status');
    if (!form || !status) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        name: form.name.value,
        email: form.email.value,
        subject: form.subject.value,
        message: form.message.value
      };

      status.textContent = 'Sending...';
      status.className = 'sending';

      try {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        status.textContent = 'Message sent successfully!';
        status.className = 'success';
        form.reset();

        setTimeout(() => {
          status.textContent = '';
          status.className = '';
        }, 5000);
      } catch (error) {
        status.textContent = 'Error sending message. Please try again.';
        status.className = 'error';
      }
    });
  });
})();

// ===========================
// Hash-Based URL Routing
// ===========================
(function initHashRouting() {
  const sections = document.querySelectorAll('section[id]');
  let isScrolling = false;
  let scrollTimeout;

  // Update hash on scroll
  function updateHash() {
    if (isScrolling) return;
    const scrollPos = window.scrollY + window.innerHeight * 0.35;

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (section.offsetTop <= scrollPos) {
        const id = section.getAttribute('id');
        if (id !== 'hero' && window.location.hash !== '#' + id) {
          history.replaceState(null, '', '#' + id);
        } else if (id === 'hero' && window.location.hash) {
          history.replaceState(null, '', window.location.pathname);
        }
        break;
      }
    }
  }

  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateHash, 100);
  }, { passive: true });

  // Navigate to hash on load
  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

  // Handle hash changes (back/forward)
  window.addEventListener('hashchange', () => {
    isScrolling = true;
    const target = document.querySelector(window.location.hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setTimeout(() => { isScrolling = false; }, 1000);
  });
})();

// ===========================
// DOM Ready
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const allNavLinks = document.querySelectorAll('.nav-links a');
  const cursorGlow = document.getElementById('cursorGlow');
  const scrollProgress = document.getElementById('scrollProgress');

  // ===========================
  // Scroll Progress Bar
  // ===========================
  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    scrollProgress.style.width = progress + '%';
  }

  // ===========================
  // Navbar scroll effect
  // ===========================
  function handleScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    updateActiveNav();
    updateScrollProgress();
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ===========================
  // Cursor glow follow
  // ===========================
  if (window.matchMedia('(pointer: fine)').matches && cursorGlow) {
    let cursorX = 0, cursorY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
    }, { passive: true });

    function animateCursor() {
      glowX += (cursorX - glowX) * 0.08;
      glowY += (cursorY - glowY) * 0.08;
      cursorGlow.style.left = glowX + 'px';
      cursorGlow.style.top = glowY + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  // ===========================
  // Mobile toggle
  // ===========================
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });

  allNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
    });
  });

  // ===========================
  // Active nav highlight
  // ===========================
  function updateActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPos = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      const link = document.querySelector(`.nav-links a[href="#${id}"]`);

      if (link) {
        if (scrollPos >= top && scrollPos < top + height) {
          allNavLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      }
    });
  }

  // ===========================
  // Smooth scroll for anchor links (with hash update)
  // ===========================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const hash = this.getAttribute('href');
      const target = document.querySelector(hash);
      if (target) {
        history.pushState(null, '', hash);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===========================
  // Scroll Reveal Animations
  // ===========================
  const revealElements = document.querySelectorAll('[data-reveal]');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = parseInt(el.dataset.delay || 0);
        setTimeout(() => {
          el.classList.add('revealed');
        }, delay);
        revealObserver.unobserve(el);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -60px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ===========================
  // Counter Animation
  // ===========================
  const counters = document.querySelectorAll('[data-count]');

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        animateCounter(el, target);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));

  function animateCounter(el, target) {
    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      el.textContent = value + '+';
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  // ===========================
  // Parallax on hero shapes (mouse)
  // ===========================
  const shapes = document.querySelectorAll('.shape');
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('mousemove', (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      shapes.forEach((shape, i) => {
        const speed = (i + 1) * 12;
        const currentTransform = getComputedStyle(shape).transform;
        shape.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
      });
    }, { passive: true });
  }

  // ===========================
  // Typing effect for hero motto
  // ===========================
  const motto = document.getElementById('heroMotto');
  if (motto) {
    const text = motto.textContent;
    motto.textContent = '';
    motto.style.opacity = '1';
    let i = 0;

    function typeWriter() {
      if (i < text.length) {
        motto.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 35);
      }
    }
    setTimeout(typeWriter, 900);
  }

  // ===========================
  // Mini Track Canvas (Vibe Coded section)
  // ===========================
  const miniCanvas = document.getElementById('miniTrack');
  if (miniCanvas) {
    drawMiniTrack(miniCanvas);

    // Click on overlay navigates to game
    const overlay = miniCanvas.closest('.vibe-game-preview').querySelector('.vibe-game-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        window.location.href = 'games/racing.html';
      });
    }
  }

  // Initial calls
  handleScroll();
});

// ===========================
// Mini Track Drawing
// ===========================
function drawMiniTrack(canvas) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  // Control points for a circuit
  const points = [
    { x: 200, y: 50 }, { x: 320, y: 40 }, { x: 370, y: 100 },
    { x: 360, y: 170 }, { x: 300, y: 200 }, { x: 240, y: 240 },
    { x: 180, y: 260 }, { x: 100, y: 240 }, { x: 50, y: 190 },
    { x: 40, y: 120 }, { x: 80, y: 60 }, { x: 140, y: 45 }
  ];

  // Catmull-Rom spline
  function catmullRom(p0, p1, p2, p3, t) {
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
      y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
    };
  }

  function getSplinePoints(controlPts, segments) {
    const result = [];
    const n = controlPts.length;
    for (let i = 0; i < n; i++) {
      const p0 = controlPts[(i - 1 + n) % n];
      const p1 = controlPts[i];
      const p2 = controlPts[(i + 1) % n];
      const p3 = controlPts[(i + 2) % n];
      for (let t = 0; t < 1; t += 1 / segments) {
        result.push(catmullRom(p0, p1, p2, p3, t));
      }
    }
    return result;
  }

  const trackPoints = getSplinePoints(points, 20);

  // Background
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  // Draw grass-like dots
  ctx.fillStyle = 'rgba(30, 80, 50, 0.3)';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.beginPath();
    ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Track outer glow
  ctx.beginPath();
  ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
  for (let i = 1; i < trackPoints.length; i++) {
    ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(108, 99, 255, 0.15)';
  ctx.lineWidth = 44;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Track asphalt
  ctx.beginPath();
  ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
  for (let i = 1; i < trackPoints.length; i++) {
    ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 32;
  ctx.stroke();

  // Track center line (dashed)
  ctx.beginPath();
  ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
  for (let i = 1; i < trackPoints.length; i++) {
    ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 12]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Track edges
  function drawTrackEdge(offset) {
    ctx.beginPath();
    for (let i = 0; i < trackPoints.length; i++) {
      const prev = trackPoints[(i - 1 + trackPoints.length) % trackPoints.length];
      const next = trackPoints[(i + 1) % trackPoints.length];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * offset;
      const ny = dx / len * offset;
      if (i === 0) ctx.moveTo(trackPoints[i].x + nx, trackPoints[i].y + ny);
      else ctx.lineTo(trackPoints[i].x + nx, trackPoints[i].y + ny);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(108, 99, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawTrackEdge(16);
  drawTrackEdge(-16);

  // Animated car dot
  let carIndex = 0;
  function animateCar() {
    // Redraw track background where the car was
    ctx.fillStyle = '#0a0e14';

    // Draw car
    const pt = trackPoints[Math.floor(carIndex) % trackPoints.length];
    const nextPt = trackPoints[(Math.floor(carIndex) + 1) % trackPoints.length];
    const angle = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);

    // Car glow
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(108, 99, 255, 0.2)';
    ctx.fill();

    // Car body
    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(-6, -3, 12, 6);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(-6, -2, 2, 4);
    ctx.restore();

    carIndex += 0.4;
    if (carIndex >= trackPoints.length) carIndex = 0;

    requestAnimationFrame(() => {
      // Clear and full redraw for clean animation
      drawStaticTrack(ctx, W, H, trackPoints);
      animateCar();
    });
  }

  // Start car animation
  animateCar();
}

function drawStaticTrack(ctx, W, H, trackPoints) {
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(0, 0, W, H);

  // Grass dots (static seed for consistency - just draw a few)
  ctx.fillStyle = 'rgba(30, 80, 50, 0.25)';
  for (let i = 0; i < 100; i++) {
    // Seeded pseudo-random
    const x = ((i * 7919 + 104729) % W);
    const y = ((i * 6271 + 32749) % H);
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Track glow
  ctx.beginPath();
  ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
  for (let i = 1; i < trackPoints.length; i++) {
    ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(108, 99, 255, 0.12)';
  ctx.lineWidth = 44;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Asphalt
  ctx.beginPath();
  ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
  for (let i = 1; i < trackPoints.length; i++) {
    ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 32;
  ctx.stroke();

  // Center dashes
  ctx.beginPath();
  ctx.moveTo(trackPoints[0].x, trackPoints[0].y);
  for (let i = 1; i < trackPoints.length; i++) {
    ctx.lineTo(trackPoints[i].x, trackPoints[i].y);
  }
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 12]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Edges
  function drawEdge(offset) {
    ctx.beginPath();
    for (let i = 0; i < trackPoints.length; i++) {
      const prev = trackPoints[(i - 1 + trackPoints.length) % trackPoints.length];
      const next = trackPoints[(i + 1) % trackPoints.length];
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = -dy / len * offset;
      const ny = dx / len * offset;
      if (i === 0) ctx.moveTo(trackPoints[i].x + nx, trackPoints[i].y + ny);
      else ctx.lineTo(trackPoints[i].x + nx, trackPoints[i].y + ny);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(108, 99, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  drawEdge(16);
  drawEdge(-16);
}
