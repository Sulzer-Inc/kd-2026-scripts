// ============================================================================
// 5. VIMEO VIDEO ON SLIDER CONTROLLER
// ============================================================================
(function () {
  var videoPlaying = false;
  var origSetTimeout = window.setTimeout;
  var patched = false;

  function patchSetTimeout() {
    if (patched) return;
    patched = true;
    window.setTimeout = function (fn, delay) {
      // Block long timers (slider autoplay uses the slider's data-delay, 5000ms here)
      if (videoPlaying && delay && delay >= 4000) return 0;
      return origSetTimeout.apply(this, arguments);
    };
  }

  function pauseSlider(slider) {
    videoPlaying = true;
    patchSetTimeout();
    try { Webflow.require('slider').pause(); } catch (e) {}
  }

  function resumeSlider(slider) {
    videoPlaying = false;
    try { Webflow.require('slider').play(); } catch (e) {}
  }

  function initPlayers() {
    if (typeof Vimeo === 'undefined') {
      // If Vimeo Player SDK isn't loaded, load it dynamically
      if (!document.querySelector('script[src*="player.vimeo.com/api/player.js"]')) {
        var script = document.createElement('script');
        script.src = 'https://player.vimeo.com/api/player.js';
        script.onload = setupVimeoPlayers;
        document.head.appendChild(script);
      } else {
        setTimeout(initPlayers, 200);
      }
      return;
    }
    setupVimeoPlayers();
  }

  function setupVimeoPlayers() {
    var players = [];

    document.querySelectorAll('iframe[src*="player.vimeo.com"]').forEach(function (iframe) {
      var slide  = iframe.closest('.w-slide, .swiper-slide');
      var slider = slide && slide.closest('.w-slider, .swiper');
      if (!slider) return;

      var player = new Vimeo.Player(iframe);
      players.push({
        player: player,
        slide: slide
      });

      player.on('play',  function () { pauseSlider(slider); });
      player.on('ended', function () { resumeSlider(slider); });
      // NOTE: do NOT resume on 'pause' — user might manually pause and want it to stay paused
    });

    if (players.length > 0) {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'aria-hidden') {
            var slide = mutation.target;
            if (slide.getAttribute('aria-hidden') === 'true') {
              players.forEach(function (item) {
                if (item.slide === slide) {
                  try { item.player.pause(); } catch (e) {}
                }
              });
            }
          }
        });
      });

      players.forEach(function (item) {
        observer.observe(item.slide, {
          attributes: true,
          attributeFilter: ['aria-hidden']
        });
      });
    }
  }

  window.addEventListener('load', initPlayers);
})();