// ============================================
// Neural Network Background Animation
// ============================================
(function initNeuralNetwork() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNeuralNetwork);
        return;
    }
    
    const canvas = document.getElementById('neural-network-bg');
    if (!canvas) {
        console.error('Neural network canvas not found');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.display = 'block';
    
    // Particle system
    const particles = [];
    const particleCount = 200; // Increased from 100 for more dots
    const connectionDistance = 240; // Increased from 180 for more connections
    let animationId;
    
    class Particle {
        constructor(delay = 0) {
            // Start from edges of screen
            const edge = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
            switch(edge) {
                case 0: // top
                    this.x = Math.random() * width;
                    this.y = -50;
                    break;
                case 1: // right
                    this.x = width + 50;
                    this.y = Math.random() * height;
                    break;
                case 2: // bottom
                    this.x = Math.random() * width;
                    this.y = height + 50;
                    break;
                case 3: // left
                    this.x = -50;
                    this.y = Math.random() * height;
                    break;
            }
            
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = 3.5;
            this.connections = [];
            this.activationLevel = 0; // 0 = inactive, 1 = fully active
            this.fadeSpeed = 0.004; // Even slower fade for much longer visibility
            
            // Fade-in animation properties
            this.opacity = 0;
            this.fadeInDelay = delay;
            this.fadeInSpeed = 0.05; // Faster fade-in (was 0.02)
            this.hasEnteredScreen = false;
        }
        
        update() {
            // Handle fade-in delay
            if (this.fadeInDelay > 0) {
                this.fadeInDelay -= 16; // Approximate frame time
                return;
            }
            
            // Fade in particle
            if (this.opacity < 1) {
                this.opacity += this.fadeInSpeed;
                if (this.opacity > 1) this.opacity = 1;
            }
            
            this.x += this.vx;
            this.y += this.vy;
            
            // Check if particle has entered screen
            if (!this.hasEnteredScreen) {
                if (this.x >= 0 && this.x <= width && this.y >= 0 && this.y <= height) {
                    this.hasEnteredScreen = true;
                }
            }
            
            // Bounce off edges once inside
            if (this.hasEnteredScreen) {
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            
            // Fade out activation
            if (this.activationLevel > 0) {
                this.activationLevel -= this.fadeSpeed;
                if (this.activationLevel < 0) this.activationLevel = 0;
            }
        }
        
        draw() {
            if (this.opacity <= 0) return; // Don't draw if not visible yet
            
            const isDark = document.body.classList.contains('dark-theme');
            
            // Base color (default particle color)
            let baseColor = isDark ? '#ffffff' : '#000000';
            
            // Active color (cyan/blue)
            let activeColor = isDark ? 'rgb(34, 211, 238)' : 'rgb(6, 182, 212)';
            
            // Interpolate between base and active color
            if (this.activationLevel > 0) {
                const r = isDark ?
                    Math.round(255 + (34 - 255) * this.activationLevel) :
                    Math.round(0 + (6 - 0) * this.activationLevel);
                const g = isDark ?
                    Math.round(255 + (211 - 255) * this.activationLevel) :
                    Math.round(0 + (182 - 0) * this.activationLevel);
                const b = isDark ?
                    Math.round(255 + (238 - 255) * this.activationLevel) :
                    Math.round(0 + (212 - 0) * this.activationLevel);
                baseColor = `rgb(${r}, ${g}, ${b})`;
            }
            
            // Apply fade-in opacity (reduced by 40% for dots only)
            ctx.globalAlpha = this.opacity * 0.6;
            
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add glow when active
            if (this.activationLevel > 0.3) {
                const glowSize = 8 * this.activationLevel;
                const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, glowSize);
                gradient.addColorStop(0, isDark ? `rgba(34, 211, 238, ${this.activationLevel * 0.6})` : `rgba(6, 182, 212, ${this.activationLevel * 0.6})`);
                gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Reset alpha
            ctx.globalAlpha = 1;
        }
        
        findConnections() {
            this.connections = [];
            for (let other of particles) {
                if (other === this) continue;
                const dx = this.x - other.x;
                const dy = this.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < connectionDistance) {
                    this.connections.push(other);
                }
            }
        }
        
        activate(level = 1) {
            this.activationLevel = Math.max(this.activationLevel, level);
        }
    }
    
    // Initialize particles with staggered delays for gradual appearance
    for (let i = 0; i < particleCount; i++) {
        const delay = i * 15; // 15ms delay between each particle (faster appearance)
        particles.push(new Particle(delay));
    }
    
    // Wave propagation system
    function propagateWave(startParticle, depth = 0, maxDepth = 8, visited = new Set()) {
        if (depth > maxDepth || visited.has(startParticle)) return;
        
        visited.add(startParticle);
        
        // Activate current particle with decreasing intensity
        const intensity = 1 - (depth / maxDepth) * 0.3; // 1.0 to 0.7 (stays brighter for longer)
        startParticle.activate(intensity);
        
        // Propagate to connected particles with delay
        if (depth < maxDepth) {
            setTimeout(() => {
                startParticle.findConnections();
                startParticle.connections.forEach(neighbor => {
                    propagateWave(neighbor, depth + 1, maxDepth, visited);
                });
            }, 120); // 120ms delay between waves for smoother propagation
        }
    }
    
    // Animation loop
    function animate() {
        const isDark = document.body.classList.contains('dark-theme');
        
        // Clear canvas
        ctx.fillStyle = isDark ? '#000000' : '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // Update particle connections
        particles.forEach(p => p.findConnections());
        
        // Draw connections with activation-based coloring
        ctx.lineWidth = 1.5;
        for (let i = 0; i < particles.length; i++) {
            // Skip if particle not visible yet
            if (particles[i].opacity <= 0) continue;
            
            for (let j = i + 1; j < particles.length; j++) {
                // Skip if second particle not visible yet
                if (particles[j].opacity <= 0) continue;
                
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < connectionDistance) {
                    // Factor in both particles' opacity for connection visibility
                    const connectionOpacity = Math.min(particles[i].opacity, particles[j].opacity);
                    const baseOpacity = (1 - distance / connectionDistance) * 0.5 * connectionOpacity;
                    
                    // Check if either particle is activated
                    const activation = Math.max(particles[i].activationLevel, particles[j].activationLevel);
                    
                    if (activation > 0.1) {
                        // Active connection - purple to blue gradient
                        const activeOpacity = baseOpacity + (activation * 0.8 * connectionOpacity);
                        
                        // Create linear gradient from particle i to particle j
                        const gradient = ctx.createLinearGradient(
                            particles[i].x, particles[i].y,
                            particles[j].x, particles[j].y
                        );
                        
                        if (isDark) {
                            // Dark mode: vibrant purple to bright cyan gradient
                            gradient.addColorStop(0, `rgba(168, 85, 247, ${activeOpacity})`);   // Purple
                            gradient.addColorStop(0.5, `rgba(96, 165, 250, ${activeOpacity})`); // Blue
                            gradient.addColorStop(1, `rgba(34, 211, 238, ${activeOpacity})`);   // Cyan
                        } else {
                            // Light mode: purple to blue gradient
                            gradient.addColorStop(0, `rgba(139, 92, 246, ${activeOpacity})`);   // Purple
                            gradient.addColorStop(0.5, `rgba(59, 130, 246, ${activeOpacity})`); // Blue
                            gradient.addColorStop(1, `rgba(6, 182, 212, ${activeOpacity})`);    // Cyan
                        }
                        
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 1.5 + (activation * 1.5); // Thicker when active
                    } else {
                        // Normal connection
                        ctx.strokeStyle = isDark
                            ? `rgba(255, 255, 255, ${baseOpacity})`
                            : `rgba(0, 0, 0, ${baseOpacity})`;
                        ctx.lineWidth = 1;
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        animationId = requestAnimationFrame(animate);
    }
    
    // Page Visibility API - pause animation when tab is hidden
    let isAnimating = true;
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            isAnimating = false;
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        } else {
            isAnimating = true;
            animate();
        }
    });
    
    // Start animation
    animate();
    
    // Handle resize with passive listener
    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    });
    
    // Click handler function - reusable for both canvas and document clicks
    function handleNetworkClick(clickX, clickY) {
        // Find nearest particle (larger detection radius for better UX)
        let nearest = null;
        let minDist = Infinity;
        const detectionRadius = 80; // Increased from 50 to 80 pixels
        
        for (let particle of particles) {
            const dx = particle.x - clickX;
            const dy = particle.y - clickY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDist && distance < detectionRadius) {
                minDist = distance;
                nearest = particle;
            }
        }
        
        // Propagate color wave through network if particle clicked
        if (nearest) {
            nearest.findConnections();
            
            // Start the wave propagation
            propagateWave(nearest, 0, 8); // depth 0, max depth 8 (9 levels total)
            
            return true; // Wave triggered
        }
        return false; // No wave triggered
    }
    
    // Canvas click handler
    canvas.addEventListener('click', (e) => {
        handleNetworkClick(e.clientX, e.clientY);
    });
    
    // Document-level click handler to catch clicks anywhere on the page
    document.addEventListener('click', (e) => {
        // Ignore clicks on interactive elements
        const target = e.target;
        const isInteractive = target.tagName === 'A' ||
                             target.tagName === 'BUTTON' ||
                             target.tagName === 'INPUT' ||
                             target.tagName === 'TEXTAREA' ||
                             target.closest('a, button, input, textarea');
        
        if (!isInteractive) {
            handleNetworkClick(e.clientX, e.clientY);
        }
    });
})();

