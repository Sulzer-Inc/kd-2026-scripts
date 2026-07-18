// ============================================================================
// 1. HERO SVG PATH ANIMATION
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