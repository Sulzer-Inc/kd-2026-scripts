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

    if (window.productCardsTl) {
      if (window.productCardsTl.scrollTrigger) window.productCardsTl.scrollTrigger.kill(true);
      window.productCardsTl.kill();
      gsap.set([section, '.product-parallax__item', '.product-parallax__item-content', '.product-parallax__item-txt'], { clearProps: 'all' });
      
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
      var txt = item.querySelector('.product-parallax__item-txt');

      if (img) gsap.set(img, { scale: state.scale, y: state.y });
      if (txt) gsap.set(txt, { opacity: i === 0 ? 1 : 0, y: i === 0 ? 0 : 30 });
    });

    var availableTextSpace = (window.innerWidth - items[0].offsetWidth) / 2 - 40;
    var textMaxWidth = Math.max(120, Math.min(257, availableTextSpace));
    var leftX = -(textMaxWidth + 32);
    var rightX = textMaxWidth + 32;

    items.forEach(function (item) {
      var txt = item.querySelector('.product-parallax__item-txt');
      if (!txt) return;
      
      if (!isMobile) {
        txt.style.maxWidth = textMaxWidth + 'px';
        gsap.set(txt, { x: txt.classList.contains('product-parallax__item-txt--right') ? rightX : leftX, y: 30, opacity: 0 });
      } else {
        txt.style.maxWidth = '100%';
        gsap.set(txt, { x: 0, y: 30, opacity: 0 });
      }
    });
    
    gsap.set(items[0].querySelector('.product-parallax__item-txt'), { opacity: 1, y: 0 });

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
        tl.to(prevTxt, { opacity: 0, duration: CONFIG.stepDuration * 0.4 }, 'step-' + i);
      }
      if (prevImg) tl.to(prevImg, { y: -window.innerHeight, duration: CONFIG.stepDuration }, 'step-' + i);
      
      if (currImg) tl.fromTo(currImg, { scale: currStart.scale, y: currStart.y }, { scale: 1, y: 0, duration: CONFIG.stepDuration }, 'step-' + i);
      
      if (currTxt) {
        tl.fromTo(currTxt, { y: 30 }, { y: 0, duration: CONFIG.stepDuration }, 'step-' + i + '+=' + CONFIG.txtOffset);
        tl.fromTo(currTxt, { opacity: 0 }, { opacity: 1, duration: CONFIG.stepDuration * 0.45 }, 'step-' + i + '+=' + CONFIG.txtOffset);
      }
    });

    // Initialize Vimeo Players for cards
    initVimeoPlayersForCards(items);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else window.addEventListener('load', init);

  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(init, 250);
  });
})();