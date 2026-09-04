// ============================================================================
// VIDEO & VIMEO AUTOPLAY ON HOVER (DESKTOP) & VIEWPORT AUTOPLAY (MOBILE/TABLET)
// Target class: .vid-autoplay-hover
// Supports: HTML5 <video> elements and Vimeo <iframe> embeds
// ============================================================================
(function () {
  'use strict';

  function isTouchOrSmallScreen() {
    // 1. Screen width check (Tablet and Mobile in Webflow are <= 991px)
    if (window.innerWidth <= 991) return true;
    if (window.matchMedia && window.matchMedia('(max-width: 991px)').matches) return true;

    // 2. If screen width > 991px (Desktop):
    // Desktop devices (Mac Safari, Chrome, Windows) with mouse or trackpad support hover & pointer: fine
    var hasHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    var hasFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

    if (hasHover || hasFinePointer) {
      return false; // Confirmed desktop with mouse/trackpad: require hover
    }

    return true;
  }

  function ensureVimeoSDK(callback) {
    if (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player) {
      if (callback) callback();
      return;
    }
    if (!document.querySelector('script[src*="player.vimeo.com/api/player.js"]')) {
      var script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.onload = function () {
        if (callback) callback();
      };
      document.head.appendChild(script);
    } else {
      var checkInterval = setInterval(function () {
        if (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player) {
          clearInterval(checkInterval);
          if (callback) callback();
        }
      }, 100);
    }
  }

  function getMediaController(container) {
    // 1. Check for HTML5 Video
    var video = container.tagName === 'VIDEO' ? container : container.querySelector('video');
    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');

      return {
        type: 'html5',
        element: video,
        play: function () {
          video.muted = true;
          video.playsInline = true;
          var promise = video.play();
          if (promise !== undefined) {
            promise.catch(function () {});
          }
        },
        pause: function () {
          if (!video.paused) {
            video.pause();
          }
        }
      };
    }

    // 2. Check for Vimeo iframe
    var iframe = container.tagName === 'IFRAME' ? container : container.querySelector('iframe[src*="vimeo.com"], iframe[data-src*="vimeo.com"]');
    if (iframe) {
      // Ensure api=1 parameter is present
      var src = iframe.getAttribute('src') || iframe.getAttribute('data-src') || '';
      if (src && src.indexOf('vimeo.com') !== -1 && src.indexOf('api=1') === -1) {
        var sep = src.indexOf('?') === -1 ? '?' : '&';
        iframe.setAttribute('src', src + sep + 'api=1');
      }

      var vimeoController = {
        type: 'vimeo',
        element: iframe,
        player: null,
        play: function () {
          var self = this;
          if (self.player) {
            self.player.setMuted(true).catch(function () {});
            self.player.play().catch(function () {});
          } else if (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player) {
            try {
              if (!self.element.vimeoPlayerInstance) {
                self.element.vimeoPlayerInstance = new window.Vimeo.Player(self.element);
              }
              self.player = self.element.vimeoPlayerInstance;
              self.player.setMuted(true).catch(function () {});
              self.player.play().catch(function () {});
            } catch (e) {}
          } else {
            ensureVimeoSDK(function () {
              try {
                if (!self.element.vimeoPlayerInstance) {
                  self.element.vimeoPlayerInstance = new window.Vimeo.Player(self.element);
                }
                self.player = self.element.vimeoPlayerInstance;
                self.player.setMuted(true).catch(function () {});
                self.player.play().catch(function () {});
              } catch (e) {}
            });
          }
        },
        pause: function () {
          var self = this;
          if (self.player) {
            self.player.pause().catch(function () {});
          } else if (typeof window.Vimeo !== 'undefined' && window.Vimeo.Player) {
            try {
              if (!self.element.vimeoPlayerInstance) {
                self.element.vimeoPlayerInstance = new window.Vimeo.Player(self.element);
              }
              self.player = self.element.vimeoPlayerInstance;
              self.player.pause().catch(function () {});
            } catch (e) {}
          }
        }
      };

      ensureVimeoSDK(function () {
        try {
          if (!iframe.vimeoPlayerInstance) {
            iframe.vimeoPlayerInstance = new window.Vimeo.Player(iframe);
          }
          vimeoController.player = iframe.vimeoPlayerInstance;
          vimeoController.player.setMuted(true).catch(function () {});
        } catch (e) {}
      });

      return vimeoController;
    }

    return null;
  }

  var observer = null;

  function getObserver() {
    if (!observer && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var target = entry.target;
            var controller = target._mediaController;
            if (!controller) return;

            if (isTouchOrSmallScreen()) {
              // Mobile & Tablet: Autoplay when in viewport, pause when off-screen
              if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                controller.play();
              } else {
                controller.pause();
              }
            } else {
              // Desktop: Pause if scrolled completely out of view
              if (!entry.isIntersecting) {
                controller.pause();
              }
            }
          });
        },
        {
          threshold: [0, 0.25, 0.5, 0.75]
        }
      );
    }
    return observer;
  }

  function initVidAutoplayHover() {
    var containers = document.querySelectorAll('.vid-autoplay-hover, [data-vid-autoplay-hover]');
    if (!containers.length) return;

    var obs = getObserver();

    containers.forEach(function (container) {
      if (container.dataset.vidAutoplayInitialized === 'true' && container._mediaController) return;

      var controller = getMediaController(container);
      if (!controller) return;

      container.dataset.vidAutoplayInitialized = 'true';
      container._mediaController = controller;

      // Ensure video is paused on desktop initially and remove HTML autoplay attribute
      if (controller.element && controller.element.hasAttribute && controller.element.hasAttribute('autoplay')) {
        controller.element.removeAttribute('autoplay');
      }
      if (!isTouchOrSmallScreen()) {
        controller.pause();
      }

      // Desktop: Play on hover, pause on leave
      container.addEventListener('mouseenter', function () {
        if (!isTouchOrSmallScreen() && container._mediaController) {
          container._mediaController.play();
        }
      });

      container.addEventListener('mouseleave', function () {
        if (!isTouchOrSmallScreen() && container._mediaController) {
          container._mediaController.pause();
        }
      });

      // Viewport observation for mobile/tablet & offscreen pausing
      if (obs) {
        obs.observe(container);
      }
    });
  }

  function safeInit() {
    initVidAutoplayHover();
    setTimeout(initVidAutoplayHover, 300);
    setTimeout(initVidAutoplayHover, 1000);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(safeInit, 100);
  } else {
    document.addEventListener('DOMContentLoaded', safeInit);
  }

  if (window.Webflow) {
    window.Webflow.push(function () {
      setTimeout(safeInit, 200);
    });
  }
})();
