import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description: string;
  category: string;
  tags: string[];
  image?: string; // Firebase Storage URL - optional for updates
  imagePublicId?: string; // Firebase Storage path
  featured: boolean;
  createdBy: mongoose.Types.ObjectId; // Admin who created the product
  isActive: boolean;
  stockQuantity?: number;
  sku?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    image: {
      type: String,
      required: function(this: IProduct) {
        // Image is required for new documents, optional for updates
        return this.isNew;
      },
    },
    imagePublicId: {
      type: String,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ tags: 1, isActive: 1 });
ProductSchema.index({ featured: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Corrected Pre-save middleware to generate SKU if not provided
ProductSchema.pre<IProduct>('save', function(next) {
  if (!this.sku && this.isNew) {
    const categoryPrefix = this.category.substring(0, 3).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.sku = `${categoryPrefix}-${randomSuffix}`;
  }
  next();
});

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);