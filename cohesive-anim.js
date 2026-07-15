(function () {
  gsap.registerPlugin(ScrollTrigger);

  // Configuration
  var CONFIG = {
    totalProgress: 0.4,             // ~144 degrees of rotation (subtle but visible orbit)
    pinDistance: '+=1500',          // pin for 1500px of scrolling (slow, deliberate)
    pinDistanceMobile: '+=900',
    mobileBreakpoint: 1024,
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
  //   progress 0    = center of top edge
  //   progress 0.25 = middle of right edge
  //   progress 0.5  = center of bottom edge
  //   progress 0.75 = middle of left edge
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
