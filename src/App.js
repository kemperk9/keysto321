import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const MUSIC_OPTIONS = [
  {
    id: 'dreamscape',
    label: 'Dreamscape Piano',
    url: 'https://cdn.pixabay.com/audio/2024/03/14/audio_9f0cfa9f74.mp3',
    description: 'Gentle piano and pads for a calm welcome.'
  },
  {
    id: 'soaring',
    label: 'Soaring Horizons',
    url: 'https://cdn.pixabay.com/audio/2023/06/26/audio_8ba4a8988c.mp3',
    description: 'Cinematic ambience with a touch of excitement.'
  },
  {
    id: 'lounge',
    label: 'Modern Lounge',
    url: 'https://cdn.pixabay.com/audio/2023/03/14/audio_1e0f61205f.mp3',
    description: 'Upbeat lounge groove to energise the tour.'
  }
];

const POSITIONS = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'middle-left', label: 'Middle Left' },
  { value: 'middle-center', label: 'Middle Center' },
  { value: 'middle-right', label: 'Middle Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' }
];

const DIRECTION_PRESETS = {
  'slow-pan-right': {
    label: 'Pan Right',
    style: {
      '--start-x': '-4%',
      '--start-y': '0%',
      '--end-x': '4%',
      '--end-y': '0%'
    }
  },
  'slow-pan-left': {
    label: 'Pan Left',
    style: {
      '--start-x': '4%',
      '--start-y': '0%',
      '--end-x': '-4%',
      '--end-y': '0%'
    }
  },
  'rise-up': {
    label: 'Rise Up',
    style: {
      '--start-x': '0%',
      '--start-y': '4%',
      '--end-x': '0%',
      '--end-y': '-4%'
    }
  },
  'glide-down': {
    label: 'Glide Down',
    style: {
      '--start-x': '0%',
      '--start-y': '-4%',
      '--end-x': '0%',
      '--end-y': '4%'
    }
  },
  'drift-diagonal': {
    label: 'Diagonal Drift',
    style: {
      '--start-x': '-3%',
      '--start-y': '-3%',
      '--end-x': '3%',
      '--end-y': '3%'
    }
  }
};

const randomDirection = () => {
  const keys = Object.keys(DIRECTION_PRESETS);
  return keys[Math.floor(Math.random() * keys.length)];
};

const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

