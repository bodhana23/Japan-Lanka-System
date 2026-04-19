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
  const customersCounter = useCountUp(1000, 2000);
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <a href="#features" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
            <a href="#about-section" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('about-section'); }}>About</a>
            <a href="#testimonials" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>Reviews</a>
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
                <span>Trusted by 1,000+ customers</span>
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

      {/* Ads Carousel — shown above stats section */}
      <AdsCarousel />

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
              <div className="stat-value">{customersCounter.count}+</div>
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
              <div className="stat-value">6 days</div>
              <div className="stat-label">Mon – Sat Support</div>
            </div>
          </div>
        </div>
      </section>

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
              <button className="feature-link" onClick={handleSearchPartsClick}>
                <span>Browse catalog</span>
                <ArrowRight size={16} />
              </button>
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
              <button className="feature-link" onClick={() => scrollToSection('about-section')}>
                <span>Learn more</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Gem size={28} />
              </div>
              <h3 className="feature-title">Best Prices</h3>
              <p className="feature-description">
                Competitive pricing without compromising on quality or reliability
              </p>
              <button className="feature-link" onClick={handleSearchPartsClick}>
                <span>View prices</span>
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Target size={28} />
              </div>
              <h3 className="feature-title">Expert Support</h3>
              <p className="feature-description">
                Professional team ready to help you find the right parts for your vehicle
              </p>
              <button className="feature-link" onClick={() => scrollToSection('footer-contact')}>
                <span>Contact us</span>
                <ArrowRight size={16} />
              </button>
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
              <div className="about-image-wrapper about-image-wrapper-second">
                <img
                  src="/images/storefront.webp"
                  alt="Japan Lanka Enterprises Storefront"
                  className="about-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.parentElement!.style.display = 'none';
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
                <a href="mailto:japanlanka@gmail.com" className="social-link" aria-label="Email us">
                  <Mail size={20} />
                </a>
                <a href="tel:+940412245345" className="social-link" aria-label="Call us">
                  <Phone size={20} />
                </a>
              </div>
            </div>
            <div className="footer-links-section">
              <h4>Quick Links</h4>
              <ul className="footer-links">
                <li><a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a></li>
                <li><a href="#about-section" onClick={(e) => { e.preventDefault(); scrollToSection('about-section'); }}>About Us</a></li>
                <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Why Choose Us</a></li>
                <li><a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>Reviews</a></li>
              </ul>
            </div>
            <div className="footer-links-section">
              <h4>Services</h4>
              <ul className="footer-links">
                <li><a href="/shop" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Parts Catalog</a></li>
                <li><a href="/shop" onClick={(e) => { e.preventDefault(); navigate('/shop'); }}>Online Orders</a></li>
                <li><a href="#about-section" onClick={(e) => { e.preventDefault(); scrollToSection('about-section'); }}>Island-wide Delivery</a></li>
                <li><a href="#footer-contact" onClick={(e) => { e.preventDefault(); scrollToSection('footer-contact'); }}>Contact Support</a></li>
              </ul>
            </div>
            <div className="footer-contact-section" id="footer-contact">
              <h4>Contact Us</h4>
              <ul className="footer-contact">
                <li>
                  <Mail size={16} />
                  <span>japanlanka@gmail.com</span>
                </li>
                <li>
                  <Phone size={16} />
                  <span>0412245345</span>
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
