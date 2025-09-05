'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import Chatbot from '@/components/Chatbot';
import UserAvatar from '@/components/UserAvatar';
import { Magnetic } from '@/components/cursor';
import { AnimatedElement, StaggerContainer } from '@/components/animations';
import { motion } from 'framer-motion';

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
  image: string;
  featured: boolean;
  sku: string;
}

const HomePage: React.FC = () => {
  const { user, firebaseUser, logoutUser } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch('/api/products?featured=true&limit=6');
      if (response.ok) {
        const data = await response.json();
        setFeaturedProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentUser = user || (firebaseUser ? {
    id: firebaseUser.uid,
    fullName: firebaseUser.displayName || 'User',
    email: firebaseUser.email || '',
    avatar: firebaseUser.photoURL || '',
    provider: 'google' as const
  } : null);

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navigation */}
      <nav className="navbar bg-base-200 shadow-lg sticky top-0 backdrop-blur-md bg-opacity-80 z-50 animate-fade-in">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold hover:scale-110 transition-transform duration-300" data-cursor="link">
          ETS Communication
          </Link>
        </div>
        
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><Link href="/products" className={`btn btn-ghost transition-colors duration-500 `} data-cursor="link">Products</Link></li>
            <li><Link href="/search" className={`btn btn-ghost transition-colors duration-500 `} data-cursor="link">Search</Link></li>
            <li><Link href="/contact" className={`btn btn-ghost transition-colors duration-500 `} data-cursor="link">Contact</Link></li>
          </ul>
        </div>

        <div className="navbar-end">
          {currentUser ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar" data-cursor="button">
                <UserAvatar user={currentUser} size="md" />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 animate-fade-in">
                <li className="menu-title">
                  <span className="text-sm opacity-70">{currentUser.fullName}</span>
                </li>
                <li><button onClick={logoutUser} className="text-error">Logout</button></li>
              </ul>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className={`btn btn-outline btn-sm hover:scale-110 transition-transform duration-300 ${scrolled ? 'bg-transparent border border-white text-white' : ''}`} data-cursor="button">Login</Link>
              <Link href="/signup" className={`btn btn-outline btn-sm hover:scale-110 transition-transform duration-300 ${scrolled ? 'bg-transparent border border-white text-white' : ''}`} data-cursor="button">Sign Up</Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero min-h-[60vh] bg-gradient-to-r from-blue-700 to-red-700 overflow-hidden relative">
        <div className="hero-content text-center text-primary-content">
          <motion.div 
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1 
              className="text-5xl font-bold mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              ETS Johnny Communication
            </motion.h1>
            <motion.p 
              className="text-xl mb-8 opacity-90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Phones, Laptops, Earbuds, and More, All at Unbeatable Prices!
            </motion.p>
            <motion.div 
              className="flex gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="py-16 bg-base-100">
        <div className="container mx-auto px-6">
          <AnimatedElement variant="fadeInUp" duration={0.8}>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
              <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                Explore our handpicked selection of premium products, carefully curated for quality and innovation.
              </p>
            </div>
          </AnimatedElement>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <motion.span 
                className="loading loading-spinner loading-lg"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            </div>
          ) : featuredProducts.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" staggerChildren={0.15}>
              {featuredProducts.map((product) => (
                <AnimatedElement key={product._id} variant="fadeInUp" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2" data-cursor="image">
                  <figure className="px-6 pt-6">
                    <Image
                      src={product.image || '/placeholder-image.svg'}
                      alt={product.name}
                      width={300}
                      height={200}
                      className="rounded-xl object-cover w-full h-48 transition-transform duration-500 hover:scale-105"
                    />
                  </figure>
                  <div className="card-body">
                    <h3 className="card-title text-lg font-bold line-clamp-2">{product.name}</h3>
                    <p className="text-base-content/70 line-clamp-2">{product.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="badge badge-outline badge-sm">{tag}</span>
                      ))}
                    </div>
                    <div className="card-actions justify-between items-center">
                      <span className="text-2xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                      <div className="flex gap-2">
                        <Magnetic>
                          <Link
                            href={`https://wa.me/2250787942288?text=I&apos;m interested in ${encodeURIComponent(product.name)} priced at $${product.price.toFixed(2)}. Can we discuss the details?`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-success btn-sm gap-2 shadow-lg hover:shadow-xl" data-cursor="button"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </Link>
                        </Magnetic>
                        <Magnetic>
                          <Link href={`/products/${product._id}`} className="btn btn-primary btn-sm shadow-lg hover:shadow-xl" data-cursor="button">
                            View Details
                          </Link>
                        </Magnetic>
                      </div>
                    </div>
                  </div>
                </AnimatedElement>
              ))}
            </StaggerContainer>
          ) : (
            <AnimatedElement variant="scale" className="text-center py-12">
              <motion.div 
                className="max-w-md mx-auto"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <motion.div 
                  className="text-6xl mb-4"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >📱</motion.div>
                <motion.h3 
                  className="text-xl font-semibold mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >No Featured Products</motion.h3>
                <motion.p 
                  className="text-base-content/70 mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >We&apos;re currently updating our featured selection.</motion.p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/products" className="btn btn-primary" data-cursor="button">
                    Browse All Products
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatedElement>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-blue-400 text-primary-content">
        <div className="container mx-auto px-6 text-center">
          <AnimatedElement variant="fadeInUp" duration={0.8}>
            <motion.h2 
              className="text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Ready to Explore?
            </motion.h2>
            <motion.p 
              className="text-xl mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Browse our extensive collection of high-quality products at competitive prices.
            </motion.p>
            <motion.div 
              className="flex justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Magnetic>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/products" className="btn btn-lg bg-white text-black hover:text-blue-400" data-cursor="button">
                    View Products
                  </Link>
                </motion.div>
              </Magnetic>
              <Magnetic>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/contact" className="btn btn-lg bg-white border-white text-black hover:text-blue-400" data-cursor="button">
                    Contact Us
                  </Link>
                </motion.div>
              </Magnetic>
            </motion.div>
          </AnimatedElement>
        </div>
      </div>
      
      {/* Contact Section */}
      <div className="py-16 bg-base-200">
        <div className="container mx-auto px-6">
          <AnimatedElement variant="fadeInUp" duration={0.8}>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
              <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                Have questions? Contact our owner directly via WhatsApp for personalized assistance.
              </p>
            </div>
          </AnimatedElement>
          
          <StaggerContainer className="grid grid-cols-1 md:grid-cols gap-8 max-w-4xl mx-auto" staggerChildren={0.15}>
            {[{
              region: "Côte d'Ivoire",
              phone: "+225 05 05 30 82 77",
              link: "https://wa.me/2250505308277?text=Hello, I&apos;m interested in your products",
              label: "WhatsApp CI"
            }].map((contact, i) => (
              <AnimatedElement key={i} variant="fadeInUp" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                <motion.div 
                  className="card-body text-center"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <motion.h3 
                    className="card-title justify-center text-xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    {contact.region}
                  </motion.h3>
                  <motion.p 
                    className="text-2xl font-bold"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {contact.phone}
                  </motion.p>
                  <motion.div 
                    className="card-actions justify-center mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Magnetic>
                      <Link
                        href={contact.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`btn btn-success gap-2 shadow-lg hover:shadow-xl transition-colors duration-500 ${scrolled ? 'bg-transparent' : ''}`} data-cursor="button"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {contact.label}
                      </Link>
                    </Magnetic>
                  </motion.div>
                </motion.div>
              </AnimatedElement>
            ))}
          </StaggerContainer>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-300 text-base-content animate-fade-in">
        <div className="max-w-4xl mx-auto">
          <aside className="text-center">
            <h2 className="text-3xl font-bold mb-2">ETS Johnny Communication</h2>
            <p className="text-base-content/70 mb-4">Your trusted e-commerce partner since 2025</p>
            <div className="flex gap-4 justify-center">
              <Link href="/products" className="btn btn-ghost btn-sm hover:scale-105 transition-transform duration-300" data-cursor="link">Products</Link>
              <Link href="/contact" className="btn btn-ghost btn-sm hover:scale-105 transition-transform duration-300" data-cursor="link">Contact</Link>
              <Link href="/search" className="btn btn-ghost btn-sm hover:scale-105 transition-transform duration-300" data-cursor="link">Search</Link>
            </div>
            <p className="text-sm text-base-content/50 mt-4">Copyright © 2025 - All rights reserved</p>
          </aside>
        </div>
      </footer>
      <Chatbot />
    </div>
  );
};

export default HomePage;