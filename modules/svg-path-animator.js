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
        gsap.set(fades, { 
          fillOpacity: 0,
          scale: 0.5,
          y: 30,
          transformOrigin: '50% 50%' 
        });
      }

      // 3. Read config from data attributes or fallback to defaults
      var startVal = container.getAttribute('data-anim-start') || 'top 75%';
      var repeatVal = container.getAttribute('data-anim-repeat');
      repeatVal = repeatVal !== null ? parseInt(repeatVal, 10) : -1;
      
      var yoyoVal = container.getAttribute('data-anim-yoyo');
      yoyoVal = yoyoVal !== null ? (yoyoVal === 'true') : true;

      var delayVal = container.getAttribute('data-anim-repeat-delay');
      delayVal = delayVal !== null ? parseFloat(delayVal) : 1;

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
        }, 1);
      }
    });
  }

  // Hook up triggers
  document.addEventListener('DOMContentLoaded', initSvgAnimations);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initSvgAnimations, 100);
  }

  // Webflow compatibility
  if (window.Webflow) {
    window.Webflow.push(function () { setTimeout(initSvgAnimations, 200); });
  }
})();
