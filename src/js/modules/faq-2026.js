// =============================================================================
// FAQ 2026 ACCORDION COMPONENT
// =============================================================================
(function () {
  function initFaqAccordion() {
    var wrappers = document.querySelectorAll('.faq-2026__wrapper');
    if (!wrappers.length) return;

    wrappers.forEach(function (wrapper) {
      if (wrapper._faqInitialized) return;
      wrapper._faqInitialized = true;

      var question = wrapper.querySelector('.faq-2026__question');
      var answer = wrapper.querySelector('.faq-2026__answer');

      if (question) {
        question.setAttribute('role', 'button');
        question.setAttribute('tabindex', '0');
        question.setAttribute('aria-expanded', 'false');
      }

      function toggleAccordion(e) {
        // Allow keyboard navigation (Enter and Space)
        if (e.type === 'keydown') {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
        }

        var isOpen = wrapper.classList.contains('is-open');
        wrapper.classList.toggle('is-open', !isOpen);

        if (question) {
          question.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
        }
      }

      wrapper.addEventListener('click', toggleAccordion);
      if (question) {
        question.addEventListener('keydown', toggleAccordion);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initFaqAccordion);
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initFaqAccordion, 100);
  }
})();
