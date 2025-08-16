import { GridFSService, ImageUploadResult } from './gridfsService';

// Corrected re-export using 'export type'
export type { ImageUploadResult } from './gridfsService';

export class ImageService {
  /**
   * Upload product image using GridFS
   */
  static async uploadProductImage(file: File): Promise<ImageUploadResult> {
    return await GridFSService.uploadProductImage(file);
  }

  /**
   * Delete image using GridFS
   */
  static async deleteImage(fileId: string): Promise<void> {
    await GridFSService.deleteImage(fileId);
  }

  /**
   * Generates a secure filename
   */
  static generateSecureFilename(originalName: string): string {
    return GridFSService.generateSecureFilename(originalName);
  }

  /**
   * Validate image file
   */
  static validateImage(file: File): void {
    GridFSService.validateImage(file);
  }
}