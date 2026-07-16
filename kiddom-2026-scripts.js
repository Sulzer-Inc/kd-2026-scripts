/**
 * Kiddom Website 2026 Consolidated Animation Scripts
 * 
 * Consolidates all site scroll and interactive animations:
 * 1. HERO SVG PATH ANIMATION: Random draw-in path trace and shapes bouncing pop-in
 * 2. PRODUCT PARALLAX CARDS: Deck stacking cards timeline triggered on scroll pin
 * 3. COHESIVE PILLS ORBIT: Text-orbiting rounded-rectangle path layout
 * 4. CIRCULAR VIDEO ORBIT ROTATOR: Rotating circular video container replacing elements with muted Vimeo iframes
 */

// ============================================================================
// 1. HERO SVG PATH ANIMATION (formerly hero-anim.js)
// ============================================================================
(function () {
  gsap.registerPlugin(ScrollTrigger);

  function initHeroSVG() {
    var svgWrap = document.querySelector('.hero-2026--animated-bg');
    if (!svgWrap) return;

    var traces = svgWrap.querySelectorAll('.anim-trace');
    var fades = svgWrap.querySelectorAll('.anim-fade');

    // 1. Prepare Traces (Draw Line Effect)
    traces.forEach(function (path) {
      var length = path.getTotalLength ? path.getTotalLength() : 1000;
      gsap.set(path, {
        strokeDasharray: length + 10,
        strokeDashoffset: length + 10,
        opacity: 1
      });
    });

    // 2. Prepare Fades (Solid shapes)
    if (fades.length > 0) {
      gsap.set(fades, { 
        fillOpacity: 0,
        scale: 0.5,
        y: 30,
        transformOrigin: '50% 50%' 
      });
    }

    // 3. Create Timeline
    var tl = gsap.timeline({
      repeat: -1,
      yoyo: true,
      repeatDelay: 1,
      scrollTrigger: {
        trigger: svgWrap,
        start: 'top 75%'
      }
    });

    if (traces.length > 0) {
      tl.to(traces, {
        strokeDashoffset: 0,
        duration: 2,
        ease: 'power2.inOut',
        stagger: {
          amount: 1,
          from: 'random'
        }
      }, 0);
    }

    if (fades.length > 0) {
      tl.to(fades, {
        fillOpacity: 1,
        scale: 1,
        y: 0,
        duration: 2.5,
        ease: 'elastic.out(1, 0.6)',
        stagger: {
          amount: 1.2,
          from: 'random'
        }
      }, 1);
    }
  }

  document.addEventListener('DOMContentLoaded', initHeroSVG);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initHeroSVG, 100);
  }
})();


// ============================================================================
// 2. PRODUCT PARALLAX CARDS (formerly product-cards.js)
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
      gsap.set([section, '.product-parallax__item', '.product-parallax__img', '.product-parallax__txt'], { clearProps: 'all' });
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
      var img = item.querySelector('.product-parallax__img');
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
      var prevImg = prev.querySelector('.product-parallax__img');
      var currTxt = item.querySelector('.product-parallax__txt');
      var currImg = item.querySelector('.product-parallax__img');
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


