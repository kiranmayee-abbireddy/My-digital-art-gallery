// Initialize Lenis smooth scroll
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 2
});

// Integrate GSAP with Lenis
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// GSAP ScrollTrigger setup
gsap.registerPlugin(ScrollTrigger);

// Animate categories with 3D effect
gsap.utils.toArray('.category-container').forEach((category, i) => {
    gsap.from(category, {
        scrollTrigger: {
            trigger: category,
            start: 'top bottom-=100',
            end: 'top center',
            scrub: 1,
            toggleClass: 'parallax'
        },
        y: 100,
        opacity: 0,
        rotateX: 10,
        scale: 0.9,
        transformOrigin: 'center center'
    });
});

// Animate image cards with Intersection Observer
const cards = document.querySelectorAll('.image-card');
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -10% 0px'
};

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            cardObserver.unobserve(entry.target);
        }
    });
}, observerOptions);

cards.forEach(card => cardObserver.observe(card));

// Update cursor position based on scroll
if (cursor3D && cursor3D.butterfly) {
    cursor3D.butterfly.position.y = -scroll * 0.001;
    gsap.to(cursor3D.butterfly.rotation, {
        z: scroll * 0.001,
        duration: 0.5
    });
} 