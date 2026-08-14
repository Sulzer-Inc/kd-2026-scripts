// =============================================================================
// Splide Columns Slider Module
// =============================================================================

import Splide from '@splidejs/splide';

function initColsSliders() {
    const sliders = document.querySelectorAll('.splide-cols-slider, .splide-impact-slider, .splide--cols');
    if (!sliders.length) return;

    sliders.forEach(slider => {
        if (slider.dataset.splideInitialized === 'true') return;
        slider.dataset.splideInitialized = 'true';

        // 1. Gather all slide items
        const slides = slider.querySelectorAll('.splide-cols-slider__item, .splide-impact-slider__item, .real-impact__slider-item, .splide__slide');
        if (!slides.length) return;

        // 2. Ensure Splide class on root
        slider.classList.add('splide');

        // 3. Find or construct .splide__track and .splide__list
        let track = slider.querySelector('.splide__track');
        let list = slider.querySelector('.splide__list, .splide-cols-slider__container, .splide-impact-slider__container');

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

        // 4. Initialize Splide instance
        const splideInstance = new Splide(slider, {
            type: 'loop',
            perPage: 3,
            perMove: 1,
            autoplay: false,
            arrows: true,
            pagination: false,
            gap: '1.5rem',
            speed: 500,
            breakpoints: {
                991: {
                    perPage: 2,
                    gap: '1.25rem',
                },
                767: {
                    perPage: 1,
                    gap: '1rem',
                }
            }
        });

        // Replace default Splide arrow icons with clean Figma chevrons
        splideInstance.on('mounted', () => {
            const prev = slider.querySelector('.splide__arrow--prev');
            const next = slider.querySelector('.splide__arrow--next');
            if (prev) {
                prev.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D3748" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
            }
            if (next) {
                next.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D3748" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
            }
        });

        splideInstance.mount();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initColsSliders);
} else {
    initColsSliders();
}