import React, { useRef, useState, useCallback } from 'react';
import { useImageUpload, UploadProgress } from '../hooks/useImageUpload';
import './ImageUpload.css';

export interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  productId?: string;
  existingImageUrl?: string;
  maxSizeMB?: number;
  disabled?: boolean;
}

/**
 * Reusable image upload component for product images
 * Uploads directly to Firebase Storage and returns the download URL
 */
const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onUploadError,
  productId,
  existingImageUrl,
  maxSizeMB = 5,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const [isDragging, setIsDragging] = useState(false);

  const { uploadState, uploadImage, validateFile, resetUpload } = useImageUpload({
    maxSizeMB,
    storagePath: 'products',
  });

  /**
   * Handle file selection
   */
  const handleFile = useCallback(
    async (file: File) => {
      // Validate before creating preview
      const validation = validateFile(file);
      if (!validation.valid) {
        onUploadError?.(validation.error || 'Invalid file');
        return;
      }

      // Create local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      const downloadUrl = await uploadImage(file, productId);

      if (downloadUrl) {
        onUploadComplete(downloadUrl);
      } else if (uploadState.error) {
        onUploadError?.(uploadState.error);
      }
    },
    [uploadImage, validateFile, onUploadComplete, onUploadError, productId, uploadState.error]
  );

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * Handle drag events
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  /**
   * Trigger file input click
   */
  const handleClick = () => {
    if (!disabled && uploadState.status !== 'uploading') {
      fileInputRef.current?.click();
    }
  };

  /**
   * Remove current image
   */
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    resetUpload();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUploadComplete('');
  };

  return (
    <div className="image-upload-container">
      <div
        className={`image-upload-dropzone ${isDragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''} ${uploadState.status === 'error' ? 'error' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleInputChange}
          disabled={disabled || uploadState.status === 'uploading'}
          className="image-upload-input"
        />

        {previewUrl ? (
          <div className="image-preview-container">
            <img src={previewUrl} alt="Preview" className="image-preview" />
            {uploadState.status !== 'uploading' && !disabled && (
              <button
                type="button"
                className="image-remove-btn"
                onClick={handleRemove}
                title="Remove image"
              >
                x
              </button>
            )}
          </div>
        ) : (
          <div className="image-upload-placeholder">
            <svg
              className="upload-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">
              {isDragging ? 'Drop image here' : 'Click or drag image to upload'}
            </p>
            <p className="upload-hint">JPEG, PNG, WebP, GIF (max {maxSizeMB}MB)</p>
          </div>
        )}

        {uploadState.status === 'uploading' && (
          <div className="upload-progress-overlay">
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
            <span className="upload-progress-text">
              {Math.round(uploadState.progress)}%
            </span>
          </div>
        )}
      </div>

      {uploadState.status === 'error' && uploadState.error && (
        <p className="upload-error-message">{uploadState.error}</p>
      )}

      {uploadState.status === 'success' && (
        <p className="upload-success-message">Image uploaded successfully</p>
      )}
    </div>
  );
};

export default ImageUpload;
