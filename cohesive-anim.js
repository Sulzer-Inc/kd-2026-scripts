(function () {
  gsap.registerPlugin(ScrollTrigger);

  function getPillPosition(progress, w, h) {
    var r = h / 2;
    var flatWidth = Math.max(0, w - 2 * r);
    var arcLen = Math.PI * r;
    var perimeter = 2 * flatWidth + 2 * arcLen;
    
    var p = ((progress % 1) + 1) % 1; 
    var d = p * perimeter;
    
    var seg1 = flatWidth / 2;
    if (d <= seg1) return { x: w / 2 + d, y: 0 };
    d -= seg1;
    
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

  function initCohesiveAnimation() {
    var wrapper = document.querySelector('.cohesive-k12__content');
    if (!wrapper) return;

    var items = document.querySelectorAll('.cohesive-k12__item');
    if (items.length === 0) return;

    var proxy = { progress: 0 };
    
    gsap.to(proxy, {
      progress: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.cohesive-k-12', 
        start: 'center center',    // Start animation when section is perfectly centered
        end: '+=1500',             // Pin it for 1500px of scrolling so the rotation is slow and deliberate
        scrub: 1,                  // Smooth scrubbing
        pin: true                  // Pin the section like Lassie.ai does
      },
      onUpdate: function() {
        var w = wrapper.offsetWidth;
        var h = wrapper.offsetHeight;
        
        items.forEach(function(item) {
           var startP = 0;
           if (item.classList.contains('cohesive-k12__item--right')) startP = 0.25;
           else if (item.classList.contains('cohesive-k12__item--bottom')) startP = 0.5;
           else if (item.classList.contains('cohesive-k12__item--left')) startP = 0.75;
           
           var currentP = startP + proxy.progress;
           var pos = getPillPosition(currentP, w, h);
           
           // Calculate 3D scale based on vertical position (0.6 at top, 1.0 at bottom)
           var scale = 0.6 + 0.4 * (pos.y / h);
           
           item.style.left = pos.x + 'px';
           item.style.top = pos.y + 'px';
           item.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
        });
      }
    });
  }

  // Initialize script safely on load
  if (document.readyState === 'complete') {
    initCohesiveAnimation();
    // Force a ScrollTrigger refresh after a short delay to account for other scripts adding pin spacing
    setTimeout(function() { ScrollTrigger.refresh(); }, 500);
  } else {
    window.addEventListener('load', function() {
      initCohesiveAnimation();
      setTimeout(function() { ScrollTrigger.refresh(); }, 500);
    });
  }
})();
