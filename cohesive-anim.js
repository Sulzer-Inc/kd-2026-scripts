(function () {
  gsap.registerPlugin(ScrollTrigger);

  // Configuration
  var CONFIG = {
    totalProgress: 0.4,             // ~144 degrees of rotation (subtle but visible orbit)
    pinDistance: '+=1500',          // pin for 1500px of scrolling (slow, deliberate)
    pinDistanceMobile: '+=900',
    mobileBreakpoint: 1200,
    minWrapperHeight: 560,          // ensures a reasonable pill orbit area
    scaleStart: 0.6,                // items begin at 70% of their actual size (uniform)
    scaleEnd: 1.0,                  // items grow to 100% of their actual size
    scaleFinishAt: 0.8              // scaling completes at 80% of scroll
  };

  // power4.out easing approximation
  function power4Out(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var inv = 1 - t;
    return 1 - inv * inv * inv * inv;
  }

  // Compute position along a pill-shaped (rounded-rectangle) path

  function getPillPosition(progress, w, h) {
    var r = Math.max(0, h / 2);
    var flatWidth = Math.max(0, w - 2 * r);
    var arcLen = Math.PI * r;
    var perimeter = 2 * flatWidth + 2 * arcLen;
    if (perimeter <= 0) return { x: w / 2, y: h / 2 };

    var p = ((progress % 1) + 1) % 1;
    var d = p * perimeter;

    var halfTop = flatWidth / 2;

    // Half of top edge: center-top -> top-right corner
    if (d <= halfTop) return { x: w / 2 + d, y: 0 };
    d -= halfTop;

    // Right arc: top-right -> bottom-right
    if (d <= arcLen) {
      var angle = -Math.PI / 2 + (d / arcLen) * Math.PI;
      return { x: (w - r) + r * Math.cos(angle), y: r + r * Math.sin(angle) };
    }
    d -= arcLen;

    // Bottom edge: right-bottom -> left-bottom
    if (d <= flatWidth) return { x: (w - r) - d, y: 2 * r };
    d -= flatWidth;

    // Left arc: bottom-left -> top-left
    if (d <= arcLen) {
      var angle = Math.PI / 2 + (d / arcLen) * Math.PI;
      return { x: r + r * Math.cos(angle), y: r + r * Math.sin(angle) };
    }
    d -= arcLen;

    // Half of top edge: top-left -> center-top
    return { x: r + d, y: 0 };
  }

  function getItemStartProgress(item) {
    if (item.classList.contains('cohesive-k12__item--right')) return 0.25;
    if (item.classList.contains('cohesive-k12__item--bottom')) return 0.5;
    if (item.classList.contains('cohesive-k12__item--left')) return 0.75;
    return 0; // --top / default
  }

  function applyItemTransform(item, pos, itemScale) {
    // Position from the pill path
    item.style.left = pos.x + 'px';
    item.style.top = pos.y + 'px';
    // Identical scale for every item (uniform, scroll-driven)
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

    // Kill any existing instance (clean re-init on resize)
    if (window.cohesiveAnimState) {
      var prev = window.cohesiveAnimState;
      if (prev.tl && prev.tl.scrollTrigger) prev.tl.scrollTrigger.kill(true);
      if (prev.tl) prev.tl.kill();
      gsap.set(items, { clearProps: 'position,left,top,transform,opacity,width,maxWidth,zIndex,pointerEvents' });
      if (heading) gsap.set(heading, { clearProps: 'position,left,top,transform,zIndex' });
    }

    // Disable on screens smaller than the mobile breakpoint
    if (window.innerWidth < CONFIG.mobileBreakpoint) {
      wrapper.style.minHeight = '';
      window.cohesiveAnimState = null;
      return;
    }

    // Measure wrapper WHILE items are still in flow, so we get the natural height
    var rect = wrapper.getBoundingClientRect();
    var w = rect.width;
    var h = Math.max(rect.height, CONFIG.minWrapperHeight);

    // Force a min-height so the pill orbit area is consistent across screen sizes
    if (rect.height < CONFIG.minWrapperHeight) {
      wrapper.style.minHeight = h + 'px';
    }

    // Center the heading within the wrapper so items can orbit around it
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

    // Prepare each item: absolute, fully visible, 70% size, ready to scale up and orbit
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
      // Place at the pill position for its starting slot immediately
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

        // Uniform scale across all items — tied to overall scroll progress, not per-item.
        // Starts at CONFIG.scaleStart, reaches CONFIG.scaleEnd at scaleFinishAt (80%) of scroll,
        // then plateaus at CONFIG.scaleEnd for the rest of the scroll.
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

    // Make sure images inside the section have loaded so dimensions are accurate
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
    // Safety net if load events never fire (e.g. cached images in some browsers)
    setTimeout(run, 2000);
  }

  // Boot safely
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(startWhenReady, 100);
  } else {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  }

  // Re-init on resize (debounced) so the orbit re-fits the new viewport
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(startWhenReady, 250);
  });

  // If Webflow re-renders the page after init, restart the animation
  if (window.Webflow) {
    window.Webflow.push(function () { setTimeout(startWhenReady, 200); });
  }
})();

