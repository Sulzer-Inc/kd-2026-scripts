// ============================================================================
// HERO 2026 NOINDEX SCROLL HIDE SCRIPT
// ============================================================================
(function () {
  function initHeroNoIndex() {
    var element = document.querySelector('.hero-2026--sticky');
    if (!element) return;

    var isHidden = false;

    function handleScroll() {
      // 100vh is 1 * viewport height
      var vh100 = window.innerHeight;
      var currentScroll = window.pageYOffset || document.documentElement.scrollTop;

      if (currentScroll > vh100) {
        if (!isHidden) {
          element.style.opacity = '0';
          element.style.pointerEvents = 'none';
          isHidden = true;
        }
      } else {
        if (isHidden) {
          element.style.opacity = ''; // Restore original style
          element.style.pointerEvents = ''; // Restore original pointer-events
          isHidden = false;
        }
      }
    }

    // Passive listener for scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Check initial state in case they page-refreshed below 200vh
    handleScroll();
  }

  document.addEventListener('DOMContentLoaded', initHeroNoIndex);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initHeroNoIndex, 100);
  }
})();
