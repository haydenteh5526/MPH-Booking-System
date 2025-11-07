// Landing Page JavaScript

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href')
    if (href !== '#') {
      e.preventDefault()
      const target = document.querySelector(href)
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }
  })
})

// Intersection Observer for fade-in animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1'
      entry.target.style.transform = 'translateY(0)'
    }
  })
}, observerOptions)

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
  const animateElements = document.querySelectorAll('.feature-item, .pricing-card, .step')
  
  animateElements.forEach(el => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(20px)'
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease'
    observer.observe(el)
  })
})

// Mobile menu toggle (if needed in future)
const createMobileMenu = () => {
  const navLinks = document.querySelector('.nav-links')
  const navActions = document.querySelector('.nav-actions')
  
  if (window.innerWidth <= 768) {
    // Mobile menu logic can be added here if needed
  }
}

window.addEventListener('resize', createMobileMenu)
createMobileMenu()

// Add hover effect to visual cards
const visualCards = document.querySelectorAll('.visual-card')
visualCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.animationPlayState = 'paused'
  })
  
  card.addEventListener('mouseleave', () => {
    card.style.animationPlayState = 'running'
  })
})

console.log('🏟️ MPH Sports Landing Page Loaded')

