'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

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

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const id = params?.id as string;

  const fetchProductDetail = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/products/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      } else {
        router.push('/products');
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      router.push('/products');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (!id) {
      router.push('/products');
      return;
    }
    fetchProductDetail();
  }, [id, fetchProductDetail, router]);

  if (loading || !product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-shrink-0">
            <Image
              src={product.image}
              alt={product.name}
              width={500}
              height={400}
              className="rounded-xl object-cover"
            />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            {product.featured && <span className="badge badge-secondary mb-4">Featured</span>}
            <p className="text-lg mb-4">{product.description}</p>
            <div className="flex items-center gap-2 mb-4">
              {product.tags.map(tag => (
                <span key={tag} className="badge badge-outline">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary">
                ${product.price.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-4">
              <Link href="/products" className="btn btn-outline hover:scale-105 transition-transform duration-300 shadow-lg hover:shadow-xl">Back to Products</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

