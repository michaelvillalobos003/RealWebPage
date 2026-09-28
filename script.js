/**
 * Michael Villalobos Portfolio - Client-Side JavaScript (script.js)
 * Handles form validation, contact submissions, media gallery lightboxes, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  initMediaGallery();
  initSmoothScroll();
  initScrollAnimations();
  initHeroShaderBackground();
  initNameAnimation();
  initTextBlockReveal();
  initFloating3DParallax();
  initProjectImageUploader();
  initBikeImageUploader();
  initPortraitUploader();
  initHobbyUploaders();
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
 * General-purpose IntersectionObserver that adds 'is-revealed' class to any element
 * with the class 'scroll-reveal-text' as it enters the viewport.
 * Also observes <section> elements to apply 'is-visible' transitions.
 */
function initScrollAnimations() {
  const sections = document.querySelectorAll('section');
  const revealElements = document.querySelectorAll('.scroll-reveal-text');

  // Accessibility check: respect users who prefer reduced motion
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Graceful fallback if IntersectionObserver is not supported or motion is reduced
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    sections.forEach(section => {
      section.classList.add('fade-in-section', 'is-visible');
    });
    revealElements.forEach(el => {
      el.classList.add('is-revealed');
    });
    return;
  }

  // Section Observer for whole section wrapper transitions
  const sectionObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.08
  });

  sections.forEach(section => {
    section.classList.add('fade-in-section');
    sectionObserver.observe(section);
  });

  // General-purpose IntersectionObserver for any element with .scroll-reveal-text
  const scrollRevealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.1
  });

  revealElements.forEach(el => {
    // Elements already above fold or in initial hero section reveal immediately / after minor delay
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add('is-revealed');
    } else {
      scrollRevealObserver.observe(el);
    }
  });
}

/**
 * Animated WebGL Shader Hero Background
 * Native GPU-accelerated GLSL shader providing fluid, organic glowing waves behind the hero section.
 */
