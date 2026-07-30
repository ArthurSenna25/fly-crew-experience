'use client';

import { useState, useCallback, useRef, MouseEvent } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'fly-crew',
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();
        const secureUrl = data.secureUrl;

        setPreview(secureUrl);
        onChange(secureUrl);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    },
    [onChange, folder]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
    // Reset the input value to allow re-selecting the same file
    e.target.value = '';
  };

  const handleRemove = () => {
    setPreview(null);
    onChange('');
  };

  const handleClickUploadArea = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    const file = files[0];
    // Basic validation (same as in handleFileChange, but we can also do it in handleUpload)
    if (file) {
      handleUpload(file);
    }
  };

  // Glass card styles (Level 2 - Card) from DESIGN-ADMIN.md
  const glassCardStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.10)',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
  };

  // When there's a preview, slightly increase the glass opacity
  const previewStyle = preview
    ? {
        ...glassCardStyle,
        background: 'rgba(255, 255, 255, 0.06)',
      }
    : glassCardStyle;

  // Loading state: skeleton pulse animation
  const loadingStyle = loading
    ? {
        ...previewStyle,
        // We'll animate the background opacity via a CSS variable or inline style
        // We'll use a CSS animation class instead for simplicity
      }
    : previewStyle;

  // Drag-over state: scale transform and border color change
  const dragOverStyle = dragOver
    ? {
        ...previewStyle,
        transform: 'scale(1.02)',
        borderColor: '#D4AF37', // Gold Prestige for drag-over (critical action)
      }
    : previewStyle;

  // Error state: border color becomes error red
  const errorStyle = error
    ? {
        ...glassCardStyle,
        borderColor: '#F87171', // Status Error from DESIGN-ADMIN.md
      }
    : dragOverStyle;

  return (
    <div className="space-y-3">
      {/* Preview / Upload Area */}
      <div
        onClick={handleClickUploadArea}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative w-full h-48 flex items-center justify-center cursor-pointer"
        style={error ? errorStyle : dragOver ? dragOverStyle : previewStyle}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Preview"
              fill
              sizes="(max-width: 640px) 100vw, 400px"
              className="object-cover rounded"
            />
            <button
              onClick={e => {
                e.stopPropagation();
                handleRemove();
              }}
              type="button"
              className="absolute top-2 right-2 z-10 bg-[rgb(248,113,119)/0.5] hover:bg-[rgb(248,113,119)/0.7] text-[rgb(248,113,119)] hover:text-white rounded-full size-8 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <>
            <Upload
              size={24}
              className={`
                ${dragOver ? 'text-gold-prestige' : 'text-silver-mist'}
                ${dragOver ? 'animate-pulse' : ''}
              `}
            />
            <p className="mt-2 text-sm text-silver-mist">
              {dragOver ? 'Drop to upload' : 'No image selected'}
            </p>
          </>
        )}
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload controls */}
      <div className="space-y-2">
        {/* Upload button (visible when loading) */}
        {loading && (
          <div className="flex items-center space-x-2 text-sm text-silver-mist">
            {/* Skeleton pulse animation for loading */}
            <div className="h-4 w-4 animate-pulse bg-silver-mist/50 rounded-full" />
            <span>Uploading...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-[rgb(248,113,119)] bg-[rgb(248,113,119)/0.1] px-3 py-1 rounded">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