// Circular Video Orbit Animation
(function () {
  gsap.registerPlugin(ScrollTrigger);

  var CONFIG = {
    mobileBreakpoint: 991,
    pinDistance: '+=1200',
    totalRotation: 240 * Math.PI / 180, // 240 degrees in radians
    vimeoUrl: 'https://player.vimeo.com/video/1202563231?api=1&background=1&autoplay=0&loop=1&muted=1'
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

    // Clean up any existing instance
    if (state.tl) {
      if (state.tl.scrollTrigger) state.tl.scrollTrigger.kill(true);
      state.tl.kill();
      state.tl = null;
    }

    // Reset items
    if (state.items.length > 0) {
      state.items.forEach(function (item) {
        gsap.set(item, { clearProps: 'all' });
        var cover = item.querySelector('.rotator-video__cover');
        if (cover) gsap.set(cover, { clearProps: 'all' });
        var video = item.querySelector('.rotator-video__video');
        if (video) gsap.set(video, { clearProps: 'all' });
      });
    }

    // Check breakpoint
    if (window.innerWidth < CONFIG.mobileBreakpoint) {
      var covers = container.querySelectorAll('.rotator-video__cover');
      covers.forEach(function (cover) { cover.style.opacity = '1'; });
      var videos = container.querySelectorAll('.rotator-video__video');
      videos.forEach(function (video) { video.style.opacity = '0'; });
      return;
    }

    // Check if we already did the iframe wrapping
    var originalImages = container.querySelectorAll('img.rotator-video__item');
    if (originalImages.length > 0) {
      state.items = [];
      Array.prototype.slice.call(originalImages).forEach(function (img) {
        var wrapper = document.createElement('div');
        wrapper.className = img.className;
        wrapper.style.position = 'absolute';
        wrapper.style.width = '90%';
        wrapper.style.aspectRatio = '16/9';

        // Determine starting angle based on class name
        var startAngle = 0;
        if (img.classList.contains('vid-2')) {
          startAngle = 0; // Right (active)
        } else if (img.classList.contains('vid-3')) {
          startAngle = 120 * Math.PI / 180; // Bottom-left
        } else if (img.classList.contains('vid-1')) {
          startAngle = -120 * Math.PI / 180; // Top-left
        }
        wrapper.startAngle = startAngle;

        // Cover Image
        var cover = document.createElement('img');
        cover.src = img.src;
        cover.className = 'rotator-video__cover';
        cover.style.position = 'absolute';
        cover.style.top = '0';
        cover.style.left = '0';
        cover.style.width = '100%';
        cover.style.height = '100%';
        cover.style.objectFit = 'cover';
        cover.style.transition = 'opacity 0.3s';
        cover.style.pointerEvents = 'none';
        cover.style.borderRadius = '8px';
        cover.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';

        // Video Iframe
        var iframe = document.createElement('iframe');
        iframe.src = CONFIG.vimeoUrl;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'autoplay; fullscreen');
        iframe.className = 'rotator-video__video';
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.opacity = '0';
        iframe.style.transition = 'opacity 0.3s';
        iframe.style.pointerEvents = 'none';
        iframe.style.borderRadius = '8px';

        wrapper.appendChild(cover);
        wrapper.appendChild(iframe);
        img.parentNode.replaceChild(wrapper, img);
        state.items.push(wrapper);
      });
    } else {
      // Wrappers are already created, grab them
      state.items = Array.prototype.slice.call(container.querySelectorAll('.rotator-video__item'));
    }

    // Position them immediately at starting progress
    state.items.forEach(function (item) {
      var theta = item.startAngle;
      item.style.left = (50 + 50 * Math.cos(theta)) + '%';
      item.style.top = (50 + 50 * Math.sin(theta)) + '%';
      var isActive = item.startAngle === 0;
      var scale = isActive ? 1.0 : 0.5;
      item.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
      
      var iframe = item.querySelector('.rotator-video__video');
      var cover = item.querySelector('.rotator-video__cover');
      if (iframe) iframe.style.opacity = isActive ? '1' : '0';
      if (cover) cover.style.opacity = isActive ? '0' : '1';
    });

    var proxy = { progress: 0 };
    state.activeIdx = 0;

    // Create timeline
    state.tl = gsap.to(proxy, {
      progress: 1.0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'center center',
        end: CONFIG.pinDistance,
        pin: true,
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var phi = self.progress * CONFIG.totalRotation;
          var closestIdx = -1;
          var minCoverDist = Infinity;

          state.items.forEach(function (item, idx) {
            var theta = item.startAngle + phi;

            // Position
            item.style.left = (50 + 50 * Math.cos(theta)) + '%';
            item.style.top = (50 + 50 * Math.sin(theta)) + '%';

            // Calculate distance to active angle (0)
            var normalizedTheta = theta % (2 * Math.PI);
            if (normalizedTheta > Math.PI) normalizedTheta -= 2 * Math.PI;
            if (normalizedTheta < -Math.PI) normalizedTheta += 2 * Math.PI;

            var dist = Math.abs(normalizedTheta);
            var limit = 90 * Math.PI / 180; // 90 degrees
            var t = Math.max(0, 1 - dist / limit);

            var scale = 0.5 + 0.5 * t;
            item.style.transform = 'translate(-50%, -50%) scale(' + scale.toFixed(3) + ')';

            // Cross-fade cover and video iframe
            var iframe = item.querySelector('.rotator-video__video');
            var cover = item.querySelector('.rotator-video__cover');
            if (iframe) iframe.style.opacity = t.toFixed(3);
            if (cover) cover.style.opacity = (1 - t).toFixed(3);

            // Track closest to active angle
            if (dist < minCoverDist) {
              minCoverDist = dist;
              closestIdx = idx;
            }
          });

          // Play/pause control based on active change
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
      var iframe = item.querySelector('.rotator-video__video');
      if (!iframe || !iframe.contentWindow) return;

      var isCurrentActive = (idx === state.activeIdx);
      if (state.playersReady[idx]) {
        var action = isCurrentActive ? 'play' : 'pause';
        iframe.contentWindow.postMessage(JSON.stringify({ method: action }), '*');
      }
    });
  }

  // Set up message listener for Vimeo players ready event
  window.addEventListener('message', function (event) {
    if (event.origin && event.origin.indexOf('vimeo.com') !== -1) {
      try {
        var data = JSON.parse(event.data);
        if (data.event === 'ready') {
          state.items.forEach(function (item, idx) {
            var iframe = item.querySelector('.rotator-video__video');
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