function initHeroShaderBackground() {
  const canvas = document.getElementById('heroShaderCanvas');
  const heroSection = document.getElementById('heroSection');
  if (!canvas || !heroSection) return;

  // Respect user preference for reduced motion
  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    canvas.style.display = 'none';
    return;
  }

  // Attempt to acquire WebGL context
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    // If WebGL is not supported, the CSS background gradient handles styling seamlessly
    canvas.style.display = 'none';
    return;
  }

  // Vertex shader (Full-screen quad)
  const vsSource = `
    attribute vec2 a_position;
    void main() {
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  // Fragment shader (Animated organic fluid shader with simplex noise & interactive mouse glow)
  const fsSource = `
    precision mediump float;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec2 u_mouse;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187,
                          0.366025403784439,
                         -0.577350269189626,
                          0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      vec2 st = gl_FragCoord.xy / u_resolution.xy;
      st.x *= u_resolution.x / u_resolution.y;

      vec2 mouseNorm = u_mouse / u_resolution.xy;
      mouseNorm.x *= u_resolution.x / u_resolution.y;
      float dist = distance(st, mouseNorm);

      float t = u_time * 0.18;

      // Flowing fluid domain warping
      vec2 q = vec2(snoise(st + vec2(t * 0.25, t * 0.12)), snoise(st + vec2(-t * 0.18, t * 0.22)));
      vec2 r = vec2(snoise(st + 1.2 * q + vec2(1.7, 9.2) + 0.1 * t), snoise(st + 1.2 * q + vec2(8.3, 2.8) - 0.12 * t));

      float mouseInfluence = smoothstep(0.55, 0.0, dist) * 0.28;
      float f = snoise(st + 1.4 * r) + mouseInfluence;

      // Color Palette: Obsidian Black base, Oceanic Cyan, Sky Blue, and Indigo Glow
      vec3 colDark = vec3(0.015, 0.03, 0.08);   // #040814
      vec3 colBlue = vec3(0.01, 0.40, 0.65);    // deep cyan
      vec3 colCyan = vec3(0.22, 0.74, 0.97);    // light blue (#38bdf8)
      vec3 colGlow = vec3(0.35, 0.38, 0.92);    // indigo violet accent

      float w1 = smoothstep(-0.35, 0.85, f);
      float w2 = clamp(length(q), 0.0, 1.0);
      float w3 = clamp(length(r.x), 0.0, 1.0);

      vec3 color = mix(colDark, colBlue, w1 * 0.68);
      color = mix(color, colCyan, w2 * 0.32);
      color += colGlow * (w3 * 0.18);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('Shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
  if (!vertexShader || !fragmentShader) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Program link failed:', gl.getProgramInfoLog(program));
    return;
  }

  gl.useProgram(program);

  // Screen quad buffer: two triangles covering clip space
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
    -1.0,  1.0,
     1.0, -1.0,
     1.0,  1.0
  ]), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
  const timeLocation = gl.getUniformLocation(program, 'u_time');
  const mouseLocation = gl.getUniformLocation(program, 'u_mouse');

  // Mouse interactivity tracking
  let targetMouseX = 0;
  let targetMouseY = 0;
  let currentMouseX = 0;
  let currentMouseY = 0;

  heroSection.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    targetMouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    targetMouseY = (rect.bottom - e.clientY) * (canvas.height / rect.height);
  });

  heroSection.addEventListener('mouseleave', () => {
    targetMouseX = canvas.width * 0.5;
    targetMouseY = canvas.height * 0.5;
  });

  // Resize handling
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const displayWidth = Math.floor(canvas.clientWidth * dpr);
    const displayHeight = Math.floor(canvas.clientHeight * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth || 300;
      canvas.height = displayHeight || 150;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      targetMouseX = canvas.width * 0.5;
      targetMouseY = canvas.height * 0.5;
      currentMouseX = targetMouseX;
      currentMouseY = targetMouseY;
    }
  }

  window.addEventListener('resize', resize);
  resize();

  // Energy-efficient animation loop (pauses when hero is scrolled off screen)
  let isVisible = true;
  if ('IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });
    heroObserver.observe(heroSection);
  }

  let startTime = performance.now();
  let animationFrameId = null;

  function render(now) {
    if (isVisible) {
      const elapsed = (now - startTime) * 0.001;
      
      // Smooth lerp for mouse coordinates
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      gl.useProgram(program);
      gl.uniform1f(timeLocation, elapsed);
      gl.uniform2f(mouseLocation, currentMouseX, currentMouseY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    animationFrameId = requestAnimationFrame(render);
  }

  animationFrameId = requestAnimationFrame(render);
}

/**
 * Left-to-Right Name Letter Reveal Controller
 * Animates each letter sequentially from left to right and provides a replay trigger.
 */
function initNameAnimation() {
  const replayBtn = document.getElementById('replayNameBtn');
  const heading = document.getElementById('studentNameHeading');
  const letters = document.querySelectorAll('.letter-char');

  if (!letters.length) return;

  function replayLetters() {
    letters.forEach(letter => {
      letter.style.animation = 'none';
      void letter.offsetWidth; // Force DOM reflow to re-arm animation
      letter.style.animation = '';
    });
  }

  if (replayBtn) {
    replayBtn.addEventListener('click', replayLetters);
  }

  if (heading) {
    heading.style.cursor = 'pointer';
    heading.title = 'Click to replay animation';
    heading.addEventListener('click', replayLetters);
  }
}

/**
 * Text Block Revealer (Scroll-Triggered)
 * Implements the GSAP TextBlockAnimation pattern:
 * When scrolled into view, a solid colored block expands left-to-right across the text,
 * reveals the text content beneath it, and contracts left-to-right out to the right.
 */
function initTextBlockReveal() {
  const revealElements = document.querySelectorAll('.text-block-reveal');
  if (!revealElements.length) return;

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach(el => el.classList.add('is-animated'));
    return;
  }

  // Trigger when top of element hits ~85% of viewport height (just like GSAP start: 'top 85%')
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const color = el.getAttribute('data-block-color');
        const duration = el.getAttribute('data-duration');
        const delay = el.getAttribute('data-delay');

        if (color) el.style.setProperty('--block-color', color);
        if (duration) el.style.setProperty('--reveal-duration', `${duration}s`);
        if (delay) el.style.setProperty('--reveal-delay', `${delay}s`);

        el.classList.add('is-animated');
        obs.unobserve(el);
      }
    });
  }, {
    root: null,
    rootMargin: '0px 0px -15% 0px',
    threshold: 0.1
  });

  revealElements.forEach(el => observer.observe(el));
}

/**
 * Floating 3D Geometric UI Elements Subtle Parallax & Interactive Physics
 * Responds to subtle mouse movements over the showcase container
 */
