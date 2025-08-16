import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import connectDB from './mongo';

export interface ImageUploadResult {
  url: string;
  path: string;
  filename: string;
  fileId: string;
}

export class GridFSService {
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  private static readonly MAX_SIZE = 5 * 1024 * 1024; // 5MB

  /**
   * Validates image file
   */
  static validateImage(file: File): void {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    if (file.size > this.MAX_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }
  }

  /**
   * Get GridFS bucket
   */
  private static async getGridFSBucket(): Promise<GridFSBucket> {
    await connectDB();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    return new GridFSBucket(db, {
      bucketName: 'product_images'
    });
  }

  /**
   * Upload image to GridFS
   */
  static async uploadProductImage(file: File): Promise<ImageUploadResult> {
    this.validateImage(file);

    try {
      const gfs = await this.getGridFSBucket();
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}-${sanitizedName}`;
      
      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      return new Promise((resolve, reject) => {
        const uploadStream = gfs.openUploadStream(filename, {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadDate: new Date(),
            size: file.size
          }
        });

        uploadStream.on('error', (error) => {
          console.error('❌ GridFS upload error:', error);
          reject(new Error('Failed to upload image'));
        });

        uploadStream.on('finish', () => {
          console.log('✅ Image uploaded to GridFS:', filename);
          resolve({
            url: `/api/images/${uploadStream.id}`,
            path: uploadStream.id.toString(),
            filename: filename,
            fileId: uploadStream.id.toString()
          });
        });

        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error('❌ GridFS upload failed:', error);
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete image from GridFS
   */
  static async deleteImage(fileId: string): Promise<void> {
    if (!fileId) {
      return;
    }

    try {
      const gfs = await this.getGridFSBucket();
      await gfs.delete(new ObjectId(fileId));
      console.log('✅ Image deleted from GridFS:', fileId);
    } catch (error) {
      console.error('⚠️ Failed to delete image from GridFS:', fileId, error);
      // Don't throw error for delete failures - log and continue
    }
  }

  /**
   * Get image stream from GridFS
   */
  static async getImageStream(fileId: string) {
    try {
      const gfs = await this.getGridFSBucket();
      const downloadStream = gfs.openDownloadStream(new ObjectId(fileId));
      return downloadStream;
    } catch (error) {
      console.error('❌ Failed to get image stream:', fileId, error);
      throw new Error('Image not found');
    }
  }

  /**
   * Get image info from GridFS
   */
  static async getImageInfo(fileId: string) {
    try {
      const gfs = await this.getGridFSBucket();
      const files = await gfs.find({ _id: new ObjectId(fileId) }).toArray();
      return files[0] || null;
    } catch (error) {
      console.error('❌ Failed to get image info:', fileId, error);
      return null;
    }
  }

  /**
   * Generates a secure filename
   */
  static generateSecureFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${timestamp}-${randomSuffix}.${extension}`;
  }
}

