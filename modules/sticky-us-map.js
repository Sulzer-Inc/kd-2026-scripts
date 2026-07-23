// ============================================================================
// STICKY US MAP ANIMATION (Lassie.ai style)
// ============================================================================
(function () {
  // Ensure GSAP is loaded
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  var CONFIG = {
    scrollDistanceVh: 6.5,   // Total scroll length of pin
    cardScrollDuration: 3,   // Time each card takes to travel from bottom to top
    gapVh: 70,               // Vertical gap between card centers in vh
    mobileBreakpoint: 1024,
  };

  function init() {
    var section = document.querySelector('.us-map');
    if (!section) return;

    var container = section.querySelector('.kiddom-container-2026');
    var stickyDiv = section.querySelector('.us-map__sticky-div');
    var scrollContent = section.querySelector('.us-map__scroll-content');
    var h2 = section.querySelector('.h2-2026');
    var mapImg = section.querySelector('.us-map__img');
    var items = gsap.utils.toArray('.us-map__scroll-item');

    if (!container || !stickyDiv || !scrollContent || items.length === 0) return;

    // Clear previous ScrollTrigger/Animations if any
    if (window.stickyUsMapTl) {
      if (window.stickyUsMapTl.scrollTrigger) window.stickyUsMapTl.scrollTrigger.kill(true);
      window.stickyUsMapTl.kill();
      // Clear properties on elements
      gsap.set([section, container, stickyDiv, scrollContent, h2, mapImg, items], { clearProps: 'all' });
    }

    var isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;

    if (isMobile) {
      // On mobile, keep default layout and do not run the pin animation
      return;
    }

    // --- Desktop Layout Setup ---
    // Fix container to full viewport height during the pin
    gsap.set(container, {
      position: 'relative',
      height: '100vh',
      width: '100%',
      overflow: 'hidden'
    });

    // Center the map sticky div
    gsap.set(stickyDiv, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      width: '100%',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    });

    // Center the cards scroll container over the map
    gsap.set(scrollContent, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      width: '100%',
      maxWidth: '650px',
      height: '350px',
      zIndex: 2,
      pointerEvents: 'none'
    });

    // Position each scroll item off-screen initially
    items.forEach(function (item) {
      gsap.set(item, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        xPercent: -50,
        yPercent: -50,
        y: '100vh',
        scale: 0.5,
        width: '100%',
        pointerEvents: 'auto',
        transformOrigin: '50% 50%'
      });
    });

    // --- Timeline & ScrollTrigger Setup ---
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=' + (window.innerHeight * CONFIG.scrollDistanceVh),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    window.stickyUsMapTl = tl;

    // 1. Intro Animation (H2 & Map slide/scale into place)
    var introDuration = 1.0;
    tl.fromTo(h2, 
      { y: 150, scale: 1.1 }, 
      { y: 0, scale: 0.75, duration: introDuration, ease: 'power1.out' }, 
      0
    );
    tl.fromTo(mapImg, 
      { y: 350, opacity: 0.4 }, 
      { y: 0, opacity: 1, duration: introDuration, ease: 'power1.out' }, 
      0
    );

    // 2. Cards Animation Loop
    var cardScrollDuration = CONFIG.cardScrollDuration;
    // Stagger time to keep a gap of gapVh (e.g. 50vh) between card centers.
    // Total travel is 200vh (from 100vh to -100vh).
    var staggerTime = (CONFIG.gapVh / 200) * cardScrollDuration;
    
    items.forEach(function (item, i) {
      var startAnimTime = introDuration + (i * staggerTime);
      
      // A. Linear Y position scroll from 100vh to -100vh (keeps velocity completely constant!)
      tl.fromTo(item, 
        { y: '100vh' }, 
        { y: '-100vh', duration: cardScrollDuration, ease: 'none' }, 
        startAnimTime
      );

      // B. Eased Scale Up to 1.0 in the center
      tl.fromTo(item, 
        { scale: 0.5 }, 
        { scale: 1.0, duration: cardScrollDuration / 2, ease: 'power1.out' }, 
        startAnimTime
      );

      // C. Eased Scale Down to 0.9 as it scrolls off-screen
      tl.to(item, 
        { scale: 0.9, duration: cardScrollDuration / 2, ease: 'power1.in' }, 
        startAnimTime + (cardScrollDuration / 2)
      );
    });
  }

  // Initial Boot
  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else window.addEventListener('load', init);

  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(init, 250);
  });
})();
