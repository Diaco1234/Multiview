import { motion } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FeatureCard from '../components/features/FeatureCard';
import '../styles/landing.css';

const features = [
  {
    title: "Multi-Stream Layout",
    description: "Customize your viewing experience with flexible grid layouts supporting up to 16 streams.",
    icon: () => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  {
    title: "Perfect Aspect Ratio",
    description: "Maintain crystal clear 16:9 aspect ratio across all video streams.",
    icon: () => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    title: "Synchronized Playback",
    description: "Keep all streams in perfect sync with master controls.",
    icon: () => (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
      </svg>
    )
  }
];

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const updateScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', updateScroll);
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  return (
    <div className="min-h-screen relative bg-black">
      {/* Hero Section with Background Image */}
      <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url("/images/background2.jpeg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.6)',
            zIndex: 0
          }}
        />
        
        {/* Navigation Header */}
        <nav 
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled ? 'bg-black/60 backdrop-blur-lg' : 'bg-transparent'
          }`}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="text-xl font-bold text-white hover:text-gray-200 transition-colors">
                Multiview
              </Link>
              <div className="flex gap-8">
                <a href="#features" className="nav-link text-gray-200 hover:text-white transition-colors">Features</a>
                <a href="#contact" className="nav-link text-gray-200 hover:text-white transition-colors">Contact</a>
                <a href="#support" className="nav-link text-gray-200 hover:text-white transition-colors">Support</a>
                <a href="#privacy" className="nav-link text-gray-200 hover:text-white transition-colors">Privacy</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 h-full">
          <header className="container mx-auto px-4 h-full flex items-center">
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1 
                className="text-7xl font-bold mb-8 text-white"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                Understand news like never before with AI
              </motion.h1>
              
              <motion.p 
                className="text-2xl text-white mb-12 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Monitor multiple live feeds simultaneously with our professional-grade streaming platform
              </motion.p>

              <motion.div 
                className="flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Link to="/app" className="cta-button">
                  Try for Free
                  <ArrowRightIcon className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>
          </header>
        </div>
      </div>

      {/* Rest of the content with black background */}
      <div className="bg-black">
        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-16">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                index={index}
              />
            ))}
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-16">Get in Touch</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Contact Us</h3>
              <p className="text-gray-300">If you have any questions or need help with our platform, please don't hesitate to contact us.</p>
              <a href="#" className="text-gray-200 hover:text-white transition-colors">Contact Us</a>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Address</h3>
              <p className="text-gray-300">123 Main St, Anytown, USA 12345</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Phone</h3>
              <p className="text-gray-300">+1 (555) 555-5555</p>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section id="support" className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-16">Support</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Documentation</h3>
              <p className="text-gray-300">Find answers to frequently asked questions and learn how to use our platform.</p>
              <a href="#" className="text-gray-200 hover:text-white transition-colors">Documentation</a>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Contact Support</h3>
              <p className="text-gray-300">If you need help with our platform, please don't hesitate to contact us.</p>
              <a href="#" className="text-gray-200 hover:text-white transition-colors">Contact Support</a>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Status</h3>
              <p className="text-gray-300">Check the status of our platform and any scheduled maintenance.</p>
              <a href="#" className="text-gray-200 hover:text-white transition-colors">Status</a>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section id="privacy" className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-16">Privacy Policy</h2>
          <div className="space-y-4">
            <p className="text-gray-300">We take your privacy seriously and are committed to protecting your personal data.</p>
            <a href="#" className="text-gray-200 hover:text-white transition-colors">Read our Privacy Policy</a>
          </div>
        </section>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-md bg-black/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                2024 Multiview. All rights reserved.
              </div>
              <div className="flex gap-6">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;