// =============================================================================
// Splide Columns Slider Module
// =============================================================================

import Splide from '@splidejs/splide';

function initColsSliders() {
    const sliders = document.querySelectorAll('.splide-cols-slider, .splide-impact-slider, .splide--cols, .real-impact__slider');
    if (!sliders.length) return;

    sliders.forEach(slider => {
        if (slider.dataset.splideInitialized === 'true') return;
        slider.dataset.splideInitialized = 'true';

        slider.setAttribute('data-scroll-ignore', 'true');

        // Helper to force visibility on slides and clones
        const forceSlideVisibility = () => {
            slider.querySelectorAll('.splide__slide, .splide__slide--clone, .splide-cols-slider__item, .splide-impact-slider__item, .real-impact__slider-item').forEach(el => {
                el.style.opacity = '1';
                el.style.visibility = 'visible';
            });
        };

        // 1. Gather all slide items
        const slides = slider.querySelectorAll('.splide-cols-slider__item, .splide-impact-slider__item, .real-impact__slider-item, .splide__slide');
        if (!slides.length) return;

        // Force slide visibility and set draggable="false" on all <a> slide elements and child <img> tags
        forceSlideVisibility();
        slider.querySelectorAll('a, img').forEach(el => {
            el.setAttribute('draggable', 'false');
        });
        slides.forEach(slide => {
            slide.style.opacity = '1';
            slide.style.visibility = 'visible';
            if (slide.tagName === 'A') {
                slide.setAttribute('draggable', 'false');
            }
            slide.querySelectorAll('a, img').forEach(el => {
                el.setAttribute('draggable', 'false');
            });
        });

        // 2. Ensure Splide class on root
        slider.classList.add('splide');

        // 3. Find or construct .splide__track and .splide__list
        let track = slider.querySelector('.splide__track');
        let list = slider.querySelector('.splide__list, .splide-cols-slider__container, .splide-impact-slider__container, .real-impact__slider-container');

        if (!track || !list) {
            track = document.createElement('div');
            track.classList.add('splide__track');

            list = document.createElement('div');
            list.classList.add('splide__list');

            // Move each slide into the list
            slides.forEach(slide => {
                slide.classList.add('splide__slide');
                list.appendChild(slide);
            });

            track.appendChild(list);
            slider.appendChild(track);
        } else {
            list.classList.add('splide__list');
            slides.forEach(slide => slide.classList.add('splide__slide'));
        }

        const hasNoArrows = slider.classList.contains('no-arrows');

        // 4. Initialize Splide instance
        const splide = new Splide(slider, {
            type: 'loop',
            perPage: 3,
            perMove: 1,
            autoplay: false,
            arrows: !hasNoArrows,
            pagination: false,
            gap: '1.5rem',
            speed: 500,
            drag: true,
            snap: true,
            waitForTransition: false,
            flickPower: 600,
            flickMaxPages: 1,
            dragMinThreshold: { mouse: 4, touch: 4 },
            breakpoints: {
                991: {
                    perPage: 2,
                    gap: '1.25rem',
                    pagination: true,
                },
                767: {
                    perPage: 1,
                    gap: '1rem',
                    pagination: true,
                }
            }
        });

        // Robust swipe-vs-click drag prevention
        let startX = 0;
        let startY = 0;
        let hasMoved = false;
        let preventClickUntil = 0;
        let isCurrentlyMoving = false;
        const MOVE_THRESHOLD = 4;

        // Pointer/touch delta tracking
        slider.addEventListener('pointerdown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            hasMoved = false;
        }, { passive: true });

        slider.addEventListener('pointermove', (e) => {
            if (startX !== 0 || startY !== 0) {
                const dx = Math.abs(e.clientX - startX);
                const dy = Math.abs(e.clientY - startY);
                if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
                    hasMoved = true;
                    preventClickUntil = Date.now() + 500;
                }
            }
        }, { passive: true });

        slider.addEventListener('pointerup', () => {
            startX = 0;
            startY = 0;
        }, { passive: true });

        slider.addEventListener('pointercancel', () => {
            startX = 0;
            startY = 0;
        }, { passive: true });

        slider.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                hasMoved = false;
            }
        }, { passive: true });

        slider.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length > 0) {
                const dx = Math.abs(e.touches[0].clientX - startX);
                const dy = Math.abs(e.touches[0].clientY - startY);
                if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
                    hasMoved = true;
                    preventClickUntil = Date.now() + 500;
                }
            }
        }, { passive: true });

        slider.addEventListener('touchend', () => {
            startX = 0;
            startY = 0;
        }, { passive: true });

        // Splide event tracking
        ['drag', 'dragging', 'move'].forEach(event => {
            splide.on(event, () => {
                hasMoved = true;
                preventClickUntil = Date.now() + 500;
                isCurrentlyMoving = true;
            });
        });

        ['dragged', 'moved', 'active'].forEach(event => {
            splide.on(event, () => {
                preventClickUntil = Date.now() + 500;
                setTimeout(() => {
                    isCurrentlyMoving = false;
                }, 120);
            });
        });

        // Intercept clicks in capture phase to distinguish swiping from clicking
        slider.addEventListener('click', (e) => {
            // Never block pagination or arrow clicks
            if (e.target.closest('.splide__pagination, .splide__arrow')) {
                return;
            }

            if (hasMoved || Date.now() < preventClickUntil || isCurrentlyMoving) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }, true);

        // Replace default Splide arrow icons with clean Figma chevrons & enforce slide visibility
        splide.on('mounted refresh updated', () => {
            forceSlideVisibility();
            slider.querySelectorAll('a, img').forEach(el => {
                el.setAttribute('draggable', 'false');
            });
            const prev = slider.querySelector('.splide__arrow--prev');
            const next = slider.querySelector('.splide__arrow--next');
            if (prev) {
                prev.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2D3748" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
            }
            if (next) {
                next.innerHTML = `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#2D3748" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
            }
        });

        splide.mount();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initColsSliders);
} else {
    initColsSliders();
}