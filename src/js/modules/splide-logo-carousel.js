// =============================================================================
// Splide.js Sliders Initialization
// =============================================================================

import Splide from '@splidejs/splide';
import { AutoScroll } from '@splidejs/splide-extension-auto-scroll';

function initLogoCarousels() {
    if (window.splideInitialized) return;
    window.splideInitialized = true;

    const logoCarousels = document.querySelectorAll('.splide-logo-carousel');
    
    if (logoCarousels.length > 0) {
        logoCarousels.forEach(carousel => {
            
            const container = carousel.querySelector('.splide-logo-carousel__container');
            if (!container) return;

            // 1. Add default Splide classes directly to your Webflow elements
            carousel.classList.add('splide');
            container.classList.add('splide__list');
            
            const slides = container.querySelectorAll('.splide-logo-carousel__item');
            slides.forEach(slide => slide.classList.add('splide__slide'));

            // 2. Inject the missing track layer (strictly required by Splide)
            if (!container.parentElement.classList.contains('splide__track')) {
                const track = document.createElement('div');
                track.classList.add('splide__track');
                
                track.style.width = '100%';
                track.style.overflow = 'hidden'; 
                
                container.parentNode.insertBefore(track, container);
                track.appendChild(container);
            }

            // 3. Initialize simply (without confusing class overrides)
            new Splide(carousel, {
                type: 'loop',
                drag: 'free',
                focus: 'center',
                autoWidth: true,
                autoHeight: true,
                arrows: false,
                pagination: false,
                gap: '2rem',
                autoScroll: {
                    speed: .5, 
                    pauseOnHover: true,
                    pauseOnFocus: false,
                },
                breakpoints: {
                    991: { gap: '3rem' },
                    767: { gap: '2rem' },
                    479: { gap: '1.5rem' }
                }
            }).mount({ AutoScroll });
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogoCarousels);
} else {
    initLogoCarousels();
}
