// ============================================================================
// GLOBAL VIMEO PLAYER CONTROLLER
// Handles swapping data-src to src (to prevent Webflow canvas autoplay)
// Handles custom looping via data-start and data-end
// ============================================================================
(function () {
  function initGlobalVimeo() {
    // 1. Swap data-src to src for all Vimeo iframes
    document.querySelectorAll('iframe').forEach(function(iframe) {
      var dataSrc = iframe.getAttribute('data-src');
      var isVimeoData = dataSrc && dataSrc.indexOf('vimeo.com') !== -1;
      
      if (isVimeoData) {
        if (dataSrc.indexOf('api=1') === -1) {
          var separator = dataSrc.indexOf('?') === -1 ? '?' : '&';
          dataSrc += separator + 'api=1';
        }
        iframe.setAttribute('src', dataSrc);
        iframe.removeAttribute('data-src');
      }
    });

    // 2. Load Vimeo SDK if needed, then setup players
    if (typeof window.Vimeo === 'undefined') {
      if (!document.querySelector('script[src*="player.vimeo.com/api/player.js"]')) {
        var script = document.createElement('script');
        script.src = 'https://player.vimeo.com/api/player.js';
        script.onload = setupPlayers;
        document.head.appendChild(script);
      } else {
        setTimeout(initGlobalVimeo, 200);
      }
      return;
    }
    setupPlayers();
  }

  function setupPlayers() {
    document.querySelectorAll('iframe[src*="vimeo.com"]').forEach(function(iframe) {
      // Skip if this iframe is controlled by the orbit rotator (which handles its own play/pause logic)
      if (iframe.closest('.rotator-video__container')) return;

      var startAttr = iframe.getAttribute('data-start') || (iframe.parentElement && iframe.parentElement.getAttribute('data-start'));
      var endAttr = iframe.getAttribute('data-end') || (iframe.parentElement && iframe.parentElement.getAttribute('data-end'));

      if (startAttr || endAttr) {
        var player = new window.Vimeo.Player(iframe);
        var startTime = startAttr ? parseFloat(startAttr) : 0;
        var endTime = endAttr ? parseFloat(endAttr) : Infinity;

        player.on('loaded', function () {
          player.setCurrentTime(startTime).then(function() {
            // Autoplay only if the src asks for it (background=1 or autoplay=1)
            var src = iframe.getAttribute('src') || '';
            if (src.indexOf('autoplay=1') !== -1 || src.indexOf('background=1') !== -1) {
              player.play().catch(function(){});
            }
          }).catch(function(){});
        });

        player.on('timeupdate', function (data) {
          if (data.seconds >= endTime || data.seconds < startTime) {
            player.setCurrentTime(startTime).catch(function(){});
          }
        });
      }
    });
  }

  // Run as early as possible so src is populated before other scripts (like sliders) look for them
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalVimeo);
  } else {
    initGlobalVimeo();
  }
})();