// ============================================
// DOM Content Loaded - Initialize Everything
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // Draw-in Animation for Xenometon Text
    // ============================================
    const xenometonName = document.querySelector('.xenometon-name');
    
    if (xenometonName) {
        // Add data-text attribute for hover effect
        xenometonName.setAttribute('data-text', xenometonName.textContent);
        
        // Trigger the draw-in animation
        xenometonName.classList.add('first-load');
        
        // Remove clip-path after animation completes (1.2s delay + 1.5s animation = 2.7s)
        setTimeout(() => {
            xenometonName.classList.add('animation-complete');
        }, 2700);
    }
    
    // ============================================
    // Theme Toggle Functionality
    // ============================================
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        themeToggle.checked = true;
    }
    
    // Theme toggle change handler
    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // ============================================
    // Mobile Navigation Menu Toggle
    // ============================================
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle menu
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Update ARIA attribute
        const isExpanded = hamburger.classList.contains('active');
        hamburger.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu.contains(event.target);
        const isClickOnHamburger = hamburger.contains(event.target);
        
        if (!isClickInsideNav && !isClickOnHamburger && navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
    
    // ============================================
    // Smooth Scrolling for Navigation Links
    // ============================================
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ============================================
    // Active Section Highlighting in Navigation
    // ============================================
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavigation() {
        const scrollY = window.pageYOffset;
        const headerHeight = document.getElementById('header').offsetHeight;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - headerHeight - 100;
            const sectionId = section.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                correspondingLink?.classList.add('active');
            } else {
                correspondingLink?.classList.remove('active');
            }
        });
    }
    
    // Add passive scroll event listener for active section highlighting
    window.addEventListener('scroll', highlightNavigation, { passive: true });
    
    // ============================================
    // Header Scroll Effect
    // ============================================
    const header = document.getElementById('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });
    
    // ============================================
    // Project Carousel Functionality
    // ============================================
    const carouselTrack = document.querySelector('.carousel-track');
    const carouselPrev = document.querySelector('.carousel-prev');
    const carouselNext = document.querySelector('.carousel-next');
    const indicators = document.querySelectorAll('.indicator');
    const projectCards = document.querySelectorAll('.project-card');
    
    let currentIndex = 0;
    const totalProjects = projectCards.length;
    
    // Function to update carousel position
    function updateCarousel(index) {
        // Ensure index is within bounds
        if (index < 0) index = totalProjects - 1;
        if (index >= totalProjects) index = 0;
        
        currentIndex = index;
        
        // Move carousel
        const offset = -currentIndex * 100;
        carouselTrack.style.transform = `translateX(${offset}%)`;
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            if (i === currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }
    
    // Previous button
    carouselPrev.addEventListener('click', function() {
        updateCarousel(currentIndex - 1);
    });
    
    // Next button
    carouselNext.addEventListener('click', function() {
        updateCarousel(currentIndex + 1);
    });
    
    // Indicator buttons
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', function() {
            updateCarousel(index);
        });
    });
    
    // Keyboard navigation for carousel
    document.addEventListener('keydown', function(e) {
        const projectsSection = document.getElementById('projects');
        const projectsRect = projectsSection.getBoundingClientRect();
        
        // Only handle arrow keys when projects section is in view
        if (projectsRect.top < window.innerHeight && projectsRect.bottom > 0) {
            if (e.key === 'ArrowLeft') {
                updateCarousel(currentIndex - 1);
            } else if (e.key === 'ArrowRight') {
                updateCarousel(currentIndex + 1);
            }
        }
    });
    
    // ============================================
    // Cursor Spotlight Effect (Microsoft Store Style)
    // ============================================
    function handleMouseMove(e, card) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    }
    
    // Add spotlight effect to project cards
    projectCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            handleMouseMove(e, card);
        });
    });
    
    // Auto-play carousel (optional - can be disabled)
    let autoPlayInterval;
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(function() {
            updateCarousel(currentIndex + 1);
        }, 5000); // Change slide every 5 seconds
    }
    
    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }
    
    // Start auto-play
    startAutoPlay();
    
    // Pause auto-play on hover
    const carouselContainer = document.querySelector('.project-carousel');
    carouselContainer.addEventListener('mouseenter', stopAutoPlay);
    carouselContainer.addEventListener('mouseleave', startAutoPlay);
    
    // ============================================
    // Scroll Reveal Animations
    // ============================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations (excluding sections with blur effects to prevent blinking)
    const animatedElements = document.querySelectorAll('.project-card, .blog-card, .skill-item');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
    
    // ============================================
    // Smooth Scroll to Top (Optional)
    // ============================================
    function createScrollToTop() {
        const scrollBtn = document.createElement('button');
        scrollBtn.innerHTML = '↑';
        scrollBtn.className = 'scroll-to-top';
        scrollBtn.setAttribute('aria-label', 'Scroll to top');
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 50px;
            height: 50px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 50%;
            font-size: 1.5rem;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 999;
            box-shadow: var(--shadow-lg);
        `;
        
        document.body.appendChild(scrollBtn);
        
        // Show/hide button on scroll with passive listener
        window.addEventListener('scroll', function() {
            if (window.scrollY > 500) {
                scrollBtn.style.opacity = '1';
                scrollBtn.style.visibility = 'visible';
            } else {
                scrollBtn.style.opacity = '0';
                scrollBtn.style.visibility = 'hidden';
            }
        }, { passive: true });
        
        // Scroll to top on click
        scrollBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
        
        // Hover effect
        scrollBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        scrollBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    }
    
    // Initialize scroll to top button
    createScrollToTop();
    
    // ============================================
    // Console Welcome Message
    // ============================================
    console.log('%c👋 Welcome to Xenometon\'s Portfolio!', 'color: #5B21B6; font-size: 20px; font-weight: bold;');
    console.log('%cInterested in the code? Check out the repository!', 'color: #059669; font-size: 14px;');
    console.log('%chttps://github.com/Xenometon', 'color: #EA580C; font-size: 12px;');
    
});