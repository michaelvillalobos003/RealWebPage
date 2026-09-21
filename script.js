/**
 * Michael Villalobos Portfolio - Client-Side JavaScript (script.js)
 * Handles form validation, contact submissions, media gallery lightboxes, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  initMediaGallery();
  initSmoothScroll();
  initScrollAnimations();
});

/**
 * Contact Form Controller
 * Validates inputs, sends data to POST /api/contact, and displays user alerts.
 */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  const alertSuccess = document.getElementById('contactSuccessAlert');
  const alertError = document.getElementById('contactErrorAlert');
  const submitButton = contactForm.querySelector('button[type="submit"]');

  // Floating label state helper for input and textarea elements
  const floatingFields = contactForm.querySelectorAll('.floating-group input, .floating-group textarea');
  const updateFieldState = (field) => {
    if (field.value && field.value.trim().length > 0) {
      field.classList.add('has-value');
    } else {
      field.classList.remove('has-value');
    }
  };

  floatingFields.forEach(field => {
    field.addEventListener('input', () => updateFieldState(field));
    field.addEventListener('change', () => updateFieldState(field));
    field.addEventListener('blur', () => updateFieldState(field));
    updateFieldState(field);
  });

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Reset status messages
    if (alertSuccess) alertSuccess.style.display = 'none';
    if (alertError) {
      alertError.style.display = 'none';
      alertError.textContent = '';
    }

    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const reasonInput = document.getElementById('reason');
    const messageInput = document.getElementById('message');

    const firstName = firstNameInput ? firstNameInput.value.trim() : '';
    const lastName = lastNameInput ? lastNameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const reason = reasonInput ? reasonInput.value : '';
    const message = messageInput ? messageInput.value.trim() : '';

    // Client-side Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let errorMessage = '';

    if (!firstName) {
      errorMessage = 'Please enter your first name.';
    } else if (!lastName) {
      errorMessage = 'Please enter your last name.';
    } else if (!email || !emailRegex.test(email)) {
      errorMessage = 'Please enter a valid email address.';
    } else if (!reason) {
      errorMessage = 'Please select a reason for contact.';
    } else if (!message) {
      errorMessage = 'Please enter your message.';
    }

    if (errorMessage) {
      if (alertError) {
        alertError.textContent = errorMessage;
        alertError.style.display = 'block';
      }
      return;
    }

    // Disable submit button during request
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending Message...';
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          reason,
          message
        })
      });

      const data = await response.json();

      if (response.status === 201) {
        // Clear the form after a successful submission
        contactForm.reset();
        floatingFields.forEach(field => field.classList.remove('has-value'));

        if (alertSuccess) {
          alertSuccess.style.display = 'block';
          alertSuccess.textContent = `Thank you, ${data.firstName}! Your message has been received and saved. I will respond to your inquiry shortly.`;
        }
      } else {
        const errorMsg = data.error || 'Failed to submit contact form. Please try again.';
        if (alertError) {
          alertError.textContent = errorMsg;
          alertError.style.display = 'block';
        }
      }
    } catch (err) {
      console.error('Network or server error during contact submission:', err);
      if (alertError) {
        alertError.textContent = 'A connection error occurred. Please check your network and try again.';
        alertError.style.display = 'block';
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message';
      }
    }
  });
}

/**
 * Media Gallery Lightbox Controller
 */
function initMediaGallery() {
  const mediaCards = document.querySelectorAll('.media-card');
  const modal = document.getElementById('lightboxModal');
  if (!mediaCards.length || !modal) return;

  const closeBtn = document.getElementById('lightboxCloseBtn') || document.getElementById('lightboxClose');
  const mediaContainer = document.getElementById('lightboxMediaContainer');
  const modalTitle = document.getElementById('lightboxTitle');
  const modalCaption = document.getElementById('lightboxCaption');

  function openModal(card) {
    const mediaType = card.dataset.type;
    const mediaSrc = card.dataset.src;
    const title = card.dataset.title || '';
    const caption = card.dataset.caption || '';
    const link = card.dataset.link || '';

    // If it's an external social media card with a direct link and user clicked the external link button
    if (link && mediaType === 'social') {
      window.open(link, '_blank');
      return;
    }

    if (modalTitle) modalTitle.textContent = title;
    if (modalCaption) modalCaption.textContent = caption;

    if (mediaContainer) {
      mediaContainer.innerHTML = '';
      if (mediaType === 'video') {
        const videoEl = document.createElement('video');
        videoEl.src = mediaSrc;
        videoEl.controls = true;
        videoEl.autoplay = true;
        videoEl.playsInline = true;
        mediaContainer.appendChild(videoEl);
      } else {
        const imgEl = document.createElement('img');
        imgEl.src = mediaSrc;
        imgEl.alt = title;
        mediaContainer.appendChild(imgEl);
      }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (mediaContainer) {
      mediaContainer.innerHTML = '';
    }
  }

  mediaCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger modal if user clicked an explicit external link anchor
      if (e.target.closest('a') && !e.target.closest('.media-card-click-trigger')) {
        return;
      }
      openModal(card);
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/**
 * Smooth scrolling for in-page anchors (e.g., #contact)
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').substring(1);
      if (!targetId) return;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/**
 * Scroll-Triggered Fade-In Animations
 * Uses an IntersectionObserver to smoothly reveal <section> elements as they scroll into view.
 */
function initScrollAnimations() {
  const sections = document.querySelectorAll('section');
  if (!sections.length) return;

  // Accessibility check: respect users who prefer reduced motion
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Graceful fallback if IntersectionObserver is not supported or motion is reduced
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    sections.forEach(section => {
      section.classList.add('fade-in-section', 'is-visible');
    });
    return;
  }

  // Configure IntersectionObserver with rootMargin and threshold
  const observerOptions = {
    root: null, // Default to browser viewport
    rootMargin: '0px 0px -40px 0px', // Trigger slightly before the section reaches bottom edge
    threshold: 0.08 // Trigger as soon as 8% of the section is visible
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Once visible, stop observing this section to keep it static and performant
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Apply base animation class and begin observation
  sections.forEach(section => {
    section.classList.add('fade-in-section');
    observer.observe(section);
  });
}

