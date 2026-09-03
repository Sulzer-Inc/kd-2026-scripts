// ============================================================================
// REUSABLE SVG PATH & SHAPE ANIMATOR
// ============================================================================
(function () {
  // Inject global overflow fix so inline SVG styles don't cut off glowing strokes
  if (typeof document !== 'undefined' && !document.getElementById('svg-animator-global-styles')) {
    var styleEl = document.createElement('style');
    styleEl.id = 'svg-animator-global-styles';
    styleEl.textContent = '.svg-animated-bg, .svg-animated-bg svg, [data-svg-anim], [data-svg-anim] svg, svg[data-svg-anim], [class*="svg-anim"], .hero-animated-svg { overflow: visible !important; } .svg-animated-bg svg, [data-svg-anim] svg, svg[data-svg-anim] { display: block !important; }';
    (document.head || document.documentElement).appendChild(styleEl);
  }

  function getGsap() {
    if (typeof gsap !== 'undefined') {
      if (typeof ScrollTrigger !== 'undefined' && gsap.registerPlugin) {
        gsap.registerPlugin(ScrollTrigger);
      }
      return gsap;
    }
    return null;
  }

  function initSvgAnimations() {
    var _gsap = getGsap();
    if (!_gsap) return;

    var containers = document.querySelectorAll('.svg-animated-bg, [data-svg-anim], svg[data-svg-anim], [class*="svg-anim"], .svg-anim');

    containers.forEach(function (container) {
      // Force overflow visible on SVG elements so strokes/glows aren't clipped
      var svgs = container.tagName === 'SVG' ? [container] : container.querySelectorAll('svg');
      svgs.forEach(function (svg) {
        svg.style.setProperty('overflow', 'visible', 'important');
      });

      if (container.dataset.svgAnimInitialized === 'true' && container.svgAnimationTimeline) return;
      container.dataset.svgAnimInitialized = 'true';

      var traces = Array.prototype.slice.call(container.querySelectorAll('.anim-trace'));
      var fades = Array.prototype.slice.call(container.querySelectorAll('.anim-fade'));
      var gradients = Array.prototype.slice.call(container.querySelectorAll('.anim-gradient, [data-anim-gradient]'));

      // Always auto-detect paths with gradient fills if not explicitly tagged with .anim-gradient
      if (gradients.length === 0) {
        var allPathsWithGrad = container.querySelectorAll('path, polyline, line, rect, circle, polygon');
        allPathsWithGrad.forEach(function (el) {
          var fillAttr = el.getAttribute('fill') || '';
          var styleAttr = el.getAttribute('style') || '';
          var style = window.getComputedStyle(el);
          var compFill = style.fill || '';
          if (fillAttr.indexOf('url(') !== -1 || styleAttr.indexOf('url(') !== -1 || compFill.indexOf('url(') !== -1) {
            gradients.push(el);
          }
        });
      }

      // Smart Auto-Tagging Fallback if explicit .anim-trace / .anim-fade / .anim-gradient classes are omitted in Webflow
      if (traces.length === 0 && fades.length === 0 && gradients.length === 0) {
        var allPaths = container.querySelectorAll('path, polyline, line, rect, circle, polygon');
        allPaths.forEach(function (el) {
          var strokeAttr = el.getAttribute('stroke');
          var fillAttr = el.getAttribute('fill');
          var style = window.getComputedStyle(el);
          var styleAttr = el.getAttribute('style') || '';
          var hasStroke = (strokeAttr && strokeAttr !== 'none') || (style.stroke && style.stroke !== 'none' && style.stroke !== 'rgba(0, 0, 0, 0)');
          var hasFill = (fillAttr && fillAttr !== 'none') || (style.fill && style.fill !== 'none');
          var isGradient = (fillAttr && fillAttr.indexOf('url(') !== -1) || (style.fill && style.fill.indexOf('url(') !== -1) || (styleAttr.indexOf('url(') !== -1);

          var tag = el.tagName.toLowerCase();
          if (hasStroke || tag === 'path' || tag === 'polyline' || tag === 'line') {
            traces.push(el);
            // Ensure stroke color exists if missing
            if (!strokeAttr && (style.stroke === 'none' || !style.stroke)) {
              el.setAttribute('stroke', 'currentColor');
            }
            if (!el.getAttribute('stroke-width') && (style.strokeWidth === '0px' || !style.strokeWidth)) {
              el.setAttribute('stroke-width', '2');
            }
          }

          if (isGradient) {
            gradients.push(el);
          } else if (hasFill) {
            fades.push(el);
          }
        });
      }

      if (traces.length === 0 && fades.length === 0 && gradients.length === 0) return;

      // 1. Prepare Traces (Draw Line Effect)
      traces.forEach(function (path) {
        var length = 1000;
        try {
          if (path.getTotalLength && typeof path.getTotalLength === 'function') {
            var l = path.getTotalLength();
            if (l > 0) length = l;
          }
        } catch (e) {
          length = 1000;
        }

        _gsap.set(path, {
          strokeDasharray: (length + 10) + ' ' + (length + 10),
          strokeDashoffset: length + 10,
          opacity: 1
        });
      });

      // 2. Prepare Fades (Solid shapes)
      if (fades.length > 0) {
        fades.forEach(function (elem) {
          if (!elem.style.overflow) {
            elem.style.overflow = 'visible';
          }
        });

        _gsap.set(fades, { 
          fillOpacity: 0,
          scale: 0.5,
          y: 30,
          transformOrigin: '50% 50%' 
        });
      }

      // 3. Prepare Gradients (Fade in/out only - no scaling or movement)
      if (gradients.length > 0) {
        _gsap.set(gradients, { 
          fillOpacity: 0 
        });
      }

      // 4. Continuous Rotating Gradient (Never stops, spins 360 degrees smoothly around shape center)
      var linearGradients = Array.prototype.slice.call(container.querySelectorAll('linearGradient'));
      if (linearGradients.length > 0 && (gradients.length > 0 || container.querySelector('[style*="url"], [fill*="url"]'))) {
        linearGradients.forEach(function (grad, idx) {
          if (grad.dataset.gradientRotationInitialized === 'true') return;
          grad.dataset.gradientRotationInitialized = 'true';

          var gradId = grad.id;
          var userEl = container.querySelector('[fill*="' + gradId + '"], [style*="' + gradId + '"]');
          var cx = 350, cy = 150;
          if (userEl) {
            try {
              var bbox = userEl.getBBox();
              cx = bbox.x + bbox.width / 2;
              cy = bbox.y + bbox.height / 2;
            } catch (e) {}
          }

          if (!grad.dataset.origMatrix) {
            grad.dataset.origMatrix = grad.getAttribute('gradientTransform') || '';
          }
          var origMatrix = grad.dataset.origMatrix;

          var rotObj = { angle: 0 };
          var duration = 9 + (idx * 2); // smooth, elegant continuous rotation speed
          var dir = (idx % 2 === 0) ? 1 : -1; // alternating clockwise & counter-clockwise

          _gsap.to(rotObj, {
            angle: 360 * dir,
            duration: duration,
            repeat: -1,
            ease: 'none',
            onUpdate: function () {
              grad.setAttribute('gradientTransform', 'rotate(' + rotObj.angle + ', ' + cx + ', ' + cy + ') ' + origMatrix);
            }
          });
        });
      }

      // 5. Read config from data attributes or fallback to defaults
      var startVal = container.getAttribute('data-anim-start') || 'top 85%';
      var repeatVal = container.getAttribute('data-anim-repeat');
      repeatVal = repeatVal !== null ? parseInt(repeatVal, 10) : -1;
      
      var yoyoVal = container.getAttribute('data-anim-yoyo');
      yoyoVal = yoyoVal !== null ? (yoyoVal === 'true') : true;

      var delayVal = container.getAttribute('data-anim-repeat-delay');
      delayVal = delayVal !== null ? parseFloat(delayVal) : 0.1;

      var holdVal = container.getAttribute('data-anim-hold-delay');
      var holdDuration = holdVal !== null ? parseFloat(holdVal) : (yoyoVal ? 1.5 : 1);

      // 6. Create Main Timeline & ScrollTrigger
      var stConfig = typeof ScrollTrigger !== 'undefined' ? {
        trigger: container,
        start: startVal,
        onEnter: function () {
          // Recalculate path lengths if element was hidden during initial setup
          traces.forEach(function (path) {
            try {
              if (path.getTotalLength) {
                var l = path.getTotalLength();
                if (l > 0 && Math.abs(l - 1000) > 100) {
                  _gsap.set(path, {
                    strokeDasharray: (l + 10) + ' ' + (l + 10)
                  });
                }
              }
            } catch (e) {}
          });
        }
      } : null;

      var tl = _gsap.timeline({
        repeat: repeatVal,
        yoyo: yoyoVal,
        repeatDelay: delayVal,
        scrollTrigger: stConfig
      });

      container.svgAnimationTimeline = tl;

      // Traces draw in
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

      // Solid color fades
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

      // Gradient elements fade in and out at the same time as trace/fade
      if (gradients.length > 0) {
        tl.to(gradients, {
          fillOpacity: 1,
          duration: 2,
          ease: 'power2.inOut',
          stagger: {
            amount: 0.8,
            from: 'random'
          }
        }, 0);
      }

      if (holdDuration > 0) {
        tl.to({}, { duration: holdDuration });
      }
    });
  }

  // Hook up triggers with safety retries
  function safeInit() {
    initSvgAnimations();
    setTimeout(initSvgAnimations, 300);
    setTimeout(initSvgAnimations, 1000);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(safeInit, 100);
  } else {
    document.addEventListener('DOMContentLoaded', safeInit);
  }

  if (window.Webflow) {
    window.Webflow.push(function () { setTimeout(safeInit, 200); });
  }
})();
