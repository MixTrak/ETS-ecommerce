"use client";

import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { PlusCircle, Trash2, Edit, Search, Upload, X } from "lucide-react";
import { productInputSchema, ProductInput, ProductWithId } from "@/lib/validations";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function ProductManager() {
  const [products, setProducts] = useState<ProductWithId[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductWithId | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { admin, adminLoading } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "0",
      category: "smartphones",
      tags: "",
      stockQuantity: "0",
      featured: false,
      image: "",
      imagePublicId: "",
    },
  });

  // Redirect if not authenticated as admin
  useEffect(() => {
    if (!adminLoading && !admin) {
      router.push('/admin/login');
    }
  }, [admin, adminLoading, router]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error(error);
        toast.error("Error loading products");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Don't render if still loading or not authenticated
  if (adminLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin) {
    return null; // Will redirect to login
  }

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, WebP)');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  // Create / Update product
  const onSubmit: SubmitHandler<ProductInput> = async (data) => {
    try {
      setIsSubmitting(true);
      
      // For new products, image is required
      if (!editingProduct && !selectedImage) {
        toast.error("Please select an image for the product");
        return;
      }

      // For updates, if no new image is selected, keep the existing one
      if (editingProduct && !selectedImage && !imagePreview) {
        toast.error("Please select an image for the product");
        return;
      }

      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price);
      formData.append('category', data.category);
      formData.append('tags', data.tags || '');
      formData.append('featured', data.featured?.toString() || 'false');
      formData.append('stockQuantity', data.stockQuantity);

      // Add image if selected
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const url = editingProduct
        ? `/api/products/${editingProduct._id}`
        : "/api/products/create";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData,
        credentials: 'include', // Include cookies for admin authentication
      });

      if (!res.ok) {
        let errorMessage = "Failed to save product";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If we can't parse the error response, use the status text
          errorMessage = res.statusText || errorMessage;
        }
        
        // Handle specific error cases
        if (res.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (res.status === 403) {
          errorMessage = "Insufficient permissions to perform this action.";
        } else if (res.status === 400) {
          errorMessage = errorMessage || "Invalid input data. Please check your form.";
        }
        
        throw new Error(errorMessage);
      }

      toast.success(
        editingProduct
          ? "Product updated successfully"
          : "Product created successfully"
      );

      // Reset form and image state
      reset();
      setEditingProduct(null);
      setSelectedImage(null);
      setImagePreview("");

      // Refresh product list
      const updatedProducts = await fetch("/api/products").then((r) =>
        r.json()
      );
      setProducts(updatedProducts.products || []);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error saving product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit handler
  const handleEdit = (product: ProductWithId) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : product.tags,
      stockQuantity: product.stockQuantity.toString(),
      featured: product.featured,
      image: product.image || '',
      imagePublicId: product.imagePublicId || '',
    });
    
    // Set existing image preview
    if (product.image) {
      setImagePreview(product.image);
      setSelectedImage(null); // No new image selected yet
    } else {
      setImagePreview("");
      setSelectedImage(null);
    }
  };

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");

      toast.success("Product deleted");
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (error) {
      console.error(error);
      toast.error("Error deleting product");
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search products..."
          className="border rounded p-2 flex-1 text-sm sm:text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products list */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            {searchTerm ? "No products found matching your search." : "No products available."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredProducts.map((product) => (
          <div
            key={product._id}
            className="border rounded-lg shadow p-3 sm:p-4 flex flex-col"
          >
            {/* Product Image */}
            {product.image && (
              <div className="mb-3">
                <Image
                  src={product.image}
                  alt={product.name}
                  width={400}
                  height={128}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            )}
            
            <h3 className="font-semibold text-sm sm:text-base">{product.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{product.description}</p>
            <p className="mt-2 font-bold text-sm sm:text-base">${product.price.toFixed(2)}</p>
            <div className="mt-auto flex justify-between items-center pt-3 sm:pt-4">
              <button
                onClick={() => handleEdit(product)}
                className="text-blue-600 hover:underline flex items-center gap-1 text-xs sm:text-sm"
              >
                <Edit size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Edit</span>
              </button>
              <button
                onClick={() => handleDelete(product._id!)}
                className="text-red-600 hover:underline flex items-center gap-1 text-xs sm:text-sm"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-3 sm:p-4 border rounded-lg shadow space-y-3 sm:space-y-4"
      >
        <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
          <PlusCircle />
          {editingProduct ? "Edit Product" : "Add Product"}
        </h2>

        {/* Name */}
        <div>
          <label className="block font-medium">Name</label>
          <input
            {...register("name")}
            className="border rounded p-2 w-full"
            placeholder="Product name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block font-medium">Description</label>
          <textarea
            {...register("description")}
            className="border rounded p-2 w-full"
            placeholder="Product description"
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block font-medium">Price</label>
          <input
            type="number"
            step="0.01"
            {...register("price")}
            className="border rounded p-2 w-full"
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-red-500 text-sm">{errors.price.message}</p>
          )}
        </div>

        {/* Stock */}
        <div>
          <label className="block font-medium">Stock Quantity</label>
          <input
            type="number"
            {...register("stockQuantity")}
            className="border rounded p-2 w-full"
            placeholder="0"
          />
          {errors.stockQuantity && (
            <p className="text-red-500 text-sm">
              {errors.stockQuantity.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block font-medium">Category</label>
          <select {...register("category")} className="border rounded p-2 w-full">
          <option value="smartphones">Smartphones</option>
          <option value="laptops">Laptops</option>
          <option value="tablets">Tablets</option>
          <option value="televisions">Televisions</option>
          <option value="headphones">Headphones</option>
          <option value="smartwatches">Smartwatches</option>
          <option value="cameras">Cameras</option>
          <option value="gaming-consoles">Gaming Consoles</option>
          <option value="drones">Drones</option>
          <option value="home-audio">Home Audio</option>
          <option value="printers">Printers</option>
          <option value="monitors">Monitors</option>
          <option value="networking">Networking Equipment</option>
          <option value="storage">External Storage</option>
          <option value="accessories">Accessories</option>
          <option value="smart-home">Smart Home</option>
          <option value="audio-video">Audio & Video</option>
          <option value="computing">Computing</option>
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm">{errors.category.message}</p>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block font-medium">Tags (comma separated)</label>
          <input
            {...register("tags")}
            className="border rounded p-2 w-full"
            placeholder="Fast Deliver, Premium Quality, etc."
          />
          {errors.tags && (
            <p className="text-red-500 text-sm">{errors.tags.message}</p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block font-medium">Product Image</label>
          <div className="space-y-3">
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative inline-block">
                <Image
                  src={imagePreview}
                  alt="Product preview"
                  width={128}
                  height={128}
                  className="w-32 h-32 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            {/* File Input */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer"
              >
                <Upload size={16} />
                {imagePreview ? "Change Image" : "Select Image"}
              </label>
              {!imagePreview && (
                <span className="text-sm text-gray-500">
                  JPEG, PNG, WebP up to 5MB
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Featured */}
        <div className="flex items-center gap-2">
          <input type="checkbox" {...register("featured")} />
          <span>Featured product</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {editingProduct ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              {editingProduct ? "Update Product" : "Add Product"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
