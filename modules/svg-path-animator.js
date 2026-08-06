// ============================================================================
// REUSABLE SVG PATH & SHAPE ANIMATOR
// ============================================================================
(function () {
  // Ensure GSAP is loaded
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  function initSvgAnimations() {
    var containers = document.querySelectorAll('.svg-animated-bg, [data-svg-anim]');
    
    containers.forEach(function (container) {
      // Prevent double initialization
      if (container.dataset.svgAnimInitialized) return;
      container.dataset.svgAnimInitialized = 'true';

      // Ensure overflow is visible on svg element(s)
      var svgs = container.tagName === 'SVG' ? [container] : container.querySelectorAll('svg');
      svgs.forEach(function (svg) {
        svg.style.overflow = 'visible';
      });

      var traces = container.querySelectorAll('.anim-trace');
      var fades = container.querySelectorAll('.anim-fade');

      if (traces.length === 0 && fades.length === 0) return;

      // 1. Prepare Traces (Draw Line Effect)
      traces.forEach(function (path) {
        var length = path.getTotalLength ? path.getTotalLength() : 1000;
        gsap.set(path, {
          strokeDasharray: length + 10,
          strokeDashoffset: length + 10,
          opacity: 1
        });
      });

      // 2. Prepare Fades (Solid shapes / elements)
      if (fades.length > 0) {
        fades.forEach(function (elem) {
          if (!elem.style.overflow) {
            elem.style.overflow = 'visible';
          }
        });

        gsap.set(fades, { 
          fillOpacity: 0,
          scale: 0.5,
          y: 30,
          transformOrigin: '50% 50%' 
        });
      }

      // 3. Read config from data attributes or fallback to defaults
      // Adjust 'top 75%' below to change viewport trigger height (e.g., 'top 95%' or 'top 100%' for immediate)
      var startVal = container.getAttribute('data-anim-start') || 'top 75%';
      var repeatVal = container.getAttribute('data-anim-repeat');
      repeatVal = repeatVal !== null ? parseInt(repeatVal, 10) : -1;
      
      var yoyoVal = container.getAttribute('data-anim-yoyo');
      yoyoVal = yoyoVal !== null ? (yoyoVal === 'true') : true;

      var delayVal = container.getAttribute('data-anim-repeat-delay');
      delayVal = delayVal !== null ? parseFloat(delayVal) : 0.1;

      var holdVal = container.getAttribute('data-anim-hold-delay');
      var holdDuration = holdVal !== null ? parseFloat(holdVal) : (yoyoVal ? 1.5 : 1);

      // 4. Create Timeline
      var tl = gsap.timeline({
        repeat: repeatVal,
        yoyo: yoyoVal,
        repeatDelay: delayVal,
        scrollTrigger: {
          trigger: container,
          start: startVal
        }
      });

      // Save reference to timeline on the element itself for easy control if needed
      container.svgAnimationTimeline = tl;

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
        }, 1); // Delay offset (seconds): starts 1s after traces. Lower this to make fades start faster.
      }

      // Add hold pause when fully drawn so artwork stays visible before reversing/restarting
      if (holdDuration > 0) {
        tl.to({}, { duration: holdDuration });
      }
    });
  }

  // Hook up triggers
  document.addEventListener('DOMContentLoaded', initSvgAnimations);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // Safety delay to allow elements and GSAP to load before measuring path lengths
    setTimeout(initSvgAnimations, 100);
  }

  // Webflow compatibility
  if (window.Webflow) {
    // Extra buffer to let Webflow DOM elements render fully
    window.Webflow.push(function () { setTimeout(initSvgAnimations, 200); });
  }
})();
