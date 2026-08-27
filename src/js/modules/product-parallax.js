// ============================================================================
// 2. PRODUCT PARALLAX CARDS
// ============================================================================
(function () {
  gsap.registerPlugin(ScrollTrigger);

  var CONFIG = {
    scrollDistanceVh: 2,
    behindScaleStep: 0.05,
    behindYStep: 30,
    stepDuration: 1.5,
    txtOffset: 0.1,
    pinScrub: 0.25,
    mobileBreakpoint: 991,
  };

  var players = [];
  var activeCardIndex = 0;
  var isSectionInView = false;

  function behindState(i) {
    return {
      scale: Math.max(1 - i * CONFIG.behindScaleStep, 0.7),
      y: i * CONFIG.behindYStep
    };
  }

  function updateVideoPlayback() {
    players.forEach(function (player, idx) {
      if (isSectionInView && idx === activeCardIndex) {
        player.play().catch(function (e) {});
      } else {
        player.pause().catch(function (e) {});
      }
    });
  }

  function initVimeoPlayersForCards(items) {
    if (typeof Vimeo === 'undefined') {
      // Load Vimeo SDK dynamically if not loaded
      if (!document.querySelector('script[src*="player.vimeo.com/api/player.js"]')) {
        var script = document.createElement('script');
        script.src = 'https://player.vimeo.com/api/player.js';
        script.onload = function () {
          setupPlayers(items);
        };
        document.head.appendChild(script);
      } else {
        setTimeout(function () {
          initVimeoPlayersForCards(items);
        }, 200);
      }
      return;
    }
    setupPlayers(items);
  }

  function setupPlayers(items) {
    players = [];
    items.forEach(function (item, idx) {
      var iframe = item.querySelector('iframe[src*="vimeo.com"]');
      if (iframe) {
        // Ensure api=1 is in the iframe src
        var src = iframe.src;
        if (src.indexOf('api=1') === -1) {
          var sep = src.indexOf('?') === -1 ? '?' : '&';
          iframe.src = src + sep + 'api=1';
        }
        var player = new Vimeo.Player(iframe);
        players[idx] = player;
        
        // Initially pause all players
        player.ready().then(function () {
          player.pause().catch(function () {});
        });
      }
    });
    
    // Update playback once players are initialized
    updateVideoPlayback();
  }

  function init() {
    var section = document.querySelector('.product-parallax');
    if (!section) return;

    var pinnedEl = section.closest('.products-section') || section;

    // Ensure smooth background and text transition for dark-blue theme change and full-viewport height
    if (!document.getElementById('kd-product-parallax-transitions')) {
      var styleTag = document.createElement('style');
      styleTag.id = 'kd-product-parallax-transitions';
      styleTag.textContent = [
        '.products-section { min-height: 100vh !important; display: flex !important; flex-direction: column !important; justify-content: center !important; transition: background-color 0.6s ease, color 0.6s ease !important; width: 100% !important; box-sizing: border-box !important; }',
        '.products-section .products-section__container { width: 100% !important; }',
        '.products-section .product-parallax__item-txt,',
        '.products-section .product-parallax__heading,',
        '.products-section .copy-2026,',
        '.products-section h1, .products-section h2, .products-section h3,',
        '.products-section p, .products-section div { transition: color 0.6s ease; }'
      ].join(' ');
      document.head.appendChild(styleTag);
    }

    if (window.productCardsTl) {
      if (window.productCardsTl.scrollTrigger) window.productCardsTl.scrollTrigger.kill(true);
      window.productCardsTl.kill();
      var oldThemeTrigger = ScrollTrigger.getById('kd-product-parallax-theme');
      if (oldThemeTrigger) oldThemeTrigger.kill(true);
      gsap.set([section, '.product-parallax__item', '.product-parallax__item-content', '.product-parallax__item-txt'], { clearProps: 'all' });
      if (pinnedEl) pinnedEl.classList.remove('dark-blue');
      
      // Pause all existing players and reset the list
      players.forEach(function (player) {
        if (player) {
          try { player.pause(); } catch (e) {}
        }
      });
      players = [];
    }

    var items = gsap.utils.toArray('.product-parallax__item');
    var isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    if (items.length < 2) return;

    var itemMaxWidth = isMobile ? '100%' : (window.innerWidth < 1440 ? '65%' : '70%');

    var availableTextSpace = (window.innerWidth - items[0].offsetWidth) / 2 - 80;
    var textMaxWidth = Math.max(120, Math.min(257, availableTextSpace));
    
    var spaceOnSide = (window.innerWidth - items[0].offsetWidth) / 2;
    var idealOffset = textMaxWidth + 32;
    var maxOffset = Math.max(0, spaceOnSide - 16); // 16px padding from screen edge
    var actualOffset = Math.min(idealOffset, maxOffset);
    
    var leftX = -actualOffset;
    var rightX = actualOffset;

    items.forEach(function (item) {
      var txt = item.querySelector('.product-parallax__item-txt');
      if (!txt) return;
      txt.style.minHeight = '0px'; // clear any previous min-height
      
      if (!isMobile) {
        txt.style.maxWidth = textMaxWidth + 'px';
        gsap.set(txt, { position: 'absolute', top: '50%', yPercent: -50, x: txt.classList.contains('product-parallax__item-txt--right') ? rightX : leftX });
      } else {
        txt.style.maxWidth = ''; // clear any desktop inline width
        gsap.set(txt, { clearProps: 'maxWidth,position,top,yPercent,x' });
        gsap.set(txt, { position: 'relative', top: 0, left: 0, right: 'auto', bottom: 'auto' });
        
        var img = item.querySelector('.product-parallax__item-content');
        if (img) {
          gsap.set(img, { clearProps: 'position' });
          gsap.set(img, { position: 'relative', top: 0, left: 0, right: 'auto', bottom: 'auto' });
        }
      }
    });

    var maxItemHeight = 0;
    items.forEach(function(item) {
      if (item.offsetHeight > maxItemHeight) maxItemHeight = item.offsetHeight;
    });

    var cardHeight = maxItemHeight;
    gsap.set(section, { position: 'relative', height: cardHeight + 'px', width: '100%' });

    var hasDarkBg = section.classList.contains('dark-bg') || (pinnedEl && pinnedEl.classList.contains('dark-bg'));

    items.forEach(function (item, i) {
      gsap.set(item, {
        position: 'absolute', bottom: '0', top: 'auto', left: '50%',
        xPercent: -50, yPercent: 0, width: '100%', maxWidth: itemMaxWidth,
        zIndex: items.length - i
      });

      var state = i === 0 ? { scale: 1, y: 0 } : behindState(i);
      var img = item.querySelector('.product-parallax__item-content');
      var txt = item.querySelector('.product-parallax__item-txt');

      if (img) {
        var imgProps = { scale: state.scale, y: state.y, zIndex: 1, force3D: false };
        if (hasDarkBg) {
          imgProps.autoAlpha = i === 0 ? 1 : 0;
        }
        gsap.set(img, imgProps);
      }
      if (txt) gsap.set(txt, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 30, zIndex: 2, force3D: false });
    });

    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        id: 'kd-product-parallax-pin',
        trigger: section,
        start: 'center center',
        end: '+=' + (window.innerHeight * CONFIG.scrollDistanceVh),
        pin: pinnedEl,
        scrub: CONFIG.pinScrub,
        invalidateOnRefresh: true,
        onRefresh: function(self) {
          if (self.spacer) {
            var bgColor = window.getComputedStyle(pinnedEl).backgroundColor;
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
              self.spacer.style.backgroundColor = bgColor;
            }
          }
        },
        onUpdate: function (self) {
          if (!self.animation) return;
          var time = self.animation.time();
          var index = Math.round(time / CONFIG.stepDuration);
          index = Math.max(0, Math.min(items.length - 1, index));
          
          if (activeCardIndex !== index) {
            activeCardIndex = index;
            updateVideoPlayback();
          }
        },
        onToggle: function (self) {
          isSectionInView = self.isActive;
          updateVideoPlayback();
        }
      }
    });

    window.productCardsTl = tl;

    // Early Theme Trigger: only toggles dark-blue when .product-parallax has .dark-bg
    if (hasDarkBg) {
      ScrollTrigger.create({
        id: 'kd-product-parallax-theme',
        trigger: pinnedEl,
        start: 'top 75%',
        end: function() {
          return tl.scrollTrigger ? tl.scrollTrigger.end : '+=' + (window.innerHeight * (CONFIG.scrollDistanceVh + 1));
        },
        toggleClass: {
          targets: pinnedEl,
          className: 'dark-blue'
        }
      });
    }

    items.forEach(function (item, i) {
      if (i === 0) return;
      var prev = items[i - 1];
      var prevTxt = prev.querySelector('.product-parallax__item-txt');
      var prevImg = prev.querySelector('.product-parallax__item-content');
      var currTxt = item.querySelector('.product-parallax__item-txt');
      var currImg = item.querySelector('.product-parallax__item-content');
      var currStart = behindState(i);

      if (prevTxt) {
        tl.to(prevTxt, { y: window.innerWidth >= 1280 ? '-60%' : -window.innerHeight, duration: CONFIG.stepDuration }, 'step-' + i);
        tl.to(prevTxt, { autoAlpha: 0, duration: CONFIG.stepDuration * 0.4 }, 'step-' + i);
      }
      if (prevImg) {
        tl.to(prevImg, { y: -window.innerHeight, duration: CONFIG.stepDuration }, 'step-' + i);
        if (hasDarkBg) {
          tl.to(prevImg, { autoAlpha: 0, duration: CONFIG.stepDuration * 0.4 }, 'step-' + i);
        }
      }
      
      if (currImg) {
        var currTo = { scale: 1, y: 0, duration: CONFIG.stepDuration };
        if (hasDarkBg) {
          tl.fromTo(currImg, { scale: currStart.scale, y: currStart.y, autoAlpha: 0 }, { scale: 1, y: 0, autoAlpha: 1, duration: CONFIG.stepDuration }, 'step-' + i);
        } else {
          tl.fromTo(currImg, { scale: currStart.scale, y: currStart.y }, currTo, 'step-' + i);
        }
      }
      
      if (currTxt) {
        tl.fromTo(currTxt, { y: 30 }, { y: 0, duration: CONFIG.stepDuration }, 'step-' + i + '+=' + CONFIG.txtOffset);
        tl.fromTo(currTxt, { autoAlpha: 0 }, { autoAlpha: 1, duration: CONFIG.stepDuration * 0.45 }, 'step-' + i + '+=' + CONFIG.txtOffset);
      }
    });

    // Initialize Vimeo Players for cards
    initVimeoPlayersForCards(items);
    
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  function startWhenReady() {
    var section = document.querySelector('.product-parallax');
    if (!section) return;

    // Run immediately so ScrollTrigger pin spacing is established BEFORE scroll restoration
    init();

    var imgs = section.querySelectorAll('img');
    var pending = [];
    for (var i = 0; i < imgs.length; i++) {
      if (!imgs[i].complete) pending.push(imgs[i]);
    }

    if (pending.length === 0) {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }
      return;
    }

    var hasRun = false;
    var timerId = null;

    var run = function () {
      if (hasRun) return;
      hasRun = true;
      if (timerId) clearTimeout(timerId);
      
      // Recalculate section height in case images expanded the cards
      var pSection = document.querySelector('.product-parallax');
      if (pSection && typeof gsap !== 'undefined') {
        var pItems = gsap.utils.toArray('.product-parallax__item', pSection);
        var maxItemHeight = 0;
        pItems.forEach(function(item) {
          if (item.offsetHeight > maxItemHeight) maxItemHeight = item.offsetHeight;
        });
        if (maxItemHeight > 0) {
          gsap.set(pSection, { height: maxItemHeight + 'px' });
        }
      }

      // We only refresh the ScrollTriggers to account for loaded image dimensions,
      // avoiding a full re-init which would kill the pin and clamp scroll position.
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }
    };

    var remaining = pending.length;
    var done = function () {
      remaining--;
      if (remaining <= 0) run();
    };
    pending.forEach(function (img) {
      img.addEventListener('load', done);
      img.addEventListener('error', done);
    });
    // Fallback if load events fail
    timerId = setTimeout(run, 2000);
  }

  if (document.readyState === 'complete') {
    setTimeout(startWhenReady, 100);
  } else {
    window.addEventListener('load', startWhenReady);
  }

  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      init();
    }, 250);
  });
})();