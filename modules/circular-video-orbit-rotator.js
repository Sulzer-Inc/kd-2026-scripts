// ============================================================================
// 4. CIRCULAR VIDEO ORBIT ROTATOR
// ============================================================================
(function () {
  gsap.registerPlugin(ScrollTrigger);

  var CONFIG = {
    mobileBreakpoint: 0,
    basePinDistancePerStep: 500, // scroll px per item transition
    minPinDistance: 1200,        // minimum scroll pin distance
    spacingMode: 'quarter',      // 'quarter' (90 deg) or 'dynamic' (360 / N)
    startOffset: 0.25            // fraction of pin scroll to idle before rotation begins (0–1)
  };

  var state = {
    tl: null,
    items: [],
    activeIdx: 0,
    playersReady: {},
    players: {}
  };

  function getItemLogicalIndex(item, defaultIdx) {
    var match = item.className.match(/vid-(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10) - 1;
    }
    return defaultIdx;
  }

  function initRotatorAnimation() {
    var section = document.querySelector('.inside-every-lesson');
    if (!section) return;

    var container = section.querySelector('.rotator-video');
    if (!container) return;

    if (state.tl) {
      if (state.tl.scrollTrigger) state.tl.scrollTrigger.kill(true);
      state.tl.kill();
      state.tl = null;
    }

    // Reset items inline styles on resizing or re-init
    state.items = Array.prototype.slice.call(container.querySelectorAll('.rotator-video__item'));
    if (state.items.length === 0) return;

    state.items.forEach(function (item) {
      gsap.set(item, { clearProps: 'all' });
      var cover = item.tagName === 'IMG' ? item : item.querySelector('img');
      if (cover) gsap.set(cover, { clearProps: 'all' });
      var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
      if (iframe) gsap.set(iframe, { clearProps: 'opacity' });
    });

    if (window.innerWidth < CONFIG.mobileBreakpoint) {
      state.items.forEach(function (item) {
        var cover = item.tagName === 'IMG' ? item : item.querySelector('img');
        if (cover) cover.style.opacity = '1';
        var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
        if (iframe) iframe.style.opacity = '0';
      });
      return;
    }

    var N = state.items.length;
    var spacing = (CONFIG.spacingMode === 'quarter') ? (Math.PI / 2) : (2 * Math.PI / N);

    // Calculate starting angles dynamically based on logical index
    state.items.forEach(function (item, idx) {
      item.style.position = 'absolute';
      item.style.maxWidth = 'none'; // clear CSS max-width limits to allow dynamic sizing

      var logicalIdx = getItemLogicalIndex(item, idx);
      item.logicalIndex = logicalIdx;
      item.startAngle = -logicalIdx * spacing;

      // Auto-append api=1 to Vimeo iframes to enable postMessage API controls
      var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
      if (iframe) {
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.borderRadius = '8px';
        
        var embed = item.querySelector('.w-embed');
        if (embed) {
          embed.style.position = 'absolute';
          embed.style.top = '0';
          embed.style.left = '0';
          embed.style.width = '100%';
          embed.style.height = '100%';
        }
        
        if (iframe.src && iframe.src.indexOf('vimeo.com') !== -1 && iframe.src.indexOf('api=1') === -1) {
          var separator = iframe.src.indexOf('?') === -1 ? '?' : '&';
          iframe.src = iframe.src + separator + 'api=1';
        }
      }
    });

    var totalSteps = Math.max(1, N - 1);
    var rotationSpan = totalSteps * spacing;

    // Reset starting positions
    state.items.forEach(function (item) {
      var theta = item.startAngle; // at progress = 0, phi = 0
      item.style.left = (50 + 50 * Math.cos(theta)) + '%';
      item.style.top = (50 + 50 * Math.sin(theta)) + '%';
      
      var normalizedTheta = theta % (2 * Math.PI);
      if (normalizedTheta > Math.PI) normalizedTheta -= 2 * Math.PI;
      if (normalizedTheta < -Math.PI) normalizedTheta += 2 * Math.PI;
      var dist = Math.abs(normalizedTheta);

      var isCurrentActive = dist < 0.01;
      var width = isCurrentActive ? 90 : 50;
      item.style.width = width + '%';
      item.style.aspectRatio = '16/9';
      item.style.transform = 'translate(-60%, -50%)';
      item.style.zIndex = isCurrentActive ? '100' : '10';

      var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
      var cover = item.tagName === 'IMG' ? item : item.querySelector('img');
      if (iframe) iframe.style.opacity = isCurrentActive ? '1' : '0';
      if (cover) cover.style.opacity = isCurrentActive ? '0' : '1';
    });

    var textItems = Array.prototype.slice.call(section.querySelectorAll('.rotator-video__txt'));
    var txtWrapper = null;

    if (textItems.length > 0) {
      var firstTxt = textItems[0];
      var parent = firstTxt.parentNode;
      
      txtWrapper = document.createElement('div');
      txtWrapper.className = 'rotator-video__txt-wrapper';
      txtWrapper.style.display = 'grid';
      txtWrapper.style.gridTemplateColumns = '1fr';
      
      parent.insertBefore(txtWrapper, firstTxt);
      
      textItems.forEach(function (txt) {
        txtWrapper.appendChild(txt);
        txt.style.gridArea = '1 / 1';
      });
    }

    function updateActiveText(activeIndex) {
      var activeItem = state.items[activeIndex];
      var logicalIdx = activeItem ? (activeItem.logicalIndex !== undefined ? activeItem.logicalIndex : activeIndex) : activeIndex;

      textItems.forEach(function (txt, idx) {
        if (txt.transitionTimeout) {
          clearTimeout(txt.transitionTimeout);
          txt.transitionTimeout = null;
        }

        if (idx === logicalIdx) {
          txt.style.display = 'block';
          var reflow = txt.offsetHeight;
          txt.classList.add('rotator-video__txt--active');
        } else {
          var wasActive = txt.classList.contains('rotator-video__txt--active');
          txt.classList.remove('rotator-video__txt--active');

          if (wasActive) {
            txt.transitionTimeout = setTimeout(function () {
              txt.style.display = 'none';
            }, 300);
          } else {
            txt.style.display = 'none';
          }
        }
      });
    }

    // Set starting active text
    updateActiveText(0);

    var proxy = { progress: 0 };
    state.activeIdx = 0;

    var calculatedPinDistance = '+=' + Math.max(CONFIG.minPinDistance, totalSteps * CONFIG.basePinDistancePerStep);

    // Build explicit snap points that account for the startOffset idle zone.
    // Item 0 snaps at progress 0; each subsequent item snaps proportionally within [startOffset, 1].
    var snapPoints = [0];
    for (var si = 1; si <= totalSteps; si++) {
      snapPoints.push(CONFIG.startOffset + (si / totalSteps) * (1 - CONFIG.startOffset));
    }

    state.tl = gsap.to(proxy, {
      progress: 1.0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'center center+=130px',
        end: calculatedPinDistance,
        pin: true,
        scrub: 0.1,
        snap: {
          snapTo: snapPoints,
          duration: { min: 0.2, max: 0.5 },
          ease: 'power1.inOut'
        },
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          // Idle for the first startOffset fraction, then rotate through the remainder
          var rotateProgress = Math.max(0, (self.progress - CONFIG.startOffset) / (1 - CONFIG.startOffset));
          var phi = rotateProgress * rotationSpan;
          var closestIdx = -1;
          var minCoverDist = Infinity;

          state.items.forEach(function (item, idx) {
            var theta = item.startAngle + phi;

            // Position center on the circle
            item.style.left = (50 + 50 * Math.cos(theta)) + '%';
            item.style.top = (50 + 50 * Math.sin(theta)) + '%';

            // Distance to active position (0 rad)
            var normalizedTheta = theta % (2 * Math.PI);
            if (normalizedTheta > Math.PI) normalizedTheta -= 2 * Math.PI;
            if (normalizedTheta < -Math.PI) normalizedTheta += 2 * Math.PI;

            var dist = Math.abs(normalizedTheta);
            var limit = spacing;
            var t = Math.max(0, 1 - dist / limit);

            // Interpolate width smoothly from 50% to 90%
            var width = 50 + 40 * t;
            item.style.width = width.toFixed(3) + '%';
            item.style.aspectRatio = '16/9';
            item.style.transform = 'translate(-60%, -50%)';
            item.style.zIndex = Math.round(10 + 90 * t);

            // Fade cover and iframe
            var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
            var cover = item.tagName === 'IMG' ? item : item.querySelector('img');
            if (iframe) iframe.style.opacity = t.toFixed(3);
            if (cover) cover.style.opacity = (1 - t).toFixed(3);

            if (dist < minCoverDist) {
              minCoverDist = dist;
              closestIdx = idx;
            }
          });

          if (closestIdx !== -1 && closestIdx !== state.activeIdx) {
            state.activeIdx = closestIdx;
            controlVideos();
            updateActiveText(closestIdx);
          }
        }
      }
    });
  }

  function initVimeoPlayers() {
    if (!window.Vimeo || !window.Vimeo.Player) {
      setTimeout(initVimeoPlayers, 100);
      return;
    }

    state.items.forEach(function (item, idx) {
      var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
      if (!iframe) return;

      if (state.players[idx]) return;

      var player = new Vimeo.Player(iframe);
      state.players[idx] = player;

      var startAttr = item.getAttribute('data-start') || iframe.getAttribute('data-start');
      var endAttr = item.getAttribute('data-end') || iframe.getAttribute('data-end');

      var startTime = null;
      var endTime = null;

      if (startAttr && endAttr) {
        startTime = parseFloat(startAttr);
        endTime = parseFloat(endAttr);
      }

      if (startTime !== null && endTime !== null) {
        player.on('loaded', function () {
          player.setCurrentTime(startTime).then(function () {
            // Force play if this video is the active one
            if (idx === state.activeIdx) {
              player.play().catch(function () {});
            }
          }).catch(function () {});
        });

        player.on('timeupdate', function (data) {
          if (data.seconds >= endTime || data.seconds < startTime) {
            player.setCurrentTime(startTime).then(function () {
              if (idx === state.activeIdx) {
                player.play().catch(function () {});
              }
            }).catch(function () {});
          }
        });
      }

      var isCurrentActive = (idx === state.activeIdx);
      if (isCurrentActive) {
        player.play().catch(function () {});
      } else {
        player.pause().catch(function () {});
      }
    });
  }

  function controlVideos() {
    state.items.forEach(function (item, idx) {
      var player = state.players[idx];
      var isCurrentActive = (idx === state.activeIdx);

      if (player) {
        if (isCurrentActive) {
          player.play().catch(function () {});
        } else {
          player.pause().catch(function () {});
        }
      } else {
        var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
        if (!iframe || !iframe.contentWindow) return;

        if (state.playersReady[idx]) {
          var action = isCurrentActive ? 'play' : 'pause';
          iframe.contentWindow.postMessage(JSON.stringify({ method: action }), '*');
        }
      }
    });
  }

  window.addEventListener('message', function (event) {
    if (event.origin && event.origin.indexOf('vimeo.com') !== -1) {
      try {
        var data = JSON.parse(event.data);
        if (data.event === 'ready') {
          state.items.forEach(function (item, idx) {
            var iframe = item.tagName === 'IFRAME' ? item : item.querySelector('iframe');
            if (iframe && iframe.contentWindow === event.source) {
              state.playersReady[idx] = true;
              if (!state.players[idx]) {
                if (idx === state.activeIdx) {
                  iframe.contentWindow.postMessage(JSON.stringify({ method: 'play' }), '*');
                } else {
                  iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
                }
              }
            }
          });
        }
      } catch (e) {}
    }
  });

  function startWhenReady() {
    var section = document.querySelector('.inside-every-lesson');
    if (!section) return;

    initRotatorAnimation();
    initVimeoPlayers();
    ScrollTrigger.refresh();
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(startWhenReady, 100);
  } else {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(startWhenReady, 250);
  });

  if (window.Webflow) {
    window.Webflow.push(function () { setTimeout(startWhenReady, 200); });
  }
})();
