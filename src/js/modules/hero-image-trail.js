// ============================================================================
// HERO IMAGE TRAIL — Mouse-following image trail effect
// Inspired by Museum Studio (museumstudio.com) hero section
// ============================================================================
(function () {
  // ---------------------------------------------------------------------------
  // Configuration — tweak these to adjust the feel
  // ---------------------------------------------------------------------------
  var CONFIG = {
    containerSelector: '.hero-trail-section',   // Hero section (scopes mousemove)
    contentSelector:   '.hero-trail__content',   // Wrapper around trail images
    imgSelector:       '.hero-trail__img',        // Each trail image element
    threshold:         100,   // px of mouse movement before spawning next image
    fadeDuration:      1,     // seconds for the fade-out animation
    fadeDelay:         0.4,   // seconds before fade-out starts
    moveEase:          'expo', // GSAP ease for position lerp
    scaleDown:         0.2,   // final scale when fading out
    lerpSpeed:         0.1,   // position interpolation speed (0–1)
    mobileBreakpoint:  992    // disable below this width
  };

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  var mousePos     = { x: 0, y: 0 };
  var lastSpawnPos = { x: 0, y: 0 };
  var cacheMousePos = { x: 0, y: 0 };
  var currentIndex = 0;
  var images       = [];
  var rafId        = null;
  var isActive     = false;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  // Linear interpolation
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Distance between two points
  function getDistance(x1, y1, x2, y2) {
    var dx = x1 - x2;
    var dy = y1 - y2;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Get mouse position relative to the content container
  function getMouseRelativePos(e, contentEl) {
    var rect = contentEl.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // ---------------------------------------------------------------------------
  // Image wrapper — manages individual trail image animation
  // ---------------------------------------------------------------------------
  function TrailImage(el) {
    this.el = el;
    this.rect = el.getBoundingClientRect();
    this.defaultStyle = {
      scale: 1,
      x: 0,
      y: 0,
      opacity: 0
    };
    this.timeline = null;
  }

  TrailImage.prototype.resize = function () {
    this.rect = this.el.getBoundingClientRect();
  };

  TrailImage.prototype.show = function (pos) {
    // Kill any running timeline on this image
    if (this.timeline) {
      this.timeline.kill();
    }

    this.timeline = gsap.timeline();

    // Immediately position and show the image
    this.timeline
      .set(this.el, {
        startAt: { opacity: 0, scale: 1, left: 0, top: 0 },
        opacity: 1,
        scale: 1,
        left: 0,
        top: 0,
        zIndex: currentIndex,
        x: cacheMousePos.x - this.rect.width / 2,
        y: cacheMousePos.y - this.rect.height / 2
      })
      // Smoothly follow the current mouse position (catches up from cached)
      .to(this.el, {
        duration: 0.9,
        ease: CONFIG.moveEase,
        x: pos.x - this.rect.width / 2,
        y: pos.y - this.rect.height / 2
      }, 0)
      // Fade out after a delay
      .to(this.el, {
        duration: CONFIG.fadeDuration,
        ease: 'power1.out',
        opacity: 0,
        scale: CONFIG.scaleDown
      }, CONFIG.fadeDelay);
  };

  // ---------------------------------------------------------------------------
  // Main init
  // ---------------------------------------------------------------------------
  function initImageTrail() {
    // Desktop only
    if (window.innerWidth < CONFIG.mobileBreakpoint) return;

    var container = document.querySelector(CONFIG.containerSelector);
    if (!container) return;

    var content = container.querySelector(CONFIG.contentSelector);
    if (!content) return;

    var imgEls = content.querySelectorAll(CONFIG.imgSelector);
    if (imgEls.length === 0) return;

    // Build image wrappers
    images = [];
    for (var i = 0; i < imgEls.length; i++) {
      images.push(new TrailImage(imgEls[i]));
    }

    // Reset state
    currentIndex = 0;
    isActive = true;

    // Set all images to initial hidden state
    gsap.set(imgEls, { opacity: 0 });

    // ---------------------------------------------------------------------------
    // Mouse tracking — scoped to the container
    // ---------------------------------------------------------------------------
    container.addEventListener('mousemove', function (e) {
      var pos = getMouseRelativePos(e, content);
      mousePos.x = pos.x;
      mousePos.y = pos.y;
    });

    // Reset when mouse leaves the hero
    container.addEventListener('mouseleave', function () {
      // Let existing trails finish their animations naturally
      lastSpawnPos.x = 0;
      lastSpawnPos.y = 0;
    });

    // ---------------------------------------------------------------------------
    // Render loop — checks distance and spawns images
    // ---------------------------------------------------------------------------
    function render() {
      if (!isActive) return;

      // Lerp the cached mouse position toward the real position
      cacheMousePos.x = lerp(cacheMousePos.x || mousePos.x, mousePos.x, CONFIG.lerpSpeed);
      cacheMousePos.y = lerp(cacheMousePos.y || mousePos.y, mousePos.y, CONFIG.lerpSpeed);

      // Check if we've moved far enough to spawn the next image
      var dist = getDistance(mousePos.x, mousePos.y, lastSpawnPos.x, lastSpawnPos.y);

      if (dist >= CONFIG.threshold) {
        // Spawn the current image
        var img = images[currentIndex % images.length];
        img.show(mousePos);

        // Update spawn position and advance index
        lastSpawnPos.x = mousePos.x;
        lastSpawnPos.y = mousePos.y;
        currentIndex++;
      }

      rafId = requestAnimationFrame(render);
    }

    // Start the loop
    rafId = requestAnimationFrame(render);

    // ---------------------------------------------------------------------------
    // Handle resize
    // ---------------------------------------------------------------------------
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        // If we drop below mobile breakpoint, clean up
        if (window.innerWidth < CONFIG.mobileBreakpoint) {
          isActive = false;
          if (rafId) cancelAnimationFrame(rafId);
          gsap.set(imgEls, { clearProps: 'all' });
          return;
        }
        // Recalculate image rects
        for (var i = 0; i < images.length; i++) {
          images[i].resize();
        }
      }, 250);
    });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initImageTrail, 100);
  } else {
    document.addEventListener('DOMContentLoaded', initImageTrail);
  }

  // Webflow compatibility
  if (window.Webflow) {
    window.Webflow.push(function () { setTimeout(initImageTrail, 200); });
  }
})();
