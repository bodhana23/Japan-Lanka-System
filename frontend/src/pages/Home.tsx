import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Wrench, Zap, Gem, Target, Car, Mail, Phone, MapPin, User,
  ChevronRight, Shield, Truck, Award, Star, ArrowRight, Sparkles,
  Clock, CheckCircle, HeadphonesIcon
} from 'lucide-react';
import AdsCarousel from '../components/AdsCarousel';
import './Home.css';

// Counter animation hook
const useCountUp = (end: number, duration: number = 2000, startOnView: boolean = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, hasStarted]);

  useEffect(() => {
    if (!startOnView || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView, hasStarted]);

  return { count, ref };
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Counter animations for stats
  const yearsCounter = useCountUp(15, 2000);
  const customersCounter = useCountUp(10, 2000);
  const partsCounter = useCountUp(5000, 2500);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleLearnMoreClick = () => {
    const aboutSection = document.getElementById('about-section');
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSearchPartsClick = () => {
    navigate('/shop');
  };

  const handleEmployeeLoginClick = () => {
    navigate('/employee-login');
  };

  const testimonials = [
    {
      name: "Kasun Perera",
      role: "Workshop Owner",
      content: "Japan Lanka has been our trusted supplier for over 5 years. Their quality parts and fast delivery keep our workshop running smoothly.",
      rating: 5
    },
    {
      name: "Nimal Silva",
      role: "Fleet Manager",
      content: "Managing 50+ vehicles requires reliable parts. Japan Lanka never disappoints with their genuine quality and competitive pricing.",
      rating: 5
    },
    {
      name: "Priya Fernando",
      role: "Car Enthusiast",
      content: "Found rare parts for my classic Toyota that no one else had. The team went above and beyond to help me restore my car.",
      rating: 5
    }
  ];

  return (
    <div className="home-page">
      {/* Animated Background */}
      <div className="home-bg-elements">
        <div className="bg-gradient-orb bg-orb-1"></div>
        <div className="bg-gradient-orb bg-orb-2"></div>
        <div className="bg-gradient-orb bg-orb-3"></div>
        <div className="bg-grid-pattern"></div>
      </div>

      {/* Header Section */}
      <header className={`home-header ${isScrolled ? 'header-scrolled' : ''}`}>
        <div className="header-container">
          <div className="logo-section">
            <div className="logo-icon">
              <Car size={34} />
            </div>
            <div className="logo-text">
              <h1 className="company-name">Japan Lanka</h1>
              <p className="tagline">Premium Auto Parts</p>
            </div>
          </div>
          <nav className="header-nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#about-section" className="nav-link">About</a>
            <a href="#testimonials" className="nav-link">Reviews</a>
            <button className="register-nav-btn" onClick={handleRegisterClick}>
              Register
            </button>
            <button className="login-btn" onClick={handleLoginClick}>
              <Lock size={16} />
              <span>Login</span>
              <ChevronRight size={16} className="btn-arrow" />
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <div className="hero-badge">
                <Sparkles size={14} />
                <span>Trusted by 10,000+ customers</span>
              </div>
              <h1 className="hero-title">
                Premium <span className="text-gradient">Automobile Parts</span> for Every Vehicle
              </h1>
              <p className="hero-description">
                Discover Sri Lanka's most trusted destination for genuine automobile parts.
                From brake systems to engine components, we deliver quality you can rely on.
              </p>
              <div className="hero-actions">
                <button className="cta-primary" onClick={handleSearchPartsClick}>
                  <Wrench size={18} />
                  <span>Browse Parts</span>
                  <ArrowRight size={18} className="btn-arrow" />
                </button>
                <button className="cta-secondary" onClick={handleLearnMoreClick}>
                  Learn More
                </button>
              </div>
              <div className="hero-trust-badges">
                <div className="trust-badge">
                  <Shield size={16} />
                  <span>Genuine Parts</span>
                </div>
                <div className="trust-badge">
                  <Truck size={16} />
                  <span>Fast Delivery</span>
                </div>
                <div className="trust-badge">
                  <Award size={16} />
                  <span>Quality Assured</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-image-wrapper">
                {!imageError ? (
                  <img
                    src="/images/company-image.jpg"
                    alt="Japan Lanka Enterprises - Automobile Parts"
                    className="hero-img"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="hero-placeholder">
                    <div className="placeholder-content">
                      <Car size={64} />
                      <h3>Japan Lanka</h3>
                      <p>Premium Auto Parts</p>
                    </div>
                  </div>
                )}
                <div className="hero-floating-card card-1">
                  <CheckCircle size={20} className="card-icon success" />
                  <div className="card-text">
                    <span className="card-title">Quality Verified</span>
                    <span className="card-subtitle">100% Genuine</span>
                  </div>
                </div>
                <div className="hero-floating-card card-2">
                  <Truck size={20} className="card-icon" />
                  <div className="card-text">
                    <span className="card-title">Island-wide</span>
                    <span className="card-subtitle">Fast Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path d="M0,64 C480,150 960,-20 1440,64 L1440,120 L0,120 Z" fill="currentColor"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-card" ref={yearsCounter.ref}>
            <div className="stat-icon">
              <Clock size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{yearsCounter.count}+</div>
              <div className="stat-label">Years Experience</div>
            </div>
          </div>
          <div className="stat-card" ref={customersCounter.ref}>
            <div className="stat-icon">
              <User size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{customersCounter.count}k+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
          </div>
          <div className="stat-card" ref={partsCounter.ref}>
            <div className="stat-icon">
              <Wrench size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{partsCounter.count.toLocaleString()}+</div>
              <div className="stat-label">Parts Available</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <HeadphonesIcon size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Ads Carousel — shown between stats and features when ads are available */}
      <AdsCarousel />

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="features-container">
          <div className="section-header">
            <span className="section-badge">Why Choose Us</span>
            <h2 className="section-title">Built on Trust, Driven by Quality</h2>
            <p className="section-subtitle">
              We've been serving Sri Lanka's automobile needs with excellence and integrity
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Wrench size={28} />
              </div>
              <h3 className="feature-title">Quality Parts</h3>
              <p className="feature-description">
                Premium automobile parts sourced directly from trusted manufacturers worldwide
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="feature-card featured">
              <div className="feature-badge">Popular</div>
              <div className="feature-icon-wrapper">
                <Zap size={28} />
              </div>
              <h3 className="feature-title">Fast Service</h3>
              <p className="feature-description">
                Quick order processing and island-wide delivery to keep you on the road
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Gem size={28} />
              </div>
              <h3 className="feature-title">Best Prices</h3>
              <p className="feature-description">
                Competitive pricing without compromising on quality or reliability
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Target size={28} />
              </div>
              <h3 className="feature-title">Expert Support</h3>
              <p className="feature-description">
                Professional team ready to help you find the right parts for your vehicle
              </p>
              <div className="feature-link">
                <span>Learn more</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="about-section">
        <div className="about-container">
          <div className="about-content">
            <div className="about-text">
              <span className="section-badge">Our Story</span>
              <h2 className="about-title">
                15 Years of <span className="text-gradient">Excellence</span> in Auto Parts
              </h2>
              <p className="about-description">
                At Japan Lanka Enterprises, we've built our reputation on a simple promise:
                delivering genuine, high-quality automobile parts that our customers can trust.
                From humble beginnings in Matara, we've grown to become one of Sri Lanka's
                most trusted auto parts suppliers.
              </p>
              <p className="about-description">
                Our commitment to quality, competitive pricing, and exceptional customer
                service has earned us the loyalty of thousands of vehicle owners, workshops,
                and fleet managers across the island.
              </p>
              <div className="about-highlights">
                <div className="highlight-item">
                  <CheckCircle size={20} className="highlight-icon" />
                  <span>Genuine OEM & Aftermarket Parts</span>
                </div>
                <div className="highlight-item">
                  <CheckCircle size={20} className="highlight-icon" />
                  <span>Island-wide Delivery Network</span>
                </div>
                <div className="highlight-item">
                  <CheckCircle size={20} className="highlight-icon" />
                  <span>Expert Technical Support</span>
                </div>
                <div className="highlight-item">
                  <CheckCircle size={20} className="highlight-icon" />
                  <span>Competitive Wholesale Pricing</span>
                </div>
              </div>
              <button className="about-cta" onClick={handleSearchPartsClick}>
                Explore Our Catalog
                <ArrowRight size={18} />
              </button>
            </div>
            <div className="about-visual">
              <div className="about-image-wrapper">
                <img
                  src="/images/company-image.jpg"
                  alt="Japan Lanka Enterprises Showroom"
                  className="about-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <div className="about-image-overlay"></div>
              </div>
              <div className="about-experience-badge">
                <span className="experience-number">15+</span>
                <span className="experience-text">Years of Excellence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="testimonials-container">
          <div className="section-header">
            <span className="section-badge">Testimonials</span>
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">
              Don't just take our word for it - hear from our satisfied customers
            </p>
          </div>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="star-icon" />
                  ))}
                </div>
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="author-info">
                    <span className="author-name">{testimonial.name}</span>
                    <span className="author-role">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Find Your Parts?</h2>
            <p className="cta-description">
              Join thousands of satisfied customers who trust Japan Lanka for their automobile needs.
              Browse our extensive catalog or contact us for expert assistance.
            </p>
            <div className="cta-buttons">
              <button className="cta-button-primary" onClick={handleSearchPartsClick}>
                <Wrench size={18} />
                Browse Parts
              </button>
              <button className="cta-button-secondary" onClick={handleLoginClick}>
                <Lock size={18} />
                Sign In
              </button>
            </div>
          </div>
          <div className="cta-decoration">
            <div className="cta-circle cta-circle-1"></div>
            <div className="cta-circle cta-circle-2"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <Car size={24} />
                <span>Japan Lanka</span>
              </div>
              <p className="footer-description">
                Your trusted partner for quality automobile parts and services.
                Serving Sri Lanka since 2010.
              </p>
              <div className="footer-social">
                <a href="#" className="social-link" aria-label="Facebook">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="social-link" aria-label="WhatsApp">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="footer-links-section">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><a href="#">Home</a></li>
                <li><a href="#about-section">About Us</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#testimonials">Reviews</a></li>
              </ul>
            </div>
            <div className="footer-links-section">
              <h4>Services</h4>
              <ul className="footer-links">
                <li><a href="#">Parts Catalog</a></li>
                <li><a href="#">Wholesale</a></li>
                <li><a href="#">Delivery</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
            <div className="footer-contact-section">
              <h4>Contact Us</h4>
              <ul className="footer-contact">
                <li>
                  <Mail size={16} />
                  <span>japanlanka@gmail.com</span>
                </li>
                <li>
                  <Phone size={16} />
                  <span>+94 41 234 5678</span>
                </li>
                <li>
                  <MapPin size={16} />
                  <span>Matara-Hakmana Rd, Thihagoda 81000</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Japan Lanka Enterprises. All rights reserved.</p>
            <button className="employee-login-btn" onClick={handleEmployeeLoginClick}>
              <User size={16} />
              Employee Portal
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
