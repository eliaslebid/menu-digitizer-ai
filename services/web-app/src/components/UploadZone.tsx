import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import './UploadZone.css';

interface UploadZoneProps {
    onUpload: (files: File[]) => void;
    loading: boolean;
}

export default function UploadZone({ onUpload, loading }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [previews, setPreviews] = useState<string[]>([]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files).filter(f =>
            f.type.startsWith('image/')
        );

        if (files.length > 0) {
            processFiles(files);
        }
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (files.length > 0) {
            processFiles(files);
        }
    }, []);

    const processFiles = (files: File[]) => {
        const urls = files.map(f => URL.createObjectURL(f));
        setPreviews(urls);
        onUpload(files);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`upload-zone glass ${isDragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {previews.length === 0 ? (
                <div className="upload-placeholder">
                    <div className="upload-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <h3>Drop menu images here</h3>
                    <p>or click to browse</p>
                    <span className="file-info">Support: JPG, PNG (up to 5 files)</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        max={5}
                        onChange={handleFileSelect}
                        className="file-input"
                    />
                </div>
            ) : (
                <div className="preview-grid">
                    {previews.map((url, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="preview-item"
                        >
                            <img src={url} alt={`Preview ${i + 1}`} />
                        </motion.div>
                    ))}
                </div>
            )}

            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Processing menu...</p>
                </div>
            )}
        </motion.div>
    );
}
