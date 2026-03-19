import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adsApi, Advertisement } from '../services/api';
import './AdsCarousel.css';

const IMAGE_DURATION_MS = 3000;

const AdsCarousel: React.FC = () => {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await adsApi.getAds();
        setAds(response.items);
      } catch {
        // Silently fail — carousel simply doesn't render if ads cannot be loaded
      } finally {
        setIsLoading(false);
      }
    };
    fetchAds();
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
  }, [ads.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
  }, [ads.length]);

  const currentAd = ads[currentIndex] ?? null;
  const isCurrentVideo = currentAd?.media_type === 'video';

  // Auto-advance for images: 3s timer. Skipped when the current slide is a video
  // (videos advance via their own onEnded handler).
  useEffect(() => {
    if (ads.length <= 1 || isPaused || isCurrentVideo) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(goToNext, IMAGE_DURATION_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [ads.length, isPaused, isCurrentVideo, goToNext]);

  // When a video slide is shown, restart playback from the beginning so
  // onEnded fires reliably when the user navigates back to the same video.
  useEffect(() => {
    if (isCurrentVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // Autoplay blocked — advance after 3s as fallback
        intervalRef.current = setTimeout(goToNext, IMAGE_DURATION_MS) as unknown as ReturnType<typeof setInterval>;
      });
    }
  }, [currentIndex, isCurrentVideo, goToNext]);

  if (isLoading || ads.length === 0) return null;

  return (
    <section
      className="ads-carousel-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Promotional advertisements"
    >
      <div className="ads-carousel-wrapper">
        {/* Main slide */}
        <div className="ads-carousel-slide" key={currentAd.id}>
          {currentAd.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentAd.media_url}
              className="ads-carousel-media"
              autoPlay
              muted
              playsInline
              // No `loop` — we want onEnded to fire so we can advance to the next slide
              onEnded={() => {
                if (!isPaused) goToNext();
              }}
            />
          ) : (
            <img
              src={currentAd.media_url}
              alt={currentAd.title || 'Advertisement'}
              className="ads-carousel-media"
            />
          )}

          {/* Optional title overlay */}
          {currentAd.title && (
            <div className="ads-carousel-overlay">
              <span className="ads-carousel-title">{currentAd.title}</span>
            </div>
          )}
        </div>

        {/* Navigation arrows — only when more than one ad */}
        {ads.length > 1 && (
          <>
            <button
              className="ads-carousel-btn ads-carousel-btn--prev"
              onClick={goToPrev}
              aria-label="Previous advertisement"
            >
              &#8249;
            </button>
            <button
              className="ads-carousel-btn ads-carousel-btn--next"
              onClick={goToNext}
              aria-label="Next advertisement"
            >
              &#8250;
            </button>
          </>
        )}

        {/* Dot indicators — only when more than one ad */}
        {ads.length > 1 && (
          <div className="ads-carousel-dots" role="tablist" aria-label="Slide indicators">
            {ads.map((_, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={idx === currentIndex}
                aria-label={`Go to slide ${idx + 1}`}
                className={`ads-carousel-dot${idx === currentIndex ? ' ads-carousel-dot--active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdsCarousel;