function initFloating3DParallax() {
  const stage = document.getElementById('showcaseStage');
  if (!stage) return;

  const torus = document.getElementById('floatingTorus');
  const sphere = document.getElementById('floatingSphere');
  const star = document.getElementById('floatingStar');
  const cone = document.getElementById('floatingCone');

  const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isHovered = false;

  stage.addEventListener('mousemove', (e) => {
    const rect = stage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    targetX = x * 35;
    targetY = y * 35;
    isHovered = true;
  });

  stage.addEventListener('mouseleave', () => {
    targetX = 0;
    targetY = 0;
    isHovered = false;
  });

  function renderParallax() {
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    if (torus) {
      torus.style.transform = `translate3d(${-currentX * 1.3}px, ${-currentY * 1.3}px, 0)`;
    }
    if (sphere) {
      sphere.style.transform = `translate3d(${currentX * 1.8}px, ${currentY * 1.8}px, 0)`;
    }
    if (star) {
      star.style.transform = `translate3d(${-currentX * 0.8}px, ${-currentY * 0.8}px, 0)`;
    }
    if (cone) {
      cone.style.transform = `translate3d(${currentX * 1.1}px, ${currentY * 1.1}px, 0)`;
    }

    // Hero portrait floating rings subtle interaction
    const portraitTorusTop = document.getElementById('portraitTorusTop');
    const portraitTorusBottom = document.getElementById('portraitTorusBottom');
    const heroTorusLeft = document.getElementById('heroTorusLeft');

    if (portraitTorusTop) {
      portraitTorusTop.style.transform = `translate3d(${currentX * 0.9}px, ${currentY * 0.9}px, 0) rotate(-15deg)`;
    }
    if (portraitTorusBottom) {
      portraitTorusBottom.style.transform = `translate3d(${-currentX * 0.7}px, ${-currentY * 0.7}px, 0) rotate(25deg)`;
    }
    if (heroTorusLeft) {
      heroTorusLeft.style.transform = `translate3d(${-currentX * 0.5}px, ${currentY * 0.5}px, 0) rotate(8deg)`;
    }

    requestAnimationFrame(renderParallax);
  }

  requestAnimationFrame(renderParallax);
}

/**
 * Project Image Uploader
 * Allows the user to select or drag-and-drop their exact screenshot file
 * and uploads it to /api/upload-image to save as images/curated_gallery_screenshot.png
 */
function initProjectImageUploader() {
  const fileInput = document.getElementById('projectScreenshotFileInput');
  const previewImg = document.getElementById('homeCuratedGalleryImage');
  const dropBox = document.getElementById('projectScreenshotContainer');
  const uploadBar = document.getElementById('projectImgUploadBar');

  if (!fileInput || !previewImg) return;

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      previewImg.src = dataUrl;

      // Persist to server
      try {
        if (uploadBar) {
          uploadBar.style.opacity = '0.7';
        }
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: 'curated_gallery_screenshot.png',
            dataUrl: dataUrl
          })
        });
        const json = await res.json();
        if (json.success) {
          previewImg.src = json.url + '?t=' + Date.now();
          if (uploadBar) {
            uploadBar.innerHTML = `<span style="font-size: 0.8rem; color: #38bdf8; font-weight: 600;">✓ Exact screenshot saved successfully!</span> <label for="projectScreenshotFileInput" class="btn btn-secondary btn-sm" style="cursor: pointer; font-size: 0.78rem; padding: 0.25rem 0.65rem;"><span>Replace File</span><input type="file" id="projectScreenshotFileInput" accept="image/*" style="display: none;"></label>`;
            initProjectImageUploader();
          }
        }
      } catch (err) {
        console.error('Failed to save image to server:', err);
      } finally {
        if (uploadBar) {
          uploadBar.style.opacity = '1';
        }
      }
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  if (dropBox) {
    dropBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropBox.style.outline = '2px dashed #38bdf8';
    });
    dropBox.addEventListener('dragleave', () => {
      dropBox.style.outline = 'none';
    });
    dropBox.addEventListener('drop', (e) => {
      e.preventDefault();
      dropBox.style.outline = 'none';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });
  }
}

/**
 * Direct file handler for Bike image slot
 * Saves the exact original file into images/bike.jpg without any modifications or AI
 */
function initBikeImageUploader() {
  const fileInput = document.getElementById('bikeFileInput');
  const previewImg = document.getElementById('bikeImagePreview');
  const dropBox = document.getElementById('bikeDropBox');
  const uploadBar = document.getElementById('bikeUploadBar');
  const card = document.getElementById('mediaCard2');

  if (!fileInput || !previewImg) return;

  async function handleBikeFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file (e.g. IMG_6843.jpeg).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      previewImg.src = dataUrl;
      if (card) {
        card.dataset.src = dataUrl;
      }

      try {
        if (uploadBar) {
          uploadBar.style.opacity = '0.7';
        }
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: 'bike.jpg',
            dataUrl: dataUrl
          })
        });
        const json = await res.json();
        if (json.success) {
          const cleanUrl = '/images/bike.jpg?t=' + Date.now();
          previewImg.src = cleanUrl;
          if (card) {
            card.dataset.src = '/images/bike.jpg';
          }
          if (uploadBar) {
            uploadBar.innerHTML = `<span style="font-size: 0.76rem; color: #38bdf8; font-weight: 600;">✓ Saved exact image: <code>images/bike.jpg</code></span> <label for="bikeFileInput" class="btn btn-secondary btn-sm" style="cursor: pointer; font-size: 0.74rem; padding: 0.2rem 0.55rem;"><span>Replace</span><input type="file" id="bikeFileInput" accept="image/*" style="display: none;"></label>`;
            initBikeImageUploader();
          }
        }
      } catch (err) {
        console.error('Failed to save bike image:', err);
      } finally {
        if (uploadBar) {
          uploadBar.style.opacity = '1';
        }
      }
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleBikeFile(e.target.files[0]);
    }
  });

  if (dropBox) {
    dropBox.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropBox.style.outline = '2px dashed #38bdf8';
    });
    dropBox.addEventListener('dragleave', () => {
      dropBox.style.outline = 'none';
    });
    dropBox.addEventListener('drop', (e) => {
      e.preventDefault();
      dropBox.style.outline = 'none';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleBikeFile(e.dataTransfer.files[0]);
      }
    });
  }
}