// ============================================================================
// 3. COHESIVE PILLS ORBIT (formerly cohesive-anim.js - Cohesive Pills Section)
// ============================================================================
(function () {
  gsap.registerPlugin(ScrollTrigger);

  var CONFIG = {
    totalProgress: 0.4,
    pinDistance: '+=1500',
    pinDistanceMobile: '+=900',
    mobileBreakpoint: 1200,
    minWrapperHeight: 560,
    scaleStart: 0.6,
    scaleEnd: 1.0,
    scaleFinishAt: 0.8
  };

  function power4Out(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var inv = 1 - t;
    return 1 - inv * inv * inv * inv;
  }

  function getPillPosition(progress, w, h) {
    var r = Math.max(0, h / 2);
    var flatWidth = Math.max(0, w - 2 * r);
    var arcLen = Math.PI * r;
    var perimeter = 2 * flatWidth + 2 * arcLen;
    if (perimeter <= 0) return { x: w / 2, y: h / 2 };

    var p = ((progress % 1) + 1) % 1;
    var d = p * perimeter;

    var halfTop = flatWidth / 2;

    if (d <= halfTop) return { x: w / 2 + d, y: 0 };
    d -= halfTop;

    if (d <= arcLen) {
      var angle = -Math.PI / 2 + (d / arcLen) * Math.PI;
      return { x: (w - r) + r * Math.cos(angle), y: r + r * Math.sin(angle) };
    }
    d -= arcLen;

    if (d <= flatWidth) return { x: (w - r) - d, y: 2 * r };
    d -= flatWidth;

    if (d <= arcLen) {
      var angle = Math.PI / 2 + (d / arcLen) * Math.PI;
      return { x: r + r * Math.cos(angle), y: r + r * Math.sin(angle) };
    }
    d -= arcLen;

    return { x: r + d, y: 0 };
  }

  function getItemStartProgress(item) {
    if (item.classList.contains('cohesive-k12__item--right')) return 0.25;
    if (item.classList.contains('cohesive-k12__item--bottom')) return 0.5;
    if (item.classList.contains('cohesive-k12__item--left')) return 0.75;
    return 0;
  }

  function applyItemTransform(item, pos, itemScale) {
    item.style.left = pos.x + 'px';
    item.style.top = pos.y + 'px';
    item.style.transform = 'translate(-50%, -50%) scale(' + itemScale.toFixed(3) + ')';
  }

  function initCohesiveAnimation() {
    var section = document.querySelector('.cohesive-k-12');
    if (!section) return;

    var wrapper = section.querySelector('.cohesive-k12__content');
    if (!wrapper) return;

    var items = wrapper.querySelectorAll('.cohesive-k12__item');
    if (items.length === 0) return;

    var heading = wrapper.querySelector('.cohesive-k12__heading');

    if (window.cohesiveAnimState) {
      var prev = window.cohesiveAnimState;
      if (prev.tl && prev.tl.scrollTrigger) prev.tl.scrollTrigger.kill(true);
      if (prev.tl) prev.tl.kill();
      gsap.set(items, { clearProps: 'position,left,top,transform,opacity,width,maxWidth,zIndex,pointerEvents' });
      if (heading) gsap.set(heading, { clearProps: 'position,left,top,transform,zIndex' });
    }

    if (window.innerWidth < CONFIG.mobileBreakpoint) {
      wrapper.style.minHeight = '';
      window.cohesiveAnimState = null;
      return;
    }

    var rect = wrapper.getBoundingClientRect();
    var w = rect.width;
    var h = Math.max(rect.height, CONFIG.minWrapperHeight);

    if (rect.height < CONFIG.minWrapperHeight) {
      wrapper.style.minHeight = h + 'px';
    }

    if (heading) {
      gsap.set(heading, {
        position: 'absolute',
        top: '50%',
        left: '50%',
        xPercent: -50,
        yPercent: -50,
        zIndex: 2
      });
    }

    var itemArr = Array.prototype.slice.call(items);
    itemArr.forEach(function (item, i) {
      gsap.set(item, {
        position: 'absolute',
        left: 0,
        top: 0,
        opacity: 1,
        scale: CONFIG.scaleStart,
        pointerEvents: 'none',
        zIndex: 1,
        willChange: 'transform'
      });
      var startP = getItemStartProgress(item);
      var pos = getPillPosition(startP, w, h);
      applyItemTransform(item, pos, CONFIG.scaleStart);
    });

    var proxy = { progress: 0 };
    var isMobile = window.innerWidth < CONFIG.mobileBreakpoint;
    var pinDistance = isMobile ? CONFIG.pinDistanceMobile : CONFIG.pinDistance;

    var tl = gsap.to(proxy, {
      progress: CONFIG.totalProgress,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'center center',
        end: pinDistance,
        scrub: 1,
        pin: true,
        pinSpacing: true,
        invalidateOnRefresh: true,
        anticipatePin: 1
      },
      onUpdate: function () {
        var cw = wrapper.offsetWidth;
        var ch = wrapper.offsetHeight;
        if (cw === 0 || ch === 0) return;

        var scrollNorm = proxy.progress / CONFIG.totalProgress;
        var scaleT = scrollNorm / CONFIG.scaleFinishAt;
        if (scaleT < 0) scaleT = 0;
        if (scaleT > 1) scaleT = 1;
        var scaleEased = power4Out(scaleT);
        var itemScale = CONFIG.scaleStart + (CONFIG.scaleEnd - CONFIG.scaleStart) * scaleEased;

        for (var i = 0; i < itemArr.length; i++) {
          var item = itemArr[i];
          var startP = getItemStartProgress(item);
          var currentP = startP + proxy.progress;
          var pos = getPillPosition(currentP, cw, ch);
          applyItemTransform(item, pos, itemScale);
        }
      }
    });

    window.cohesiveAnimState = { tl: tl };
  }

  function startWhenReady() {
    var section = document.querySelector('.cohesive-k-12');
    if (!section) return;

    var imgs = section.querySelectorAll('img');
    var pending = [];
    for (var i = 0; i < imgs.length; i++) {
      if (!imgs[i].complete) pending.push(imgs[i]);
    }

    var run = function () {
      initCohesiveAnimation();
      ScrollTrigger.refresh();
    };

    if (pending.length === 0) {
      run();
      return;
    }

    var remaining = pending.length;
    var done = function () {
      remaining--;
      if (remaining <= 0) run();
    };
    pending.forEach(function (img) {
      img.addEventListener('load', done);
      img.addEventListener('error', done);
    });
    setTimeout(run, 2000);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(startWhenReady, 100);
  } else {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(startWhenReady, 250);
  });

  if (window.Webflow) {
    window.Webflow.push(function () { setTimeout(startWhenReady, 200); });
  }
})();


