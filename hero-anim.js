(function () {
  gsap.registerPlugin(ScrollTrigger);

  function initHeroSVG() {
    var svgWrap = document.querySelector('.hero-2026--animated-bg');
    if (!svgWrap) return;

    var traces = svgWrap.querySelectorAll('.anim-trace');
    var fades = svgWrap.querySelectorAll('.anim-fade');

    // 1. Prepare Traces (Draw Line Effect)
    // We must manually set stroke-dasharray and stroke-dashoffset to the path length
    traces.forEach(function (path) {
      var length = path.getTotalLength ? path.getTotalLength() : 1000;
      // Some paths have both fill and stroke. We hide the fill initially if it has anim-fade
      gsap.set(path, {
        strokeDasharray: length + 10, // Add padding to avoid anti-aliasing gaps
        strokeDashoffset: length + 10,
        opacity: 1 // Ensure the stroke is visible
      });
    });

    // 2. Prepare Fades (Solid shapes)
    // Hide all fill elements and apply initial scale/translation for a modern pop-in effect
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
      repeat: -1, // Infinite loop
      yoyo: true, // Smoothly reverse the animation (erase lines, fade out shapes)
      repeatDelay: 1, // Pause for 1 second when fully drawn before reversing
      scrollTrigger: {
        trigger: svgWrap,
        start: 'top 75%' // Start animating when the hero is 25% down the screen (or immediately if at top)
      }
    });

    // Animate lines drawing in randomly/staggered
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

    // Animate fills popping in with a modern elastic/float effect
    if (fades.length > 0) {
      tl.to(fades, {
        fillOpacity: 1,
        scale: 1,
        y: 0,
        duration: 2.5,
        ease: 'elastic.out(1, 0.6)', // Modern bouncy feel
        stagger: {
          amount: 1.2,
          from: 'random'
        }
      }, 1); // Start fading in at the 1 second mark of the timeline
    }
  }

  // Run on load and if DOM changes
  document.addEventListener('DOMContentLoaded', initHeroSVG);
  
  // Since Webflow sometimes loads scripts asynchronously, run it directly as well
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initHeroSVG, 100);
  }
})();