function VirtualTourPreview({
  images,
  overlayText,
  textPosition,
  textColor,
  textBgColor,
  textSize,
  logo,
  logoPosition,
  logoSize,
  selectedMusic,
  slideDuration,
  zoomIntensity,
  autoAdvance,
  captions,
  accentColor,
  vignetteStrength,
  volume
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const frameRef = useRef(null);
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null);

  const hasImages = images.length > 0;
  const currentImage = images[currentIndex];

  const resetTimers = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      resetTimers();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return undefined;
    }

    if (!hasImages) {
      setIsPlaying(false);
      return undefined;
    }

    const audio = audioRef.current;
    if (audio) {
      audio.loop = true;
      audio.volume = Math.min(1, Math.max(0, volume));
      if (selectedMusic?.url) {
        if (audio.src !== selectedMusic.url) {
          audio.src = selectedMusic.url;
        }
        audio.play().catch(() => {
          // Autoplay might be blocked; remain paused.
          setIsPlaying(false);
        });
      }
    }

    if (autoAdvance && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((index) => (index + 1) % images.length);
      }, slideDuration);
    }

    const startTime = performance.now();
    const animate = (time) => {
      const elapsed = time - startTime;
      const ratio = Math.min(elapsed / slideDuration, 1);
      setProgress(ratio);
      if (ratio < 1 && isPlaying) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      resetTimers();
    };
  }, [isPlaying, slideDuration, autoAdvance, images, selectedMusic, volume, hasImages]);

  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
  }, [images]);

  useEffect(() => {
    setProgress(0);
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    if (isPlaying) {
      const startTime = performance.now();
      const animate = (time) => {
        const elapsed = time - startTime;
        const ratio = Math.min(elapsed / slideDuration, 1);
        setProgress(ratio);
        if (ratio < 1 && isPlaying) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };
      frameRef.current = requestAnimationFrame(animate);
    }
  }, [currentIndex, slideDuration, isPlaying]);

  useEffect(() => () => resetTimers(), []);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!hasImages) {
      return;
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handlePrev = () => {
    if (!hasImages) return;
    setCurrentIndex((index) => (index - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    if (!hasImages) return;
    setCurrentIndex((index) => (index + 1) % images.length);
  };

  const overlayPositionStyles = useMemo(() => positionToFlexStyles(textPosition), [textPosition]);
  const logoPositionStyles = useMemo(() => positionToFlexStyles(logoPosition), [logoPosition]);

  return (
    <div className="preview-card">
      <div className="preview-stage" style={{ '--accent-color': accentColor }}>
        <div className="preview-frame">
          {hasImages ? (
            images.map((image, index) => {
              const direction = DIRECTION_PRESETS[image.panDirection] || DIRECTION_PRESETS['slow-pan-right'];
              return (
                <div
                  key={image.id}
                  className={`tour-slide ${index === currentIndex ? 'active' : ''}`}
                  style={{
                    ...(direction?.style || {}),
                    '--slide-duration': `${slideDuration}ms`,
                    '--zoom-scale': zoomIntensity,
                    backgroundColor: '#000'
                  }}
                >
                  <img src={image.src} alt={image.name || 'Tour slide'} />
                  {captions?.[image.id] ? (
                    <div className="caption-ribbon" style={{ backgroundColor: accentColor }}>
                      {captions[image.id]}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <p>Add property photos to preview the virtual tour.</p>
            </div>
          )}

          {hasImages && overlayText && (
            <div
              className={`text-overlay ${overlayPositionStyles.containerClass}`}
              style={{ color: textColor }}
            >
              <div
                className="text-overlay-content"
                style={{
                  backgroundColor: textBgColor,
                  fontSize: `${textSize}px`
                }}
              >
                {overlayText}
              </div>
            </div>
          )}

          {hasImages && logo && (
            <div className={`logo-overlay ${logoPositionStyles.containerClass}`}>
              <img
                src={logo}
                alt="Logo overlay"
                style={{ width: logoSize, height: 'auto' }}
              />
            </div>
          )}

          {hasImages && vignetteStrength > 0 && (
            <div
              className="vignette-mask"
              style={{ '--vignette-strength': vignetteStrength }}
            />
          )}
        </div>

        <div className="preview-controls">
          <button onClick={handlePlay} disabled={isPlaying || !hasImages}>
            Play
          </button>
          <button onClick={handlePause} disabled={!isPlaying}>
            Pause
          </button>
          <button onClick={handlePrev} disabled={!hasImages}>
            Prev
          </button>
          <button onClick={handleNext} disabled={!hasImages}>
            Next
          </button>
        </div>

        <div className="progress-track">
          <div
            className="progress-bar"
            style={{ width: `${progress * 100}%`, backgroundColor: accentColor }}
          />
        </div>
      </div>

      <div className="preview-meta">
        {selectedMusic ? (
          <div className="music-meta">
            <strong>Now Playing:</strong> {selectedMusic.label}
            <p>{selectedMusic.description}</p>
          </div>
        ) : (
          <p>Add a soundtrack to elevate the experience.</p>
        )}
        <ul className="preview-tips">
          <li>Tip: use at least 6 photos for a cinematic flow.</li>
          <li>Adjust zoom intensity for dramatic reveals.</li>
          <li>Use the caption field on each image to call out key upgrades.</li>
        </ul>
      </div>
    </div>
  );
}

function positionToFlexStyles(position) {
  switch (position) {
    case 'top-left':
      return { containerClass: 'align-start align-top' };
    case 'top-center':
      return { containerClass: 'align-center align-top' };
    case 'top-right':
      return { containerClass: 'align-end align-top' };
    case 'middle-left':
      return { containerClass: 'align-start align-middle' };
    case 'middle-center':
      return { containerClass: 'align-center align-middle' };
    case 'middle-right':
      return { containerClass: 'align-end align-middle' };
    case 'bottom-center':
      return { containerClass: 'align-center align-bottom' };
    case 'bottom-right':
      return { containerClass: 'align-end align-bottom' };
    case 'bottom-left':
    default:
      return { containerClass: 'align-start align-bottom' };
  }
}

function App() {
  const [images, setImages] = useState([]);
  const [overlayText, setOverlayText] = useState('Welcome to your next address');
  const [textPosition, setTextPosition] = useState('bottom-left');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBgColor, setTextBgColor] = useState('rgba(17, 24, 39, 0.65)');
  const [textSize, setTextSize] = useState(24);
  const [logo, setLogo] = useState(null);
  const [logoPosition, setLogoPosition] = useState('top-right');
  const [logoSize, setLogoSize] = useState(120);
  const [selectedMusicId, setSelectedMusicId] = useState(MUSIC_OPTIONS[0].id);
  const [slideDuration, setSlideDuration] = useState(6000);
  const [zoomIntensity, setZoomIntensity] = useState(1.15);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [accentColor, setAccentColor] = useState('#6366f1');
  const [captions, setCaptions] = useState({});
  const [vignetteStrength, setVignetteStrength] = useState(0.45);
  const [volume, setVolume] = useState(0.7);

  const selectedMusic = useMemo(
    () => MUSIC_OPTIONS.find((option) => option.id === selectedMusicId) || null,
    [selectedMusicId]
  );

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const processed = await Promise.all(
      files.map(async (file) => {
        const src = await readFileAsDataUrl(file);
        return {
          id: generateId(),
          src,
          name: file.name,
          panDirection: randomDirection()
        };
      })
    );

    setImages((prev) => [...prev, ...processed]);
    setCaptions((prev) => {
      const updated = { ...prev };
      processed.forEach((item) => {
        updated[item.id] = '';
      });
      return updated;
    });
    event.target.value = '';
  };

  const handleLogoUpload = async (event) => {
    const [file] = Array.from(event.target.files || []);
    if (!file) return;
    const src = await readFileAsDataUrl(file);
    setLogo(src);
    event.target.value = '';
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((image) => image.id !== id));
    setCaptions((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const moveImage = (index, direction) => {
    setImages((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) {
        return prev;
      }
      const [removed] = next.splice(index, 1);
      next.splice(targetIndex, 0, removed);
      return next;
    });
  };

  const updateCaption = (id, caption) => {
    setCaptions((prev) => ({
      ...prev,
      [id]: caption
    }));
  };

  const updateDirection = (id, panDirection) => {
    setImages((prev) =>
      prev.map((image) =>
        image.id === id
          ? {
              ...image,
              panDirection
            }
          : image
      )
    );
  };

  const exportStoryboard = () => {
    const payload = {
      createdAt: new Date().toISOString(),
      overlayText,
      textPosition,
      textColor,
      textBgColor,
      textSize,
      logoPosition,
      logoSize,
      selectedMusicId,
      slideDuration,
      zoomIntensity,
      autoAdvance,
      accentColor,
      vignetteStrength,
      images: images.map((image) => ({
        id: image.id,
        name: image.name,
        panDirection: image.panDirection,
        caption: captions[image.id]
      }))
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'virtual-tour-storyboard.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div>
          <h1>Showcase Studio</h1>
          <p>Create a cinematic virtual tour from your property photos with music, overlays, and motion.</p>
        </div>
        <button className="storyboard-button" onClick={exportStoryboard} disabled={!images.length}>
          Export Storyboard
        </button>
      </header>

      <main className="content">
        <section className="panel">
          <h2>1. Add Photos</h2>
          <label className="upload-tile">
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
            <span>Drop or select your listing photos</span>
            <small>PNG, JPG or HEIC supported</small>
          </label>

          {images.length > 0 && (
            <div className="image-list">
              {images.map((image, index) => (
                <div key={image.id} className="image-item">
                  <div className="thumb">
                    <img src={image.src} alt={image.name} />
                  </div>
                  <div className="image-meta">
                    <strong title={image.name}>{image.name || `Slide ${index + 1}`}</strong>
                    <div className="image-actions">
                      <button onClick={() => moveImage(index, -1)} disabled={index === 0}>
                        ↑
                      </button>
                      <button onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>
                        ↓
                      </button>
                      <button onClick={() => removeImage(image.id)} className="danger">
                        Remove
                      </button>
                    </div>
                    <label className="field">
                      <span>Motion</span>
                      <select
                        value={image.panDirection}
                        onChange={(event) => updateDirection(image.id, event.target.value)}
                      >
                        {Object.entries(DIRECTION_PRESETS).map(([value, preset]) => (
                          <option value={value} key={value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Caption</span>
                      <input
                        type="text"
                        placeholder="Highlight a feature (optional)"
                        value={captions[image.id] || ''}
                        onChange={(event) => updateCaption(image.id, event.target.value)}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <h2>2. Styling &amp; Branding</h2>
          <div className="form-grid">
            <label className="field span-2">
              <span>Headline Text</span>
              <textarea
                value={overlayText}
                onChange={(event) => setOverlayText(event.target.value)}
                placeholder="Type the message that should appear on the tour"
                rows={2}
              />
            </label>
            <label className="field">
              <span>Text Position</span>
              <select value={textPosition} onChange={(event) => setTextPosition(event.target.value)}>
                {POSITIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Text Size ({textSize}px)</span>
              <input
                type="range"
                min="14"
                max="48"
                value={textSize}
                onChange={(event) => setTextSize(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Text Color</span>
              <input type="color" value={textColor} onChange={(event) => setTextColor(event.target.value)} />
            </label>
            <label className="field">
              <span>Text Background</span>
              <input type="text" value={textBgColor} onChange={(event) => setTextBgColor(event.target.value)} />
              <small>Use rgba() for transparency</small>
            </label>
            <label className="field">
              <span>Accent Color</span>
              <input type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} />
            </label>
            <label className="field">
              <span>Overlay Logo</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} />
            </label>
            {logo && (
              <>
                <label className="field">
                  <span>Logo Position</span>
                  <select value={logoPosition} onChange={(event) => setLogoPosition(event.target.value)}>
                    {POSITIONS.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Logo Size ({logoSize}px)</span>
                  <input
                    type="range"
                    min="60"
                    max="240"
                    value={logoSize}
                    onChange={(event) => setLogoSize(Number(event.target.value))}
                  />
                </label>
              </>
            )}
          </div>
        </section>

        <section className="panel">
          <h2>3. Motion &amp; Audio</h2>
          <div className="form-grid">
            <label className="field">
              <span>Slide Duration ({Math.round(slideDuration / 1000)}s)</span>
              <input
                type="range"
                min="3000"
                max="12000"
                step="500"
                value={slideDuration}
                onChange={(event) => setSlideDuration(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Zoom Intensity ({zoomIntensity.toFixed(2)}x)</span>
              <input
                type="range"
                min="1.05"
                max="1.4"
                step="0.01"
                value={zoomIntensity}
                onChange={(event) => setZoomIntensity(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Vignette Strength</span>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.05"
                value={vignetteStrength}
                onChange={(event) => setVignetteStrength(Number(event.target.value))}
              />
            </label>
            <label className="field">
              <span>Auto Advance</span>
              <div className="toggle">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(event) => setAutoAdvance(event.target.checked)}
                />
                <span>{autoAdvance ? 'Enabled' : 'Manual mode'}</span>
              </div>
            </label>
            <label className="field span-2">
              <span>Soundtrack</span>
              <select value={selectedMusicId} onChange={(event) => setSelectedMusicId(event.target.value)}>
                {MUSIC_OPTIONS.map((option) => (
                  <option value={option.id} key={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <small>Curated royalty-free tracks hosted on Pixabay CDN.</small>
            </label>
            <label className="field">
              <span>Music Volume ({Math.round(volume * 100)}%)</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
              />
            </label>
          </div>
        </section>
      </main>

      <section className="preview-section">
        <VirtualTourPreview
          images={images}
          overlayText={overlayText}
          textPosition={textPosition}
          textColor={textColor}
          textBgColor={textBgColor}
          textSize={textSize}
          logo={logo}
          logoPosition={logoPosition}
          logoSize={logoSize}
          selectedMusic={selectedMusic}
          slideDuration={slideDuration}
          zoomIntensity={zoomIntensity}
          autoAdvance={autoAdvance}
          captions={captions}
          accentColor={accentColor}
          vignetteStrength={vignetteStrength}
          volume={volume}
        />
      </section>
    </div>
  );
}

export default App;
