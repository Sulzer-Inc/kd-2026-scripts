// ============================================================================
// 4. CIRCULAR VIDEO ORBIT ROTATOR
// ============================================================================
(function () {
  gsap.registerPlugin(ScrollTrigger);

  var CONFIG = {
    mobileBreakpoint: 0,
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
        start: 'center center+=130px',
        end: CONFIG.pinDistance,
        pin: true,
        scrub: 0.1,
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
