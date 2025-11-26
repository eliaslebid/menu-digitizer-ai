import { MenuProcessingResult } from '@menu-ai/shared-types';
import { useCallback, useState } from 'react';
import './App.css';

type ProcessingStage =
  | 'uploading'
  | 'ocr'
  | 'cleaning'
  | 'parsing'
  | 'classifying'
  | 'done';

const STAGE_LABELS: Record<ProcessingStage, string> = {
  uploading: 'Uploading images...',
  ocr: 'Extracting text from images...',
  cleaning: 'Cleaning text with AI...',
  parsing: 'Parsing menu items...',
  classifying: 'Classifying dishes...',
  done: 'Complete!'
};

function App() {
  const [results, setResults] = useState<MenuProcessingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ProcessingStage>('uploading');
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Array<{ url: string, name: string, type: string }>>([]);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const fileData = files.map(f => ({
      url: URL.createObjectURL(f),
      name: f.name,
      type: f.type
    }));
    setPreviews(fileData);

    setLoading(true);
    setError(null);
    setResults(null);
    setDebugInfo(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      setStage('uploading');

      // Simulated progress tracking
      setTimeout(() => setStage('ocr'), 500);

      const response = await fetch('http://localhost:3000/process-menu', {
        method: 'POST',
        body: formData,
      });

      setStage('cleaning');
      await new Promise(resolve => setTimeout(resolve, 300));

      setStage('parsing');
      await new Promise(resolve => setTimeout(resolve, 300));

      setStage('classifying');

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      setStage('done');
      setResults(data);

      if (data.debug_text || data.debug_items) {
        setDebugInfo({
          ocr_raw: data.debug_text,
          ocr_cleaned: data.debug_cleaned_text,
          parsed_items: data.debug_items
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = () => {
    setResults(null);
    setPreviews([]);
    setError(null);
    setDebugInfo(null);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Menu AI Analyzer</h1>
        <p>Upload restaurant menu photos to identify vegetarian dishes</p>
      </header>

      <main className="main">
        {!previews.length ? (
          <div className="upload-block">
            <label htmlFor="file-input" className="upload-label">
              <div className="upload-icon">↑</div>
              <div className="upload-text">
                <strong>Drop images here</strong>
                <span>or click to browse</span>
              </div>
              <div className="upload-meta">JPG, PNG, HEIC · Up to 5 files</div>
            </label>
            <input
              id="file-input"
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              max={5}
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <>
            <div className="preview-block">
              <div className="block-header">
                <span>Uploaded Images</span>
                <button onClick={handleReset} className="btn-reset">Clear</button>
              </div>
              <div className="preview-grid">
                {previews.map((file, i) => {
                  const isHEIC = file.name.toLowerCase().endsWith('.heic') ||
                    file.name.toLowerCase().endsWith('.heif');

                  return (
                    <div key={i} className="preview-image">
                      {isHEIC ? (
                        <div className="heic-placeholder">
                          <div className="heic-icon">📷</div>
                          <div className="heic-name">{file.name}</div>
                        </div>
                      ) : (
                        <img src={file.url} alt={`Menu ${i + 1}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {loading && (
              <div className="progress-block">
                <div className="progress-stages">
                  {(['uploading', 'ocr', 'cleaning', 'parsing', 'classifying'] as ProcessingStage[]).map((s, idx) => (
                    <div
                      key={s}
                      className={`stage ${stage === s ? 'active' : ''} ${['uploading', 'ocr', 'cleaning', 'parsing', 'classifying'].indexOf(stage) > idx ? 'done' : ''
                        }`}
                    >
                      <div className="stage-dot" />
                      <div className="stage-label">{STAGE_LABELS[s]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="error-block">
                <strong>Error:</strong> {error}
              </div>
            )}

            {debugInfo && (
              <details className="debug-block">
                <summary>Debug Info (OCR & Parsing)</summary>
                <div className="debug-content">
                  {debugInfo.ocr_raw && (
                    <div className="debug-section">
                      <h4>Raw OCR Text:</h4>
                      <pre>{debugInfo.ocr_raw}</pre>
                    </div>
                  )}
                  {debugInfo.ocr_cleaned && (
                    <div className="debug-section">
                      <h4>✨ LLM-Cleaned Text:</h4>
                      <pre>{debugInfo.ocr_cleaned}</pre>
                    </div>
                  )}
                  {debugInfo.parsed_items && (
                    <div className="debug-section">
                      <h4>Parsed Items:</h4>
                      <pre>{JSON.stringify(debugInfo.parsed_items, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {results && (
              <div className="results-block">
                <div className="block-header">
                  <span>Vegetarian Items ({results.vegetarian_items.length})</span>
                  <span className="total">${results.total_sum.toFixed(2)}</span>
                </div>

                {results.vegetarian_items.length === 0 ? (
                  <div className="empty">No vegetarian items detected</div>
                ) : (
                  <div className="items-list">
                    {results.vegetarian_items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <div className="item-main">
                          <div className="item-name">{item.name}</div>
                          {item.description && (
                            <div className="item-desc">{item.description}</div>
                          )}
                        </div>
                        <div className="item-price">${item.price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
