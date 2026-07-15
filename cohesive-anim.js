(function () {
  gsap.registerPlugin(ScrollTrigger);

  function initCohesiveAnimation() {
    var wrapper = document.querySelector('.cohesive-k12__content');
    if (!wrapper) return;

    var items = document.querySelectorAll('.cohesive-k12__item');
    var heading = document.querySelector('.cohesive-k12__heading');
    
    // We want to counter-rotate both the items and the center text so they stay completely upright
    var elementsToCounterRotate = Array.from(items);
    if (heading) {
      elementsToCounterRotate.push(heading);
    }

    // Ensure they have a center transform origin for clean rotation
    gsap.set([wrapper, ...elementsToCounterRotate], {
      transformOrigin: 'center center'
    });

    // Create a timeline linked to the scroll of the entire Cohesive K-12 section
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.Cohesive-K-12', // Class of the section (Wait, Webflow class 'Cohesive K-12' becomes 'cohesive-k-12' in CSS. Let's use the wrapper itself as trigger to be safe)
        trigger: wrapper,
        start: 'top bottom', // Start when the wrapper enters the bottom of the screen
        end: 'bottom top',   // End when the wrapper leaves the top of the screen
        scrub: 1             // Smooth scrubbing (1 second catch-up time)
      }
    });

    // 1. Rotate the entire wheel (wrapper)
    tl.to(wrapper, {
      rotation: 360,
      ease: 'none'
    }, 0); // Start at 0 on the timeline

    // 2. Counter-rotate the "carts" (items and heading) at the exact same time
    if (elementsToCounterRotate.length > 0) {
      tl.to(elementsToCounterRotate, {
        rotation: -360,
        ease: 'none'
      }, 0); // Start at 0 on the timeline to keep it perfectly synced
    }
  }

  // Run on load
  document.addEventListener('DOMContentLoaded', initCohesiveAnimation);
  
  // Also run directly if already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initCohesiveAnimation, 100);
  }
})();
