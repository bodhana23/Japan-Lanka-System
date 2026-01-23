import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Rocket, ClipboardList, Wrench, Zap, Gem, Target, Car, Building2, Mail, Phone, MapPin, User } from 'lucide-react';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLearnMoreClick = () => {
    try {
      const aboutSection = document.getElementById('about-section');
      if (aboutSection) {
        aboutSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    } catch (error) {
      console.error('Error scrolling to about section:', error);
      // Fallback: try to scroll to approximate position
      window.scrollTo({ top: 800, behavior: 'smooth' });
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleSearchPartsClick = () => {
    navigate('/browse-parts');
  };

  const handleSearchVehiclesClick = () => {
    // Future implementation
    alert('Vehicle search feature coming soon!');
  };

  const handleEmployeeLoginClick = () => {
    navigate('/employee-login');
  };

  return (
    <div className="home-page">
      {/* Header Section */}
      <header className="home-header">
        <div className="header-container">
          <div className="logo-section">
            <h1 className="company-name">Japan Lanka Enterprises</h1>
            <p className="tagline">Your Trusted Automobile Parts Partner</p>
          </div>
          <nav className="header-nav">
            <button className="login-btn" onClick={handleLoginClick}>
              <Lock size={16} className="login-icon" />
              Login
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Quality Automobile Parts &amp; Services
              </h1>
              <p className="hero-description">
                Your one-stop destination for premium automobile parts, 
                reliable services, and professional solutions. 
                Experience excellence in automotive care.
              </p>
              <div className="hero-actions">
                <button className="cta-primary" onClick={handleLoginClick}>
                  <Rocket size={18} className="cta-icon" />
                  Get Started
                </button>
                <button className="cta-secondary" onClick={handleLearnMoreClick}>
                  <ClipboardList size={18} className="cta-icon" />
                  Learn More
                </button>
              </div>
            </div>
            <div className="hero-image">
              <div className="image-container">
                {!imageError ? (
                  <img 
                    src="/images/company-image.jpg"
                    alt="Japan Lanka Enterprises - Automobile Parts Shop"
                    className="hero-img"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="image-placeholder">
                    <div className="placeholder-icon"><Car size={48} /></div>
                    <h3 className="placeholder-title">Japan Lanka</h3>
                    <p className="placeholder-subtitle">Automobile Parts & Services</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Window Shopper Section */}
      <section className="window-shopper-section">
        <div className="window-shopper-container">
          <h2 className="shopper-title">Browse Our Collection</h2>
          <p className="shopper-description">
            Explore our extensive catalog of quality automobile parts and vehicles. No account needed to browse!
          </p>
          <div className="shopper-buttons">
            <button className="shopper-btn shopper-btn-parts" onClick={handleSearchPartsClick}>
              <Wrench size={24} className="shopper-icon" />
              <div className="shopper-btn-content">
                <span className="shopper-btn-title">Search for Parts</span>
                <span className="shopper-btn-subtitle">Browse our parts catalog</span>
              </div>
            </button>
            <button className="shopper-btn shopper-btn-vehicles" onClick={handleSearchVehiclesClick}>
              <Car size={24} className="shopper-icon" />
              <div className="shopper-btn-content">
                <span className="shopper-btn-title">Search for Vehicles</span>
                <span className="shopper-btn-subtitle">Coming soon!</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="section-title">Why Choose Japan Lanka?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><Wrench size={32} /></div>
              <h3 className="feature-title">Quality Parts</h3>
              <p className="feature-description">
                Premium automobile parts sourced from trusted manufacturers
              </p>
              <div className="feature-accent"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Zap size={32} /></div>
              <h3 className="feature-title">Fast Service</h3>
              <p className="feature-description">
                Quick and efficient service to keep you moving forward
              </p>
              <div className="feature-accent"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Gem size={32} /></div>
              <h3 className="feature-title">Reliability</h3>
              <p className="feature-description">
                Trusted by customers for years of consistent excellence
              </p>
              <div className="feature-accent"></div>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><Target size={32} /></div>
              <h3 className="feature-title">Professional</h3>
              <p className="feature-description">
                Expert team dedicated to providing professional solutions
              </p>
              <div className="feature-accent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-section" className="about-section">
        <div className="about-container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="about-title">About Us</h2>
              <p className="about-description">
                At Japan Lanka, we specialize in providing high-quality automobile parts and reliable services that keep our customers
                moving forward with confidence. For years, we have been committed to delivering trusted solutions for vehicle owners,
                workshops, and businesses who rely on us for efficiency, transparency, and professionalism.
              </p>
              <div className="about-stats">
                <div className="stat-item">
                  <div className="stat-number">15+</div>
                  <div className="stat-label">Years Experience</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">10k+</div>
                  <div className="stat-label">Happy Customers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">Quality Assured</div>
                </div>
              </div>
            </div>
            <div className="about-image">
              <div className="about-img-container">
                <img 
                  src="/images/company-image.jpg"
                  alt="Japan Lanka Enterprises - Our Showroom"
                  className="about-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const container = target.parentElement;
                    if (container) {
                      container.innerHTML = `
                        <div class="about-img-placeholder">
                          <div class="placeholder-icon"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg></div>
                          <h3>Japan Lanka</h3>
                          <p>Automobile Parts & Services</p>
                        </div>
                      `;
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-description">
              Join thousands of satisfied customers who trust Japan Lanka for their automobile needs.
            </p>
            <button className="cta-button" onClick={handleLoginClick}>
              <Lock size={18} className="cta-btn-icon" />
              Access Your Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-title">Japan Lanka Enterprises</h3>
              <p className="footer-description">
                Your trusted partner for quality automobile parts and services.
              </p>
            </div>
            <div className="footer-section">
              <h4 className="footer-subtitle">Quick Links</h4>
              <ul className="footer-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#services">Services</a></li>
                <li><a href="#contact">Contact</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-subtitle">Contact Info</h4>
              <ul className="footer-contact">
                <li><Mail size={14} /> japanlanka@gmail.com</li>
                <li><Phone size={14} /> +94 41 234 5678</li>
                <li><MapPin size={14} /> Matara, Sri Lanka</li>
              </ul>
            </div>
          </div>
          <div className="footer-employee-login">
            <button className="employee-login-btn" onClick={handleEmployeeLoginClick}>
              <User size={16} className="employee-login-icon" />
              Employee Login
            </button>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Japan Lanka Enterprises. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;