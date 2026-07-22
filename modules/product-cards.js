// ============================================================================
// 2. PRODUCT PARALLAX CARDS
// ============================================================================
(function () {
  gsap.registerPlugin(ScrollTrigger);

  var CONFIG = {
    scrollDistanceVh: 4,
    behindScaleStep: 0.05,
    behindYStep: 30,
    stepDuration: 1.5,
    txtOffset: 0.1,
    pinScrub: 0.25,
    mobileBreakpoint: 1024,
  };

  function behindState(i) {
    return {
      scale: Math.max(1 - i * CONFIG.behindScaleStep, 0.7),
      y: i * CONFIG.behindYStep
    };
  }

  function init() {
    var section = document.querySelector('.product-parallax');
    if (!section) return;

    if (window.productCardsTl) {
      if (window.productCardsTl.scrollTrigger) window.productCardsTl.scrollTrigger.kill(true);
      window.productCardsTl.kill();
      gsap.set([section, '.product-parallax__item', '.product-parallax__item-content', '.product-parallax__txt'], { clearProps: 'all' });
    }

    var items = gsap.utils.toArray('.product-parallax__item');
    var isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    if (items.length < 2) return;

    var cardHeight = items[0].offsetHeight;
    gsap.set(section, { position: 'relative', height: cardHeight + 'px', width: '100%' });

    var itemMaxWidth = isMobile ? '90%' : (window.innerWidth < 1100 ? '50%' : '70%');

    items.forEach(function (item, i) {
      gsap.set(item, {
        position: 'absolute', top: '50%', left: '50%',
        xPercent: -50, yPercent: -50, width: '100%', maxWidth: itemMaxWidth,
        zIndex: items.length - i
      });

      var state = i === 0 ? { scale: 1, y: 0 } : behindState(i);
      var img = item.querySelector('.product-parallax__item-content');
      var txt = item.querySelector('.product-parallax__txt');

      if (img) gsap.set(img, { scale: state.scale, y: state.y });
      if (txt) gsap.set(txt, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 30 });
    });

    var availableTextSpace = (window.innerWidth - items[0].offsetWidth) / 2 - 40;
    var textMaxWidth = Math.max(120, Math.min(257, availableTextSpace));
    var leftX = -(textMaxWidth + 32);
    var rightX = textMaxWidth + 32;

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
    
    gsap.set(items[0].querySelector('.product-parallax__txt'), { opacity: 1, y: 0 });

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'center center',
        end: '+=' + (window.innerHeight * CONFIG.scrollDistanceVh),
        pin: section.closest('.products') || section,
        scrub: CONFIG.pinScrub,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onRefresh: function(self) {
          if (self.spacer) {
            var pinnedEl = section.closest('.products') || section;
            var bgColor = window.getComputedStyle(pinnedEl).backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
              self.spacer.style.backgroundColor = bgColor;
            }
          }
        }
      }
    });

    window.productCardsTl = tl;

    items.forEach(function (item, i) {
      if (i === 0) return;
      var prev = items[i - 1];
      var prevTxt = prev.querySelector('.product-parallax__txt');
      var prevImg = prev.querySelector('.product-parallax__item-content');
      var currTxt = item.querySelector('.product-parallax__txt');
      var currImg = item.querySelector('.product-parallax__item-content');
      var currStart = behindState(i);

      if (prevTxt) {
        tl.to(prevTxt, { y: window.innerWidth >= 1280 ? '-60%' : -window.innerHeight, duration: CONFIG.stepDuration }, 'step-' + i);
        tl.to(prevTxt, { opacity: 0, duration: CONFIG.stepDuration * 0.4 }, 'step-' + i);
      }
      if (prevImg) tl.to(prevImg, { y: -window.innerHeight, duration: CONFIG.stepDuration }, 'step-' + i);
      
      if (currImg) tl.fromTo(currImg, { scale: currStart.scale, y: currStart.y }, { scale: 1, y: 0, duration: CONFIG.stepDuration }, 'step-' + i);
      
      if (currTxt) {
        tl.fromTo(currTxt, { y: 30 }, { y: 0, duration: CONFIG.stepDuration }, 'step-' + i + '+=' + CONFIG.txtOffset);
        tl.fromTo(currTxt, { opacity: 0 }, { opacity: 1, duration: CONFIG.stepDuration * 0.45 }, 'step-' + i + '+=' + CONFIG.txtOffset);
      }
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else window.addEventListener('load', init);

  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(init, 250);
  });
})();