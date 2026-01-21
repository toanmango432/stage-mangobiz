/**
 * Portfolio Storage Service
 * Handles image upload to Supabase Storage for portfolio items
 */

import { supabase } from '../client';

const BUCKET_NAME = 'portfolio';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const portfolioStorage = {
  /**
   * Upload a portfolio image
   * @param staffId - The staff member's ID
   * @param file - The image file to upload
   * @returns Public URL of the uploaded image
   */
  async uploadPortfolioImage(staffId: string, file: File): Promise<string> {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}`);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Generate unique file path
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${staffId}/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  /**
   * Upload a before/after image pair
   * @param staffId - The staff member's ID
   * @param beforeFile - The before image file
   * @param afterFile - The after image file
   * @returns Object with both public URLs
   */
  async uploadBeforeAfterImages(
    staffId: string,
    beforeFile: File,
    afterFile: File
  ): Promise<{ beforeUrl: string; afterUrl: string }> {
    const [beforeUrl, afterUrl] = await Promise.all([
      this.uploadPortfolioImage(staffId, beforeFile),
      this.uploadPortfolioImage(staffId, afterFile),
    ]);

    return { beforeUrl, afterUrl };
  },

  /**
   * Delete a portfolio image
   * @param imageUrl - The public URL of the image to delete
   */
  async deletePortfolioImage(imageUrl: string): Promise<void> {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET_NAME}/`);

    if (pathParts.length < 2) {
      throw new Error('Invalid image URL format');
    }

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  },

  /**
   * List all portfolio images for a staff member
   * @param staffId - The staff member's ID
   * @returns Array of file names
   */
  async listStaffImages(staffId: string): Promise<string[]> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(staffId);

    if (error) {
      throw new Error(`Failed to list images: ${error.message}`);
    }

    return data?.map((file) => file.name) || [];
  },

  /**
   * Get a signed URL for temporary access (useful for private buckets)
   * @param filePath - Path to the file in storage
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },
};
