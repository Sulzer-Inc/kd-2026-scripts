(function () {
  gsap.registerPlugin(ScrollTrigger);

  function initCohesiveAnimation() {
    var wrapper = document.querySelector('.cohesive-k12__content');
    if (!wrapper) return;

    var items = document.querySelectorAll('.cohesive-k12__item');
    if (items.length === 0) return;

    var proxy = { angle: 0 };
    
    gsap.to(proxy, {
      angle: 360,
      ease: 'none',
      scrollTrigger: {
        trigger: '.cohesive-k-12', // Target the section wrapper to avoid recalculation bugs
        start: 'top center',       // Start animation when section hits middle of screen
        end: 'bottom center',      // End when it leaves
        scrub: 1                   // Smooth scrubbing
      },
      onUpdate: function() {
        var w = wrapper.offsetWidth;
        var h = wrapper.offsetHeight;
        
        // Ellipse center
        var cx = w / 2;
        var cy = h / 2;
        
        // Ellipse radii
        var a = w / 2;
        var b = h / 2;
        
        // Convert proxy angle to radians
        var rad = proxy.angle * (Math.PI / 180);
        
        items.forEach(function(item) {
           // 1. Calculate the initial angle of this specific item based on its Webflow CSS
           if (!item.dataset.startAngle) {
              var initialLeft = parseFloat(getComputedStyle(item).left) || 0;
              var initialTop = parseFloat(getComputedStyle(item).top) || 0;
              // Find the angle (theta) from the center
              var theta = Math.atan2((initialTop - cy) / b, (initialLeft - cx) / a);
              item.dataset.startAngle = theta;
           }
           
           var startTheta = parseFloat(item.dataset.startAngle);
           var currentTheta = startTheta + rad;
           
           // 2. Calculate new position along the perimeter of the ellipse
           var newLeft = cx + a * Math.cos(currentTheta);
           var newTop = cy + b * Math.sin(currentTheta);
           
           // 3. Apply position (keeping Webflow's translate(-50%, -50%) intact for centering)
           item.style.left = newLeft + 'px';
           item.style.top = newTop + 'px';
        });
      }
    });
  }

  // Run on load
  document.addEventListener('DOMContentLoaded', initCohesiveAnimation);
  
  // Also run directly if already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initCohesiveAnimation, 100);
  }
})();