// ============================================================================
// 4. CIRCULAR VIDEO ORBIT ROTATOR (formerly cohesive-anim.js - Rotator Section)
// ============================================================================
(function () {
  gsap.registerPlugin(ScrollTrigger);

  var CONFIG = {
    mobileBreakpoint: 991,
    pinDistance: '+=1200',
    spacingMode: 'quarter' // 'quarter' (90 degrees) or 'dynamic' (360 / items.length)
  };

  var state = {
    tl: null,
    items: [],
    activeIdx: 0,
    playersReady: {}
  };

  function initRotatorAnimation() {
    var section = document.querySelector('.inside-every-lesson');
    if (!section) return;

    var container = section.querySelector('.rotator-video');
    if (!container) return;

    if (state.tl) {
      if (state.tl.scrollTrigger) state.tl.scrollTrigger.kill(true);
      state.tl.kill();
      state.tl = null;
    }

    // Reset items inline styles on resizing or re-init
    state.items = Array.prototype.slice.call(container.querySelectorAll('.rotator-video__item'));
    if (state.items.length === 0) return;

    state.items.forEach(function (item) {
      gsap.set(item, { clearProps: 'all' });
      var cover = item.tagName === 'IMG' ? item : item.querySelector('img');
      if (cover) gsap.set(cover, { clearProps: 'all' });
      var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
      if (iframe) gsap.set(iframe, { clearProps: 'opacity' });
    });

    if (window.innerWidth < CONFIG.mobileBreakpoint) {
      state.items.forEach(function (item) {
        var cover = item.tagName === 'IMG' ? item : item.querySelector('img');
        if (cover) cover.style.opacity = '1';
        var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
        if (iframe) iframe.style.opacity = '0';
      });
      return;
    }

    var N = state.items.length;
    var spacing = (CONFIG.spacingMode === 'quarter') ? (Math.PI / 2) : (2 * Math.PI / N);

    // Calculate starting angles based on Webflow classes
    state.items.forEach(function (item, idx) {
      item.style.position = 'absolute';
      item.style.maxWidth = 'none'; // clear CSS max-width limits to allow dynamic sizing

      var startAngle = 0;
      if (item.classList.contains('vid-2')) {
        startAngle = 0; // right (active)
      } else if (item.classList.contains('vid-3')) {
        startAngle = spacing; // bottom
      } else if (item.classList.contains('vid-1')) {
        startAngle = -spacing; // top
      } else {
        startAngle = idx * spacing;
      }
      item.startAngle = startAngle;

      // Auto-append api=1 to Vimeo iframes to enable postMessage API controls
      var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
      if (iframe) {
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.borderRadius = '8px';
        
        var embed = item.querySelector('.w-embed');
        if (embed) {
          embed.style.position = 'absolute';
          embed.style.top = '0';
          embed.style.left = '0';
          embed.style.width = '100%';
          embed.style.height = '100%';
        }
        
        if (iframe.src && iframe.src.indexOf('vimeo.com') !== -1 && iframe.src.indexOf('api=1') === -1) {
          var separator = iframe.src.indexOf('?') === -1 ? '?' : '&';
          iframe.src = iframe.src + separator + 'api=1';
        }
      }
    });

    var startRotation, endRotation;
    if (CONFIG.spacingMode === 'quarter') {
      startRotation = -spacing;
      endRotation = spacing;
    } else {
      startRotation = 0;
      endRotation = (N - 1) * spacing;
    }
    var rotationSpan = endRotation - startRotation;

    // Set starting positions
    state.items.forEach(function (item) {
      var theta = item.startAngle + startRotation;
      item.style.left = (50 + 50 * Math.cos(theta)) + '%';
      item.style.top = (50 + 50 * Math.sin(theta)) + '%';
      
      var isCurrentActive = Math.abs(theta % (2 * Math.PI)) < 0.01;
      var width = isCurrentActive ? 90 : 50;
      item.style.width = width + '%';
      item.style.aspectRatio = '16/9';
      item.style.transform = 'translate(-50%, -50%)';

      var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
      var cover = item.tagName === 'IMG' ? item : item.querySelector('img');
      if (iframe) iframe.style.opacity = isCurrentActive ? '1' : '0';
      if (cover) cover.style.opacity = isCurrentActive ? '0' : '1';
    });

    var proxy = { progress: 0 };
    state.activeIdx = 0;

    state.tl = gsap.to(proxy, {
      progress: 1.0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'center center',
        end: CONFIG.pinDistance,
        pin: true,
        scrub: 0.5,
        snap: {
          snapTo: 1 / (N - 1),
          duration: { min: 0.2, max: 0.5 },
          ease: 'power1.inOut'
        },
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var phi = startRotation + self.progress * rotationSpan;
          var closestIdx = -1;
          var minCoverDist = Infinity;

          state.items.forEach(function (item, idx) {
            var theta = item.startAngle + phi;

            // Position center on the circle
            item.style.left = (50 + 50 * Math.cos(theta)) + '%';
            item.style.top = (50 + 50 * Math.sin(theta)) + '%';

            // Distance to active position (0 rad)
            var normalizedTheta = theta % (2 * Math.PI);
            if (normalizedTheta > Math.PI) normalizedTheta -= 2 * Math.PI;
            if (normalizedTheta < -Math.PI) normalizedTheta += 2 * Math.PI;

            var dist = Math.abs(normalizedTheta);
            var limit = spacing;
            var t = Math.max(0, 1 - dist / limit);

            // Interpolate width smoothly from 50% to 90%
            var width = 50 + 40 * t;
            item.style.width = width.toFixed(3) + '%';
            item.style.aspectRatio = '16/9';
            item.style.transform = 'translate(-50%, -50%)';

            // Fade cover and iframe
            var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
            var cover = item.tagName === 'IMG' ? item : item.querySelector('img');
            if (iframe) iframe.style.opacity = t.toFixed(3);
            if (cover) cover.style.opacity = (1 - t).toFixed(3);

            if (dist < minCoverDist) {
              minCoverDist = dist;
              closestIdx = idx;
            }
          });

          if (closestIdx !== -1 && closestIdx !== state.activeIdx) {
            state.activeIdx = closestIdx;
            controlVideos();
          }
        }
      }
    });
  }

  function controlVideos() {
    state.items.forEach(function (item, idx) {
      var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
      if (!iframe || !iframe.contentWindow) return;

      var isCurrentActive = (idx === state.activeIdx);
      if (state.playersReady[idx]) {
        var action = isCurrentActive ? 'play' : 'pause';
        iframe.contentWindow.postMessage(JSON.stringify({ method: action }), '*');
      }
    });
  }

  window.addEventListener('message', function (event) {
    if (event.origin && event.origin.indexOf('vimeo.com') !== -1) {
      try {
        var data = JSON.parse(event.data);
        if (data.event === 'ready') {
          state.items.forEach(function (item, idx) {
            var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
            if (iframe && iframe.contentWindow === event.source) {
              state.playersReady[idx] = true;
              if (idx === state.activeIdx) {
                iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
              } else {
                iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
              }
            }
          });
        }
      } catch (e) {}
    }
  });

  function startWhenReady() {
    var section = document.querySelector('.inside-every-lesson');
    if (!section) return;

    initRotatorAnimation();
    ScrollTrigger.refresh();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(startWhenReady, 100);
  } else {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(startWhenReady, 250);
  });

  if (window.Webflow) {
    window.Webflow.push(function () { setTimeout(startWhenReady, 200); });
  }
})();
