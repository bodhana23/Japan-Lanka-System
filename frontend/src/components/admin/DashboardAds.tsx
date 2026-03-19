import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Megaphone,
  Upload,
  Link,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  ImageIcon,
  Video,
  X,
} from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { adsApi, Advertisement } from '../../services/api';
import './DashboardAds.css';

interface DashboardAdsProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type InputMode = 'url' | 'file';

const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
];
const MAX_FILE_SIZE_MB = 50;

/** Guess media type from a URL string by checking the extension. */
function guessMediaTypeFromUrl(url: string): 'image' | 'video' {
  const lower = url.split('?')[0].toLowerCase(); // strip query params
  if (lower.match(/\.(mp4|webm|mov|avi|mkv)$/)) return 'video';
  return 'image';
}

const DashboardAds: React.FC<DashboardAdsProps> = ({ onShowToast }) => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shared fields
  const [titleInput, setTitleInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Mode toggle
  const [inputMode, setInputMode] = useState<InputMode>('url');

  // URL mode state
  const [urlInput, setUrlInput] = useState('');
  const [urlMediaType, setUrlMediaType] = useState<'image' | 'video'>('image');

  // File upload mode state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Card actions
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAds = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adsApi.getAllAds();
      setAds(response.items);
    } catch {
      setError('Failed to load advertisements. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // ── URL mode: update guessed media type when URL changes ──────────────
  useEffect(() => {
    if (urlInput.trim()) {
      setUrlMediaType(guessMediaTypeFromUrl(urlInput.trim()));
    }
  }, [urlInput]);

  // ── File mode helpers ─────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      onShowToast('Unsupported file type. Use JPG, PNG, WebP, GIF, MP4, or WebM.', 'error');
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      onShowToast(`File too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`, 'error');
      return;
    }

    setSelectedFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
  };

  const clearFileSelection = () => {
    setSelectedFile(null);
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    setLocalPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const switchMode = (mode: InputMode) => {
    setInputMode(mode);
    // Clear the other mode's state
    if (mode === 'url') clearFileSelection();
    if (mode === 'file') setUrlInput('');
  };

  // ── Save via URL ──────────────────────────────────────────────────────
  const handleSaveUrl = async () => {
    const url = urlInput.trim();
    if (!url) {
      onShowToast('Please enter an image or video URL.', 'error');
      return;
    }
    // Basic URL validation
    try {
      new URL(url);
    } catch {
      onShowToast('The URL you entered is not valid. Please check and try again.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await adsApi.createAd({
        title: titleInput.trim() || undefined,
        media_url: url,
        media_type: urlMediaType,
        display_order: ads.length,
      });
      onShowToast('Advertisement added successfully.', 'success');
      setTitleInput('');
      setUrlInput('');
      fetchAds();
    } catch {
      onShowToast('Failed to save advertisement. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Save via file upload ──────────────────────────────────────────────
  const handleUploadFile = async () => {
    if (!selectedFile) {
      onShowToast('Please select a file first.', 'error');
      return;
    }

    setIsSaving(true);
    setUploadProgress(0);

    try {
      const mediaType: 'image' | 'video' = selectedFile.type.startsWith('video')
        ? 'video'
        : 'image';

      const storageRef = ref(storage, `advertisements/${Date.now()}_${selectedFile.name}`);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      const downloadUrl = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            setUploadProgress(
              Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            );
          },
          reject,
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      await adsApi.createAd({
        title: titleInput.trim() || undefined,
        media_url: downloadUrl,
        media_type: mediaType,
        display_order: ads.length,
      });

      onShowToast('Advertisement uploaded successfully.', 'success');
      setTitleInput('');
      clearFileSelection();
      fetchAds();
    } catch {
      onShowToast('Upload failed. Please check your connection and try again.', 'error');
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  // ── Card actions ──────────────────────────────────────────────────────
  const handleToggleActive = async (ad: Advertisement) => {
    setTogglingId(ad.id);
    try {
      await adsApi.updateAd(ad.id, { is_active: !ad.is_active });
      onShowToast(
        `"${ad.title || 'Advertisement'}" is now ${ad.is_active ? 'hidden' : 'visible'} on the home page.`,
        'success'
      );
      fetchAds();
    } catch {
      onShowToast('Failed to update advertisement visibility.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (ad: Advertisement) => {
    if (!window.confirm(`Delete "${ad.title || 'this advertisement'}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(ad.id);
    try {
      await adsApi.deleteAd(ad.id);
      onShowToast('Advertisement deleted successfully.', 'success');
      fetchAds();
    } catch {
      onShowToast('Failed to delete advertisement.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="admin-ads-container">
      {/* Header */}
      <div className="admin-ads-header">
        <div className="admin-ads-title-section">
          <h2 className="admin-ads-title">
            <Megaphone size={24} className="admin-ads-title-icon" />
            Advertisements
          </h2>
          <p className="admin-ads-subtitle">
            Add promotional images and videos to display in the home page carousel.
            Each ad auto-advances every 3 seconds.
          </p>
        </div>
        <button
          className="admin-ads-refresh-btn"
          onClick={fetchAds}
          disabled={isLoading}
          title="Refresh list"
        >
          <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {/* Add panel */}
      <div className="admin-ads-upload-panel">
        <h3 className="admin-ads-upload-heading">Add New Advertisement</h3>

        {/* Shared title field */}
        <input
          type="text"
          className="admin-ads-title-input admin-ads-title-input--full"
          placeholder="Ad title (optional)"
          value={titleInput}
          onChange={(e) => setTitleInput(e.target.value)}
          disabled={isSaving}
          maxLength={255}
        />

        {/* Mode tabs */}
        <div className="admin-ads-mode-tabs">
          <button
            className={`admin-ads-mode-tab${inputMode === 'url' ? ' active' : ''}`}
            onClick={() => switchMode('url')}
            type="button"
          >
            <Link size={15} />
            Paste URL
          </button>
          <button
            className={`admin-ads-mode-tab${inputMode === 'file' ? ' active' : ''}`}
            onClick={() => switchMode('file')}
            type="button"
          >
            <Upload size={15} />
            Upload File
          </button>
        </div>

        {/* ── URL mode ── */}
        {inputMode === 'url' && (
          <div className="admin-ads-url-section">
            <p className="admin-ads-mode-hint">
              Paste a direct link to an image or video (e.g. from Firebase Storage, Google Drive public link, or any hosted URL).
            </p>
            <div className="admin-ads-url-row">
              <input
                type="url"
                className="admin-ads-url-input"
                placeholder="https://example.com/banner.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isSaving}
              />
              {/* Media type selector — auto-detected but overridable */}
              <select
                className="admin-ads-media-type-select"
                value={urlMediaType}
                onChange={(e) => setUrlMediaType(e.target.value as 'image' | 'video')}
                disabled={isSaving}
                title="Media type"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              <button
                className="admin-ads-upload-btn"
                onClick={handleSaveUrl}
                disabled={!urlInput.trim() || isSaving}
              >
                {isSaving ? 'Saving…' : 'Add'}
              </button>
            </div>

            {/* URL preview */}
            {urlInput.trim() && (
              <div className="admin-ads-preview-wrapper">
                {urlMediaType === 'video' ? (
                  <video
                    src={urlInput.trim()}
                    className="admin-ads-preview-media"
                    controls
                    muted
                  />
                ) : (
                  <img
                    src={urlInput.trim()}
                    alt="Preview"
                    className="admin-ads-preview-media"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ── File upload mode ── */}
        {inputMode === 'file' && (
          <div className="admin-ads-file-section">
            <p className="admin-ads-mode-hint">
              Choose a file from your computer. It will be uploaded to Firebase Storage automatically.
            </p>
            <div className="admin-ads-upload-row">
              <label className="admin-ads-file-label" title="Choose an image or video file">
                <Upload size={15} />
                <span className="admin-ads-file-label-text">
                  {selectedFile ? selectedFile.name : 'Choose Image or Video'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                  onChange={handleFileChange}
                  disabled={isSaving}
                  className="admin-ads-file-input-hidden"
                />
              </label>

              {selectedFile && (
                <button
                  className="admin-ads-clear-btn"
                  onClick={clearFileSelection}
                  disabled={isSaving}
                  title="Remove selected file"
                >
                  <X size={15} />
                </button>
              )}

              <button
                className="admin-ads-upload-btn"
                onClick={handleUploadFile}
                disabled={!selectedFile || isSaving}
              >
                {isSaving ? `Uploading ${uploadProgress}%` : 'Upload'}
              </button>
            </div>

            {/* File preview */}
            {localPreviewUrl && selectedFile && (
              <div className="admin-ads-preview-wrapper">
                {selectedFile.type.startsWith('video') ? (
                  <video
                    src={localPreviewUrl}
                    className="admin-ads-preview-media"
                    controls
                    muted
                  />
                ) : (
                  <img
                    src={localPreviewUrl}
                    alt="Preview"
                    className="admin-ads-preview-media"
                  />
                )}
              </div>
            )}

            {/* Upload progress bar */}
            {isSaving && (
              <div className="admin-ads-progress-track">
                <div
                  className="admin-ads-progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <p className="admin-ads-upload-hint">
              Supported: JPG, PNG, WebP, GIF, MP4, WebM &mdash; max {MAX_FILE_SIZE_MB}MB
            </p>
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="admin-ads-error-banner">
          <span>{error}</span>
          <button onClick={fetchAds}>Retry</button>
        </div>
      )}

      {/* Ads grid */}
      {isLoading ? (
        <div className="admin-ads-loading">
          <div className="admin-ads-spinner" />
          <span>Loading advertisements...</span>
        </div>
      ) : ads.length === 0 ? (
        <div className="admin-ads-empty">
          <Megaphone size={52} className="admin-ads-empty-icon" />
          <p>No advertisements yet.</p>
          <p className="admin-ads-empty-hint">Add your first ad above.</p>
        </div>
      ) : (
        <>
          <p className="admin-ads-count">
            {ads.length} advertisement{ads.length !== 1 ? 's' : ''} &mdash;&nbsp;
            {ads.filter((a) => a.is_active).length} visible on home page
          </p>
          <div className="admin-ads-grid">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className={`admin-ads-card${!ad.is_active ? ' admin-ads-card--inactive' : ''}`}
              >
                {/* Thumbnail */}
                <div className="admin-ads-card-thumb">
                  {ad.media_type === 'video' ? (
                    <video
                      src={ad.media_url}
                      className="admin-ads-card-media"
                      muted
                    />
                  ) : (
                    <img
                      src={ad.media_url}
                      alt={ad.title || 'Advertisement'}
                      className="admin-ads-card-media"
                    />
                  )}
                  <span className="admin-ads-type-badge">
                    {ad.media_type === 'video' ? (
                      <Video size={11} />
                    ) : (
                      <ImageIcon size={11} />
                    )}
                    {ad.media_type}
                  </span>
                </div>

                {/* Card body */}
                <div className="admin-ads-card-body">
                  <p className="admin-ads-card-title">
                    {ad.title || <em>Untitled</em>}
                  </p>
                  <span
                    className={`admin-ads-status-badge${ad.is_active ? '' : ' admin-ads-status-badge--hidden'}`}
                  >
                    {ad.is_active ? 'Visible' : 'Hidden'}
                  </span>
                </div>

                {/* Actions */}
                <div className="admin-ads-card-actions">
                  <button
                    className="admin-ads-toggle-btn"
                    onClick={() => handleToggleActive(ad)}
                    disabled={togglingId === ad.id}
                    title={ad.is_active ? 'Hide from carousel' : 'Show in carousel'}
                  >
                    {ad.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    {togglingId === ad.id ? '...' : ad.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button
                    className="admin-ads-delete-btn"
                    onClick={() => handleDelete(ad)}
                    disabled={deletingId === ad.id}
                    title="Delete advertisement"
                  >
                    <Trash2 size={14} />
                    {deletingId === ad.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardAds;
