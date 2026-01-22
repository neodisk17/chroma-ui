/**
 * Chroma UI Landing Page - Main JavaScript
 * Handles interactivity: navigation, tabs, mobile menu, animations
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initNavbar();
    initMobileMenu();
    initScreenshotTabs();
    initSmoothScroll();
    initScrollAnimations();
  }

  /**
   * Navbar scroll behavior
   */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateNavbar() {
      const scrollY = window.scrollY;

      if (scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      lastScrollY = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateNavbar);
        ticking = true;
      }
    }, { passive: true });

    // Initial check
    updateNavbar();
  }

  /**
   * Mobile menu toggle
   */
  function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!mobileMenuBtn || !mobileMenu) return;

    mobileMenuBtn.addEventListener('click', function() {
      const isOpen = mobileMenu.classList.contains('open');

      if (isOpen) {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.classList.remove('active');
      } else {
        mobileMenu.classList.add('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileMenuBtn.classList.add('active');
      }
    });

    // Close mobile menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.classList.remove('active');
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
      const isMenuOpen = mobileMenu.classList.contains('open');
      const isClickInside = mobileMenu.contains(event.target) || mobileMenuBtn.contains(event.target);

      if (isMenuOpen && !isClickInside) {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.classList.remove('active');
      }
    });

    // Close on escape key
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.classList.remove('active');
      }
    });
  }

  /**
   * Screenshot tabs switching
   */
  function initScreenshotTabs() {
    const tabs = document.querySelectorAll('.screenshot-tab');
    const screenshotImg = document.getElementById('screenshot-img');
    const windowTitle = document.querySelector('.screenshot-display .window-title');

    if (!tabs.length || !screenshotImg) return;

    // Screenshot data mapping
    const screenshots = {
      collections: {
        src: 'images/screenshot-collections.png',
        alt: 'Collections view showing all your ChromaDB collections',
        title: 'Chroma UI - Collections',
        fallback: 'https://placehold.co/1200x700/1a1a2e/666?text=Collections+View'
      },
      documents: {
        src: 'images/screenshot-documents.png',
        alt: 'Documents view with virtual scrolling for large datasets',
        title: 'Chroma UI - Documents',
        fallback: 'https://placehold.co/1200x700/1a1a2e/666?text=Documents+View'
      },
      query: {
        src: 'images/screenshot-query.png',
        alt: 'Visual Query Builder for semantic searches',
        title: 'Chroma UI - Query Builder',
        fallback: 'https://placehold.co/1200x700/1a1a2e/666?text=Query+Builder'
      },
      embeddings: {
        src: 'images/screenshot-embeddings.png',
        alt: '2D visualization of vector embeddings',
        title: 'Chroma UI - Embeddings',
        fallback: 'https://placehold.co/1200x700/1a1a2e/666?text=Embeddings+Visualization'
      },
      comparison: {
        src: 'images/screenshot-comparison.png',
        alt: 'Side-by-side document comparison with similarity scores',
        title: 'Chroma UI - Comparison',
        fallback: 'https://placehold.co/1200x700/1a1a2e/666?text=Document+Comparison'
      }
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabName = this.dataset.tab;
        const screenshot = screenshots[tabName];

        if (!screenshot) return;

        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');

        // Animate transition
        screenshotImg.style.opacity = '0.5';
        screenshotImg.style.transform = 'scale(0.98)';

        // Change image after brief delay for smooth transition
        setTimeout(() => {
          screenshotImg.src = screenshot.src;
          screenshotImg.alt = screenshot.alt;
          screenshotImg.onerror = function() {
            this.src = screenshot.fallback;
          };

          // Update window title if exists
          if (windowTitle) {
            windowTitle.textContent = screenshot.title;
          }

          // Restore opacity
          screenshotImg.style.opacity = '1';
          screenshotImg.style.transform = 'scale(1)';
        }, 150);
      });
    });

    // Add transition styles to screenshot image
    screenshotImg.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
  }

  /**
   * Smooth scroll for anchor links
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');

        // Skip if it's just "#"
        if (href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        // Calculate offset for fixed navbar
        const navbarHeight = 80;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });

        // Update URL without triggering scroll
        history.pushState(null, null, href);
      });
    });
  }

  /**
   * Intersection Observer for scroll animations
   */
  function initScrollAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.style.opacity = '1';
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Elements to animate
    const animateElements = [
      '.bento-card',
      '.download-card',
      '.github-card',
      '.section-header'
    ];

    animateElements.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.opacity = '0';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
      });
    });
  }

  /**
   * Utility: Debounce function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Utility: Throttle function
   */
  function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

})();