/**
 * Direct file handler for Michael's personal portrait
 * Uploads exact uncompressed photo to /assets/images/michael_portrait.jpg
 */
function initPortraitUploader() {
  const fileInput = document.getElementById('portraitFileInput');
  const portraitImg = document.getElementById('studentPortraitImage');
  const headerAvatar = document.getElementById('headerAvatar');
  if (!fileInput || !portraitImg) return;

  fileInput.addEventListener('change', async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const statusEl = document.getElementById('portraitUploadStatus');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.textContent = `Loading ${file.name}...`;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      portraitImg.src = dataUrl;
      if (headerAvatar) headerAvatar.src = dataUrl;

      // Also update any avatar elements on the current page
      document.querySelectorAll('.brand-avatar').forEach(img => {
        img.src = dataUrl;
      });

      try {
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: 'michael_portrait.jpg',
            dataUrl: dataUrl
          })
        });
        const json = await res.json();
        if (json.success && statusEl) {
          statusEl.textContent = '✓ Real photo saved successfully!';
        }
      } catch (err) {
        console.error('Portrait save error:', err);
        if (statusEl) {
          statusEl.textContent = 'Uploaded to browser preview.';
        }
      }
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Direct file handler for Hobby media slots (Friends, Movies, Soccer)
 */
function initHobbyUploaders() {
  const slots = [
    { fileInputId: 'friendsFileInput', previewImgId: 'friendsImagePreview', dropBoxId: 'friendsDropBox', uploadBarId: 'friendsUploadBar', cardId: 'mediaCard3', filename: 'outside_friends.jpg' },
    { fileInputId: 'moviesFileInput', previewImgId: 'moviesImagePreview', dropBoxId: 'moviesDropBox', uploadBarId: 'moviesUploadBar', cardId: 'mediaCard4', filename: 'watching_movies.jpg' },
    { fileInputId: 'soccerFileInput', previewImgId: 'soccerImagePreview', dropBoxId: 'soccerDropBox', uploadBarId: 'soccerUploadBar', cardId: 'mediaCard6', filename: 'soccer.jpg' }
  ];

  slots.forEach(({ fileInputId, previewImgId, dropBoxId, uploadBarId, cardId, filename }) => {
    const fileInput = document.getElementById(fileInputId);
    const previewImg = document.getElementById(previewImgId);
    const dropBox = document.getElementById(dropBoxId);
    const uploadBar = document.getElementById(uploadBarId);
    const card = document.getElementById(cardId);

    if (!fileInput || !previewImg) return;

    async function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, or WebP).');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        previewImg.src = dataUrl;
        if (card) {
          card.dataset.src = dataUrl;
        }

        try {
          if (uploadBar) {
            uploadBar.style.opacity = '0.7';
          }
          const res = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: filename,
              dataUrl: dataUrl
            })
          });
          const json = await res.json();
          if (json.success) {
            const cleanUrl = `/images/${filename}?t=` + Date.now();
            previewImg.src = cleanUrl;
            if (card) {
              card.dataset.src = `/images/${filename}`;
            }
            if (uploadBar) {
              uploadBar.innerHTML = `<span style="font-size: 0.76rem; color: #38bdf8; font-weight: 600;">✓ Saved photo: <code>images/${filename}</code></span> <label for="${fileInputId}" class="btn btn-secondary btn-sm" style="cursor: pointer; font-size: 0.74rem; padding: 0.2rem 0.55rem;"><span>Replace</span><input type="file" id="${fileInputId}" accept="image/*" style="display: none;"></label>`;
              initHobbyUploaders();
            }
          }
        } catch (err) {
          console.error(`Failed to save ${filename}:`, err);
        } finally {
          if (uploadBar) {
            uploadBar.style.opacity = '1';
          }
        }
      };
      reader.readAsDataURL(file);
    }

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    if (dropBox) {
      dropBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropBox.style.outline = '2px dashed #38bdf8';
      });
      dropBox.addEventListener('dragleave', () => {
        dropBox.style.outline = 'none';
      });
      dropBox.addEventListener('drop', (e) => {
        e.preventDefault();
        dropBox.style.outline = 'none';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      });
    }
  });
}
