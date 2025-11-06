(function(){
  // Mobile nav (drawer)
  const toggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const firstMobileLink = mobileNav?.querySelector('a');

  function openMobile(){
    mobileNav.removeAttribute('hidden');
    mobileNav.setAttribute('aria-hidden','false');
    toggle.setAttribute('aria-expanded','true');
    firstMobileLink?.focus();
  }
  function closeMobile(){
    mobileNav.setAttribute('hidden','');
    mobileNav.setAttribute('aria-hidden','true');
    toggle.setAttribute('aria-expanded','false');
    toggle.focus();
  }

  if (toggle && mobileNav){
    toggle.addEventListener('click', ()=>{
      const isHidden = mobileNav.hasAttribute('hidden');
      if (isHidden) openMobile(); else closeMobile();
    });

    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape' && !mobileNav.hasAttribute('hidden')){
        closeMobile();
      }
    });

    document.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', e=>{
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const id = href.slice(1);
        const el = document.getElementById(id);
        if (el){
          e.preventDefault();
          el.scrollIntoView({behavior:'smooth', block:'start'});
          if (!mobileNav.hasAttribute('hidden')) closeMobile();
        }
      });
    });
  }

  // Demo modal, focus trap, form handling, iCal export, and toast
  const demoOpen = document.getElementById('demoOpen');
  const demoModal = document.getElementById('demoModal');
  const demoForm = document.getElementById('demoForm');
  const demoToast = document.getElementById('demoToast');
  let lastFocused = null;

  function trapFocus(e){
    const dialog = demoModal.querySelector('.dialog');
    const focusable = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length-1];
    if (e.key === 'Tab'){
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }

  function openModal(){
    lastFocused = document.activeElement;
    demoModal.removeAttribute('hidden');
    demoModal.dataset.open = 'true';
    demoModal.setAttribute('aria-hidden','false');
    const dialog = demoModal.querySelector('.dialog');
    dialog.querySelector('input, button, select, textarea, a')?.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeModal(){
    demoModal.setAttribute('hidden','');
    delete demoModal.dataset.open;
    demoModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    lastFocused?.focus();
  }

  demoOpen?.addEventListener('click', openModal);
  demoModal?.addEventListener('click', (e)=>{
    if (e.target.dataset.action === 'close' || e.target === demoModal) closeModal();
  });
  demoModal?.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') closeModal();
    trapFocus(e);
  });

  demoForm?.addEventListener('submit', (e)=>{
    e.preventDefault();
    // Basic browser validation will run first; construct an .ics calendar invite
    const fd = new FormData(demoForm);
    const name = fd.get('name') || 'TUS user';
    const email = fd.get('email') || '';
    const date = fd.get('date');
    if (!date){ demoForm.querySelector('#date').focus(); return; }
    // For demo, default to 19:00 - 20:00 local time
    const start = new Date(date + 'T19:00:00');
    const end = new Date(date + 'T20:00:00');
    function toICSDate(d){ return d.toISOString().replace(/[-:]/g,'').split('.')[0] + 'Z'; }
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TUS//MPH Booking Demo//EN',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '@tus.ie',
      'DTSTAMP:' + toICSDate(new Date()),
      'DTSTART:' + toICSDate(start),
      'DTEND:' + toICSDate(end),
      'SUMMARY:MPH booking (demo) - ' + name,
      'DESCRIPTION:Demo booking created by ' + name + ' (' + email + ')',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'mph-booking-demo.ics'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    closeModal();
    showToast('Demo booking created — calendar (.ics) downloaded');
  });

  function showToast(msg){
    if (!demoToast) return;
    demoToast.textContent = msg;
    demoToast.classList.add('show','micro-pop');
    // remove micro-pop quickly so repeated toasts animate
    setTimeout(()=> demoToast.classList.remove('micro-pop'), 350);
    setTimeout(()=> demoToast.classList.remove('show'), 4200);
  }

  // set year
  document.getElementById('year').textContent = new Date().getFullYear();

  // Create floating particles
  const particleContainer = document.querySelector('.particles');
  if (particleContainer){
    for(let i=0; i<15; i++){
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random()*100 + '%';
      p.style.animationDuration = (8 + Math.random()*12) + 's';
      p.style.animationDelay = Math.random()*5 + 's';
      p.style.setProperty('--drift', (Math.random()*100 - 50) + 'px');
      particleContainer.appendChild(p);
    }
  }

  // Scroll reveal observer
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting) e.target.classList.add('active');
    });
  }, {threshold:0.1});
  reveals.forEach(r=> revealObserver.observe(r));

  // Card mouse tracking for radial glow
  document.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('mousemove', (e)=>{
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mouse-x', x + '%');
      card.style.setProperty('--mouse-y', y + '%');
    });
  });

  // Parallax scrolling effect
  let ticking = false;
  function parallaxScroll(){
    const scrolled = window.pageYOffset;
    
    // Move gold ring slower
    const goldRing = document.querySelector('.gold-ring');
    if (goldRing){
      goldRing.style.transform = `translateY(${scrolled * 0.3}px)`;
    }

    // Move particles container slower
    const particles = document.querySelector('.particles');
    if (particles){
      particles.style.transform = `translateY(${scrolled * 0.15}px)`;
    }

    // Move hero grid items
    const heroLeft = document.querySelector('.hero-grid > div:first-child');
    const heroRight = document.querySelector('.hero-grid > div:last-child');
    if (heroLeft) heroLeft.style.transform = `translateY(${scrolled * 0.1}px)`;
    if (heroRight) heroRight.style.transform = `translateY(${scrolled * 0.15}px)`;

    ticking = false;
  }

  window.addEventListener('scroll', ()=>{
    if (!ticking){
      window.requestAnimationFrame(parallaxScroll);
      ticking = true;
    }
  }, {passive:true});
})();
