(function () {
  gsap.registerPlugin(ScrollTrigger);

  // Configuration for timing and stack visuals
  var CONFIG = {
    scrollDistanceVh: 4,     // Total scroll height (in vh)
    behindScaleStep: 0.05,   // Scale reduction for background cards
    behindYStep: 30,         // Vertical drop for background cards (px)
    stepDuration: 1.5,       // Animation duration for each card
    txtOffset: 0.1,          // Delay for text fade-in
    pinScrub: 0.25,          // Scroll smoothing
    mobileBreakpoint: 1024,  // Minimum width to run desktop animation
  };

  // Calculates the starting position for a card waiting in the background
  function behindState(i) {
    return {
      scale: Math.max(1 - i * CONFIG.behindScaleStep, 0.7),
      y: i * CONFIG.behindYStep
    };
  }

  function init() {
    var section = document.querySelector('.product-parallax');
    if (!section) return;

    // Cleanup previous instances on resize
    if (window.productCardsTl) {
      if (window.productCardsTl.scrollTrigger) window.productCardsTl.scrollTrigger.kill(true);
      window.productCardsTl.kill();
      gsap.set([section, '.product-parallax__item', '.product-parallax__img', '.product-parallax__txt'], { clearProps: 'all' });
    }

    var items = gsap.utils.toArray('.product-parallax__item');
    var isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    if (items.length < 2) return;

    // Set wrapper height to exactly match the card to eliminate huge gaps
    var cardHeight = items[0].offsetHeight;
    gsap.set(section, { position: 'relative', height: cardHeight + 'px', width: '100%' });

    // Ensure text has enough room on smaller desktop/tablet screens
    var itemMaxWidth = isMobile ? '90%' : (window.innerWidth < 1100 ? '50%' : '70%');

    // Setup initial positions for all cards
    items.forEach(function (item, i) {
      gsap.set(item, {
        position: 'absolute', top: '50%', left: '50%',
        xPercent: -50, yPercent: -50, width: '100%', maxWidth: itemMaxWidth,
        zIndex: items.length - i
      });

      var state = i === 0 ? { scale: 1, y: 0 } : behindState(i);
      var img = item.querySelector('.product-parallax__img');
      var txt = item.querySelector('.product-parallax__txt');

      if (img) gsap.set(img, { scale: state.scale, y: state.y });
      if (txt) gsap.set(txt, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 30 });
    });

    // Calculate maximum available space to prevent text overflow
    var availableTextSpace = (window.innerWidth - items[0].offsetWidth) / 2 - 40;
    var textMaxWidth = Math.max(120, Math.min(257, availableTextSpace));
    var leftX = -(textMaxWidth + 32);
    var rightX = textMaxWidth + 32;

    // Apply specific text positions based on left/right alignment
    items.forEach(function (item) {
      var txt = item.querySelector('.product-parallax__txt');
      if (!txt) return;
      
      if (!isMobile) {
        txt.style.maxWidth = textMaxWidth + 'px';
        gsap.set(txt, { x: txt.classList.contains('product-parallax__txt--right') ? rightX : leftX, y: 30, opacity: 0 });
      } else {
        txt.style.maxWidth = '100%';
        gsap.set(txt, { x: 0, y: 30, opacity: 0 });
      }
    });
    
    // Ensure the first card's text is fully visible
    gsap.set(items[0].querySelector('.product-parallax__txt'), { opacity: 1, y: 0 });

    // Create the main pinned ScrollTrigger
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'center center', // Pin perfectly in the middle of the screen
        end: '+=' + (window.innerHeight * CONFIG.scrollDistanceVh),
        pin: section.closest('.products') || section, // Pin outermost section to prevent layout bugs
        scrub: CONFIG.pinScrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: function(self) {
          // Force a white background on the dynamically created pin-spacer wrapper
          if (self.spacer) {
            self.spacer.style.backgroundColor = '#fff';
          }
        }
      }
    });

    window.productCardsTl = tl; // Save reference for cleanup

    // Build the animation sequence step-by-step
    items.forEach(function (item, i) {
      if (i === 0) return;
      var prev = items[i - 1];
      var prevTxt = prev.querySelector('.product-parallax__txt');
      var prevImg = prev.querySelector('.product-parallax__img');
      var currTxt = item.querySelector('.product-parallax__txt');
      var currImg = item.querySelector('.product-parallax__img');
      var currStart = behindState(i);

      // Animate previous card going up (full duration) and fading out (half duration)
      if (prevTxt) {
        tl.to(prevTxt, { y: window.innerWidth >= 1280 ? '-60%' : -window.innerHeight, duration: CONFIG.stepDuration }, 'step-' + i);
        tl.to(prevTxt, { opacity: 0, duration: CONFIG.stepDuration * 0.4 }, 'step-' + i);
      }
      if (prevImg) tl.to(prevImg, { y: -window.innerHeight, duration: CONFIG.stepDuration }, 'step-' + i);
      
      // Animate current card scaling up
      if (currImg) tl.fromTo(currImg, { scale: currStart.scale, y: currStart.y }, { scale: 1, y: 0, duration: CONFIG.stepDuration }, 'step-' + i);
      
      // Animate current text moving up (full duration) and fading in fast (45% duration)
      if (currTxt) {
        tl.fromTo(currTxt, { y: 30 }, { y: 0, duration: CONFIG.stepDuration }, 'step-' + i + '+=' + CONFIG.txtOffset);
        tl.fromTo(currTxt, { opacity: 0 }, { opacity: 1, duration: CONFIG.stepDuration * 0.45 }, 'step-' + i + '+=' + CONFIG.txtOffset);
      }
    });
  }

  // Initialize script safely on load
  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else window.addEventListener('load', init);

  // Auto-update on window resize (with debounce)
  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(init, 250);
  });
})();
