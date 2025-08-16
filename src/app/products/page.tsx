'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MessageCircle, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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

const AllProductsPage: React.FC = () => {
  const { firebaseUser, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUser =
    user ||
    (firebaseUser
      ? {
          id: firebaseUser.uid,
          fullName: firebaseUser.displayName || 'User',
          email: firebaseUser.email || '',
          provider: 'google' as const,
          avatar: firebaseUser.photoURL || '',
        }
      : null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Navbar */}
      <nav className="navbar bg-base-100 shadow-lg px-4">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
            KKG E-Commerce
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><Link href="/products" className="active">Products</Link></li>
            <li><Link href="/search">Search</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="navbar-end">
          {currentUser ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <UserAvatar user={currentUser} size="lg" />
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-300"
              >
                <li className="menu-title">
                  <span className="text-sm opacity-70">{currentUser.fullName}</span>
                </li>
                <li>
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="w-4 h-4" /> Go to Home
                  </Link>
                </li>
              </ul>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <div
                key={product._id}
                className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <figure className="px-6 pt-6">
                  <Image
                    src={product.image || '/placeholder-image.svg'}
                    alt={product.name}
                    width={300}
                    height={200}
                    className="rounded-xl object-cover h-48 w-full"
                  />
                </figure>
                <div className="card-body">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="card-title text-lg font-bold line-clamp-2 flex-1">
                      {product.name}
                    </h3>
                    {product.featured && (
                      <div className="badge badge-secondary badge-sm ml-2">Featured</div>
                    )}
                  </div>
                  <p className="text-base-content/70 line-clamp-2 mb-3">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    {product.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="badge badge-outline badge-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="card-actions justify-between items-center">
                    <span className="text-2xl font-bold text-primary">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        href={`https://wa.me/2250787942288?text=I'm interested in ${encodeURIComponent(
                          product.name
                        )} priced at $${product.price.toFixed(
                          2
                        )}. Can we discuss the details?`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-success btn-sm gap-2 hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Link>
                      <Link
                        href={`/products/${product._id}`}
                        className="btn btn-primary btn-sm hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl"
                      >
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
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
              <p className="text-base-content/70 mb-4">
                We&apos;re currently updating our product catalog.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AllProductsPage;
