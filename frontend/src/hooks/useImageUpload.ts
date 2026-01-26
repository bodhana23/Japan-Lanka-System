import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  downloadUrl?: string;
}

export interface UseImageUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  storagePath?: string;
}

export interface UseImageUploadReturn {
  uploadState: UploadProgress;
  uploadImage: (file: File, productId?: string) => Promise<string | null>;
  validateFile: (file: File) => { valid: boolean; error?: string };
  resetUpload: () => void;
}

/**
 * Custom hook for uploading images to Firebase Storage
 *
 * @param options - Configuration options
 * @returns Upload state and functions
 */
export const useImageUpload = (options?: UseImageUploadOptions): UseImageUploadReturn => {
  const maxSize = (options?.maxSizeMB ?? 5) * 1024 * 1024;
  const allowedTypes = options?.allowedTypes ?? ALLOWED_TYPES;
  const basePath = options?.storagePath ?? 'products';

  const [uploadState, setUploadState] = useState<UploadProgress>({
    progress: 0,
    status: 'idle',
  });

  /**
   * Validate file type and size
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (!allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`,
        };
      }

      if (file.size > maxSize) {
        return {
          valid: false,
          error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
        };
      }

      return { valid: true };
    },
    [allowedTypes, maxSize]
  );

  /**
   * Generate a UUID v4
   */
  const generateUUID = (): string => {
    return crypto.randomUUID();
  };

  /**
   * Generate a unique filename with UUID
   */
  const generateUniqueFileName = (originalName: string): string => {
    const uuid = generateUUID();
    const extension = originalName.split('.').pop()?.toLowerCase();
    return `${uuid}.${extension}`;
  };

  /**
   * Upload image to Firebase Storage
   *
   * @param file - File to upload
   * @param productId - Optional product ID for organized storage path
   * @returns Download URL or null if upload failed
   */
  const uploadImage = useCallback(
    async (file: File, productId?: string): Promise<string | null> => {
      // Validate file first
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadState({
          progress: 0,
          status: 'error',
          error: validation.error,
        });
        return null;
      }

      // Generate unique filename and storage path
      const uniqueFileName = generateUniqueFileName(file.name);
      const storagePath = productId
        ? `${basePath}/${productId}/${uniqueFileName}`
        : `${basePath}/${uniqueFileName}`;

      const storageRef = ref(storage, storagePath);

      return new Promise((resolve) => {
        setUploadState({
          progress: 0,
          status: 'uploading',
        });

        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadState({
              progress,
              status: 'uploading',
            });
          },
          (error) => {
            console.error('Upload error:', error);
            setUploadState({
              progress: 0,
              status: 'error',
              error: error.message || 'Upload failed',
            });
            resolve(null);
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              setUploadState({
                progress: 100,
                status: 'success',
                downloadUrl,
              });
              resolve(downloadUrl);
            } catch (error) {
              console.error('Error getting download URL:', error);
              setUploadState({
                progress: 0,
                status: 'error',
                error: 'Failed to get download URL',
              });
              resolve(null);
            }
          }
        );
      });
    },
    [basePath, validateFile]
  );

  /**
   * Reset upload state
   */
  const resetUpload = useCallback(() => {
    setUploadState({
      progress: 0,
      status: 'idle',
    });
  }, []);

  return {
    uploadState,
    uploadImage,
    validateFile,
    resetUpload,
  };
};

export default useImageUpload;
