'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';
import Chatbot from '@/components/Chatbot';
import UserAvatar from '@/components/UserAvatar';

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

  useEffect(() => {
    fetchFeaturedProducts();
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
      <nav className="navbar bg-base-200 shadow-lg">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
            KKG E-Commerce
          </Link>
        </div>
        
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><Link href="/products" className="btn btn-ghost">Products</Link></li>
            <li><Link href="/search" className="btn btn-ghost">Search</Link></li>
            <li><Link href="/contact" className="btn btn-ghost">Contact</Link></li>
          </ul>
        </div>

        <div className="navbar-end">
          {currentUser ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <UserAvatar user={currentUser} size="md" />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li className="menu-title">
                  <span className="text-sm opacity-70">{currentUser.fullName}</span>
                </li>
                <li><button onClick={logoutUser} className="text-error">Logout</button></li>
              </ul>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="btn btn-outline btn-sm hover:scale-105 transition-transform duration-300">Login</Link>
              <Link href="/signup" className="btn btn-outline btn-sm hover:scale-105 transition-transform duration-300">Sign Up</Link>
            </div>
          )}
          
          {/* Mobile menu */}
          <div className="dropdown dropdown-end lg:hidden">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/search">Search</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              {!currentUser && (
                <>
                  <li><Link href="/login">Login</Link></li>
                  <li><Link href="/signup">Sign Up</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero min-h-[60vh] bg-gradient-to-r from-primary to-secondary">
        <div className="hero-content text-center text-primary-content">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-8">Welcome to KKG E-Commerce</h1>
            <p className="text-xl mb-8">
              Discover the best products at unbeatable prices. Shop with confidence and enjoy a seamless online shopping experience.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/products" className="btn btn-primary btn-lg hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
                Browse Products
              </Link>
              <Link href="/contact" className="btn btn-secondary btn-lg hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="py-16 bg-base-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Explore our handpicked selection of premium products, carefully curated for quality and innovation.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <div key={product._id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                  <figure className="px-6 pt-6">
                    <Image
                      src={product.image || '/placeholder-image.svg'}
                      alt={product.name}
                      width={300}
                      height={200}
                      className="rounded-xl object-cover w-full h-48"
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
                        <Link
                          href={`https://wa.me/2250787942288?text=I&apos;m interested in ${encodeURIComponent(product.name)} priced at $${product.price.toFixed(2)}. Can we discuss the details?`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-success btn-sm gap-2 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </Link>
                        <Link href={`/products/${product._id}`} className="btn btn-primary btn-sm hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2">No Featured Products</h3>
                <p className="text-base-content/70 mb-4">We&apos;re currently updating our featured selection.</p>
                <Link href="/products" className="btn btn-primary">
                  Browse All Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-16 bg-base-200">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
              Have questions? Contact our owner directly via WhatsApp for personalized assistance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="avatar placeholder mb-4">
                </div>
                <h3 className="card-title justify-center text-xl">Côte d&apos;Ivoire</h3>
                <p className="text-2xl font-bold">+225 07 87 94 22 88</p>
                <div className="card-actions justify-center mt-4">
                  <Link
                    href="https://wa.me/2250787942288?text=Hello, I&apos;m interested in your products"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success gap-2 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp CI
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="avatar placeholder mb-4">
                </div>
                <h3 className="card-title justify-center text-xl">India</h3>
                <p className="text-2xl font-bold">+91 99018 84675</p>
                <div className="card-actions justify-center mt-4">
                  <Link
                    href="https://wa.me/919901884675?text=Hello, I&apos;m interested in your products"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success gap-2 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp IN
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-300 text-base-content">
        <div className="max-w-4xl mx-auto">
          <aside className="text-center">
            <div className="avatar placeholder mb-4">
              <div className="bg-primary text-primary-content rounded-full w-16">
                <span className="text-2xl font-bold">K</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-2">KKG E-Commerce</h2>
            <p className="text-lg font-semibold mb-2">
              Kouassi Kouadio Guillaume
            </p>
            <p className="text-base-content/70 mb-4">
              Your trusted e-commerce partner since 2025
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/products" className="btn btn-ghost btn-sm hover:scale-105 transition-transform duration-300">Products</Link>
              <Link href="/contact" className="btn btn-ghost btn-sm hover:scale-105 transition-transform duration-300">Contact</Link>
              <Link href="/search" className="btn btn-ghost btn-sm hover:scale-105 transition-transform duration-300">Search</Link>
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
