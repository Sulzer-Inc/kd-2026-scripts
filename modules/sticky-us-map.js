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
    var N = items.length;
    var cardScrollDuration = CONFIG.cardScrollDuration;
    var velocity = 200 / cardScrollDuration; // 200vh / duration
    var staggerTime = CONFIG.gapVh / velocity; // seconds between card centers
    var introDuration = 1.0;

    // Calculate total timeline duration dynamically in advance
    var totalTimelineDuration = introDuration;
    for (var i = 0; i < N; i++) {
      var startVal = (i === 0) ? 50 : 100;
      var endVal = (i === N - 1) ? -65 : -100;
      var travelDistance = startVal - endVal;
      var dur = (travelDistance / 200) * cardScrollDuration;
      
      var startAnim;
      if (i === 0) {
        startAnim = introDuration;
      } else {
        var card0Center = introDuration + (50 / velocity);
        var targetCenter = card0Center + (i * staggerTime);
        startAnim = targetCenter - (cardScrollDuration / 2);
      }
      
      var endAnim = startAnim + dur;
      if (endAnim > totalTimelineDuration) {
        totalTimelineDuration = endAnim;
      }
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=' + (window.innerHeight * totalTimelineDuration), // dynamically scaled pin scroll distance!
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });

    window.stickyUsMapTl = tl;

    // 1. Intro Animation (H2 & Map slide/scale into place)
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
    items.forEach(function (item, i) {
      var startAnimTime, startY, endY, duration;

      if (i === 0) {
        startY = '50vh';
      } else {
        startY = '100vh';
      }

      if (i === N - 1) {
        // Last card clears the top when center is at -65vh
        endY = '-65vh';
      } else {
        endY = '-100vh';
      }

      var startVal = parseFloat(startY);
      var endVal = parseFloat(endY);
      var travelDistance = startVal - endVal;
      duration = (travelDistance / 200) * cardScrollDuration;

      if (i === 0) {
        startAnimTime = introDuration;
      } else {
        var card0CenterTime = introDuration + (50 / velocity);
        var targetCenterTime = card0CenterTime + (i * staggerTime);
        startAnimTime = targetCenterTime - (cardScrollDuration / 2);
      }

      // A. Linear Y position scroll (constant velocity!)
      tl.fromTo(item, 
        { y: startY }, 
        { y: endY, duration: duration, ease: 'none' }, 
        startAnimTime
      );

      // B. Eased Scale Up to 1.0 in the center
      var centerOffset = startVal / velocity;
      tl.fromTo(item, 
        { scale: 0.5 }, 
        { scale: 1.0, duration: centerOffset, ease: 'power1.out' }, 
        startAnimTime
      );

      // C. Eased Scale Down to 0.9 as it scrolls off-screen
      var leaveDuration = duration - centerOffset;
      if (leaveDuration > 0) {
        tl.to(item, 
          { scale: 0.9, duration: leaveDuration, ease: 'power1.in' }, 
          startAnimTime + centerOffset
        );
      }
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
