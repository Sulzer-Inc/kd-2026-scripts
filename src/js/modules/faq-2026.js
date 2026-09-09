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
      if (!answer) return;

      if (question) {
        question.setAttribute('role', 'button');
        question.setAttribute('tabindex', '0');
        question.setAttribute('aria-expanded', 'false');
      }

      function openItem() {
        wrapper.classList.add('is-open');
        if (question) question.setAttribute('aria-expanded', 'true');

        // Measure content height and animate
        answer.style.height = answer.scrollHeight + 'px';

        function onEnd() {
          if (wrapper.classList.contains('is-open')) {
            answer.style.height = 'auto';
          }
          answer.removeEventListener('transitionend', onEnd);
        }
        answer.addEventListener('transitionend', onEnd);
      }

      function closeItem() {
        // Set fixed height before animating down to 0
        answer.style.height = answer.scrollHeight + 'px';
        // Force reflow
        void answer.offsetHeight;

        wrapper.classList.remove('is-open');
        if (question) question.setAttribute('aria-expanded', 'false');

        answer.style.height = '0px';
      }

      function toggleAccordion(e) {
        if (e.type === 'keydown') {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
        }

        var isOpen = wrapper.classList.contains('is-open');
        if (isOpen) {
          closeItem();
        } else {
          openItem();
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
