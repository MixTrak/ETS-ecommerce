"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { Filter, MessageCircle, Home } from "lucide-react";
import { useSearchParams } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";

interface Product {
  _id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
  image: string;
  featured?: boolean;
}

interface SearchFilters {
  query: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: string;
}

const SearchPageContent = () => {
  const searchParams = useSearchParams();
  const { firebaseUser, user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams?.get("query") || "",
    category: searchParams?.get("category") || "",
    minPrice: "",
    maxPrice: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [showFilters, setShowFilters] = useState(false);

  const currentUser =
    user ||
    (firebaseUser
      ? {
          id: firebaseUser.uid,
          fullName: firebaseUser.displayName || "User",
          email: firebaseUser.email || "",
          provider: "google" as const,
          avatar: firebaseUser.photoURL || "",
        }
      : null);

  useEffect(() => {
    searchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.page]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.query) queryParams.append("query", filters.query);
      if (filters.category) queryParams.append("category", filters.category);
      if (filters.minPrice) queryParams.append("minPrice", filters.minPrice);
      if (filters.maxPrice) queryParams.append("maxPrice", filters.maxPrice);
      queryParams.append("sortBy", filters.sortBy);
      queryParams.append("sortOrder", filters.sortOrder);
      queryParams.append("page", pagination.page.toString());
      queryParams.append("limit", pagination.limit.toString());

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      const data = await res.json();

      // Client-side enforcement: only match name OR tags (case-insensitive)
      const q = (filters.query || "").trim().toLowerCase();
      const fetched: Product[] = Array.isArray(data.products) ? data.products : [];
      const filtered = q
        ? fetched.filter((product) => {
            const nameMatch =
              typeof product.name === "string" &&
              product.name.toLowerCase().includes(q);
            const tagsMatch =
              Array.isArray(product.tags) &&
              product.tags.some((t) => String(t).toLowerCase().includes(q));
            return nameMatch || tagsMatch;
          })
        : fetched;

      setProducts(filtered);

      // keep backend pagination values but don't overwrite page/limit;
      // we spread data.pagination in case server provides helpful metadata
      setPagination((prev) => ({
        ...prev,
        ...data.pagination,
      }));
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Navbar */}
      <nav className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
            KKG E-Commerce
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            <li><Link href="/products">Products</Link></li>
            <li><Link href="/search" className="active">Search</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="navbar-end">
          {currentUser ? (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                <UserAvatar user={currentUser} size="lg" />
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 bg-base-100 border border-base-300">
                <li className="menu-title">
                  <span className="text-sm opacity-70">{currentUser.fullName}</span>
                </li>
                <li><Link href="/" className="flex items-center gap-2"><Home className="w-4 h-4" /> Go to Home</Link></li>
              </ul>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-1/4 ${showFilters ? "block" : "hidden lg:block"}`}>
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="card-title">Filters</h3>
                  <button onClick={clearFilters} className="btn btn-ghost btn-sm">
                    Clear All
                  </button>
                </div>

                {/* Search Query (icon removed) */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Search</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search products"
                      className="input input-bordered w-full"
                      value={filters.query}
                      onChange={(e) => handleFilterChange("query", e.target.value)}
                    />
                    {/* icon removed as requested */}
                  </div>
                </div>

                {/* Price Range */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Price Range</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="input input-bordered w-full"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="input input-bordered w-full"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                    />
                  </div>
                </div>

                {/* Sort Options */}
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Sort By</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split("-");
                      handleFilterChange("sortBy", sortBy);
                      handleFilterChange("sortOrder", sortOrder);
                    }}
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="lg:w-3/4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">
                  {filters.query ? `Search Results for "${filters.query}"` : "All Products"}
                </h1>
                <p className="text-base-content/60">{pagination.total} products found</p>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline lg:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <p className="text-lg font-semibold text-gray-600">Loading...</p>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product._id}
                      className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
                    >
                      <figure className="px-6 pt-6">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={300}
                          height={200}
                          className="rounded-xl object-cover h-48 w-full"
                        />
                      </figure>
                      <div className="card-body">
                        <h3 className="card-title text-lg">
                          {product.name}
                          {product.featured && (
                            <div className="badge badge-secondary">Featured</div>
                          )}
                        </h3>
                        <p className="text-sm text-base-content/70 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge badge-outline badge-sm">
                            {product.category}
                          </span>
                          {product.tags.slice(0, 1).map((tag) => (
                            <span key={tag} className="badge badge-outline badge-sm">
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="join">
                      <button
                        className="join-item btn"
                        disabled={!pagination.hasPrev}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                        }
                      >
                        «
                      </button>
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            className={`join-item btn ${
                              pagination.page === pageNum ? "btn-active" : ""
                            }`}
                            onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        className="join-item btn"
                        disabled={!pagination.hasNext}
                        onClick={() =>
                          setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                        }
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold mb-2">No products found</h3>
                <p className="text-base-content/60 mb-4">
                  Try adjusting your search criteria or browse all products.
                </p>
                <Link href="/products" className="btn btn-primary no-underline">
                  Browse All Products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SearchPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
};

export default SearchPage;
