// ============================================================================
// 3. COHESIVE PILLS ORBIT - Used on Homepage V2 2026 
// ============================================================================
(function () {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
  }

  var CONFIG = {
    mobileBreakpoint: 1024,       // Breakpoint (px) (desktop active >= 768px)
    startEntryPos: 'top 85%',    // Entry position: start rotation as soon as section enters viewport
    startPinPos: 'top 50px',    // Pin position: pin section 100px below top of viewport for header clearance
    entryProgressFraction: 0.15, // Orbit progress completed during unpinned entry phase (15%)
    pinDistance: '+=1500',       // Desktop pin distance e.g. '+=1000' to '+=2500'
    pinDistanceMobile: '+=900',  // Mobile pin distance e.g. '+=600' to '+=1200'
    minWrapperHeight: 460,       // Container min-height (px) e.g. 400 to 700
    totalProgress: 0.2,          // Orbit rotation distance e.g. 0.2 to 0.8 (0.4 = 40% loop)
    easePower: 3,                // Ease-out deceleration near ending e.g. 1 (linear), 2 (quad), 3 (cubic/Lassie style), 4 (quart)
    scaleStart: 0.4,             // Card start scale e.g. 0.3 to 0.8
    scaleEnd: 1.0,               // Card end scale e.g. 1.0
    scaleFinishAt: 1.0,          // Scale finish progress ratio e.g. 0.5 to 1.0

    // Mobile Stack Animation (Tablet & Mobile)
    mobileAnim: {
      enabled: true,             // Enable mobile/tablet slide-in animation
      startOffset: 'top 85%',    // Offset 15% (trigger when top of wrapper hits 85% down viewport)
      yOffset: 50,               // Slide in from bottom distance (px)
      duration: 0.8,             // Animation duration in seconds
      ease: 'power3.out',        // Ease function (ease-out)
      delayStart: 0.3,           // 300ms delay for the 1st item
      delayStep: 0.2             // 100ms increment for each subsequent item
    },

    // Pseudo-image (.cohesive-k12__pseudo-img) start offset, scale & opacity options
    pseudoImage: {
      enabled: true,             // Enable pseudo-image animation (true/false)
      scaleStart: 0.8,           // Image start scale e.g. 0.2 to 0.8
      opacityStart: 0.3,         // Image start opacity e.g. 0.0 to 1.0

      // Start offsets (px) relative to native Webflow layout position (progress = 0)
      startOffsets: {
        top:    { x: -40, y: 30 },  // Top image start offset (px) e.g. x: -100..100, y: -100..100
        left:   { x: -50, y: -20 }, // Left image start offset (px) e.g. x: -100..100, y: -100..100
        bottom: { x: 30,  y: 40 },  // Bottom image start offset (px) e.g. x: -100..100, y: -100..100
        right:  { x: 40,  y: -20 }  // Right image start offset (px) e.g. x: -100..100, y: -100..100
      }
    }
  };

  /**
   * Configurable ease-out function (Lassie.ai style deceleration curve near ending)
   */
  function easeOut(t, power) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var p = power !== undefined ? power : 3;
    return 1 - Math.pow(1 - t, p);
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
    if (item.classList.contains('cohesive-k12__item--right') || item.classList.contains('cohesive-k-12__item--right')) return 0.25;
    if (item.classList.contains('cohesive-k12__item--bottom') || item.classList.contains('cohesive-k-12__item--bottom')) return 0.5;
    if (item.classList.contains('cohesive-k12__item--left') || item.classList.contains('cohesive-k-12__item--left')) return 0.75;
    return 0;
  }

  function getItemKey(item) {
    if (item.classList.contains('cohesive-k12__item--right') || item.classList.contains('cohesive-k-12__item--right')) return 'right';
    if (item.classList.contains('cohesive-k12__item--bottom') || item.classList.contains('cohesive-k-12__item--bottom')) return 'bottom';
    if (item.classList.contains('cohesive-k12__item--left') || item.classList.contains('cohesive-k-12__item--left')) return 'left';
    return 'top';
  }

  function applyItemTransform(item, pos, itemScale, scaleEased) {
    item.style.left = pos.x + 'px';
    item.style.top = pos.y + 'px';
    item.style.transform = 'translate(-50%, -50%) scale(' + itemScale.toFixed(3) + ')';

    if (CONFIG.pseudoImage && CONFIG.pseudoImage.enabled) {
      var pseudoImg = item.querySelector('.cohesive-k12__pseudo-img, .cohesive-k-12__pseudo-img, .img-top, .img-left, .img-bottom, .img-right');
      if (pseudoImg) {
        var key = getItemKey(item);
        var offsets = (CONFIG.pseudoImage.startOffsets && CONFIG.pseudoImage.startOffsets[key]) || { x: 0, y: 0 };

        var imgX = offsets.x * (1 - scaleEased);
        var imgY = offsets.y * (1 - scaleEased);

        var startScale = CONFIG.pseudoImage.scaleStart !== undefined ? CONFIG.pseudoImage.scaleStart : 0.5;
        var startOpacity = CONFIG.pseudoImage.opacityStart !== undefined ? CONFIG.pseudoImage.opacityStart : 0.3;

        var imgScale = startScale + (1.0 - startScale) * scaleEased;
        var imgOpacity = startOpacity + (1.0 - startOpacity) * scaleEased;

        pseudoImg.style.transform = 'translate(' + imgX.toFixed(2) + 'px, ' + imgY.toFixed(2) + 'px) scale(' + imgScale.toFixed(3) + ')';
        pseudoImg.style.opacity = imgOpacity.toFixed(3);
        pseudoImg.style.willChange = 'transform, opacity';
      }
    }
  }

  function initCohesiveAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (gsap.registerPlugin) {
      gsap.registerPlugin(ScrollTrigger);
    }

    var section = document.querySelector('.cohesive-k-12, .cohesive-k12');
    if (!section) return;

    var wrapper = section.querySelector('.cohesive-k12__content, .cohesive-k-12__content');
    if (!wrapper) return;

    wrapper.style.position = 'relative';

    var items = wrapper.querySelectorAll('.cohesive-k12__item, .cohesive-k-12__item');
    if (items.length === 0) return;

    var heading = wrapper.querySelector('.cohesive-k12__heading, .cohesive-k-12__heading');
    var pseudoImgs = wrapper.querySelectorAll('.cohesive-k12__pseudo-img, .cohesive-k-12__pseudo-img, .img-top, .img-left, .img-bottom, .img-right');

    if (window.cohesiveAnimState) {
      var prev = window.cohesiveAnimState;
      if (prev.entryTl && prev.entryTl.scrollTrigger) prev.entryTl.scrollTrigger.kill(true);
      if (prev.entryTl) prev.entryTl.kill();
      if (prev.mainTl && prev.mainTl.scrollTrigger) prev.mainTl.scrollTrigger.kill(true);
      if (prev.mainTl) prev.mainTl.kill();
      if (prev.tl && prev.tl.scrollTrigger) prev.tl.scrollTrigger.kill(true);
      if (prev.tl) prev.tl.kill();
      gsap.set(items, { clearProps: 'position,left,top,transform,opacity,width,maxWidth,zIndex,pointerEvents' });
      if (heading) gsap.set(heading, { clearProps: 'position,left,top,transform,zIndex' });
      if (pseudoImgs.length > 0) gsap.set(pseudoImgs, { clearProps: 'transform,opacity,willChange' });
    }

    if (window.innerWidth < CONFIG.mobileBreakpoint) {
      wrapper.style.minHeight = '';
      if (CONFIG.mobileAnim && CONFIG.mobileAnim.enabled) {
        var mobileTl = gsap.fromTo(items,
          { opacity: 0, y: CONFIG.mobileAnim.yOffset },
          {
            opacity: 1,
            y: 0,
            duration: CONFIG.mobileAnim.duration,
            ease: CONFIG.mobileAnim.ease,
            stagger: function(index) {
              return CONFIG.mobileAnim.delayStart + (index * CONFIG.mobileAnim.delayStep);
            },
            scrollTrigger: {
              trigger: section,
              start: CONFIG.mobileAnim.startOffset,
              toggleActions: 'play none none none'
            }
          }
        );
        window.cohesiveAnimState = { tl: mobileTl };
      } else {
        window.cohesiveAnimState = null;
      }
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
      var pos = getPillPosition(startP - CONFIG.totalProgress, w, h);
      applyItemTransform(item, pos, CONFIG.scaleStart, 0);
    });

    var proxy = { progress: 0 };
    var isMobile = window.innerWidth < CONFIG.mobileBreakpoint;
    var pinDistance = isMobile ? CONFIG.pinDistanceMobile : CONFIG.pinDistance;
    var entryProgressMax = CONFIG.totalProgress * (CONFIG.entryProgressFraction || 0.15);

    function renderOrbit() {
      var cw = wrapper.offsetWidth;
      var ch = wrapper.offsetHeight;
      if (cw === 0 || ch === 0) return;

      var scrollNorm = proxy.progress / CONFIG.totalProgress;
      var easePower = CONFIG.easePower !== undefined ? CONFIG.easePower : 3;

      var orbitEased = easeOut(scrollNorm, easePower);

      var scaleT = scrollNorm / CONFIG.scaleFinishAt;
      if (scaleT < 0) scaleT = 0;
      if (scaleT > 1) scaleT = 1;
      var scaleEased = easeOut(scaleT, easePower);
      var itemScale = CONFIG.scaleStart + (CONFIG.scaleEnd - CONFIG.scaleStart) * scaleEased;

      for (var i = 0; i < itemArr.length; i++) {
        var item = itemArr[i];
        var startP = getItemStartProgress(item);
        var currentP = startP - CONFIG.totalProgress + (CONFIG.totalProgress * orbitEased);
        var pos = getPillPosition(currentP, cw, ch);
        applyItemTransform(item, pos, itemScale, scaleEased);
      }
    }

    // PHASE 1: Entry phase animation (starts unpinned as soon as section enters viewport top 85%)
    var entryTl = gsap.to(proxy, {
      progress: entryProgressMax,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: CONFIG.startEntryPos || 'top 85%',
        end: CONFIG.startPinPos || 'top top',
        scrub: true,
        pin: false,
        invalidateOnRefresh: true,
        onUpdate: renderOrbit
      }
    });

    // PHASE 2: Main pinned phase animation (pins section when aligned at screen top)
    var mainTl = gsap.fromTo(proxy,
      { progress: entryProgressMax },
      {
        progress: CONFIG.totalProgress,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: CONFIG.startPinPos || 'top top',
          end: pinDistance,
          scrub: true,
          pin: true,
          pinSpacing: true,
          invalidateOnRefresh: true,
          onUpdate: renderOrbit
        }
      }
    );

    window.cohesiveAnimState = { entryTl: entryTl, mainTl: mainTl };
  }

  function startWhenReady() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var section = document.querySelector('.cohesive-k-12, .cohesive-k12');
    if (!section) return;

    // Run immediately so ScrollTrigger pin spacing is established BEFORE scroll restoration
    initCohesiveAnimation();

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
    timerId = setTimeout(run, 2000);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(startWhenReady, 100);
  } else {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      initCohesiveAnimation();
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.sort();
        ScrollTrigger.refresh();
      }
    }, 250);
  });

  if (window.Webflow) {
    window.Webflow.push(function () { setTimeout(startWhenReady, 200); });
  }
})();