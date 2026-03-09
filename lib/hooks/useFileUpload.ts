import { useState, useCallback, useRef } from 'react';
import { FileUploadService, UploadOptions, UploadProgress, UploadResult } from '@/lib/services/FileUploadService';

interface UseFileUploadOptions extends UploadOptions {
  multiple?: boolean;
  autoUpload?: boolean;
  endpoint?: string;
}

interface UseFileUploadReturn {
  files: File[];
  previews: string[];
  progress: number;
  isUploading: boolean;
  error: string | null;
  addFiles: (newFiles: File[]) => Promise<void>;
  removeFile: (index: number) => void;
  upload: (endpoint?: string) => Promise<UploadResult[]>;
  reset: () => void;
  isDragging: boolean;
  dragProps: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragCounter = useRef(0);

  /**
   * Add files with validation and preview generation
   */
  const addFiles = useCallback(async (newFiles: File[]) => {
    setError(null);

    // Validate files
    const validFiles: File[] = [];
    for (const file of newFiles) {
      const validation = FileUploadService.validateFile(file, options);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }
      validFiles.push(file);
    }

    // Check multiple files constraint
    if (!options.multiple && validFiles.length > 1) {
      setError('Only one file is allowed');
      return;
    }

    // Update files
    const updatedFiles = options.multiple ? [...files, ...validFiles] : validFiles;
    setFiles(updatedFiles);

    // Generate previews for images
    const newPreviews: string[] = [];
    for (const file of validFiles) {
      if (file.type.startsWith('image/')) {
        try {
          const preview = await FileUploadService.createPreview(file);
          newPreviews.push(preview);
        } catch {
          newPreviews.push('');
        }
      } else {
        newPreviews.push('');
      }
    }

    setPreviews(options.multiple ? [...previews, ...newPreviews] : newPreviews);

    // Auto upload if enabled
    if (options.autoUpload && options.endpoint) {
      await upload(options.endpoint);
    }
  }, [files, previews, options]);

  /**
   * Remove file at index
   */
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  /**
   * Upload files to endpoint
   */
  const upload = useCallback(async (endpoint?: string): Promise<UploadResult[]> => {
    const uploadEndpoint = endpoint || options.endpoint;
    if (!uploadEndpoint) {
      throw new Error('Upload endpoint is required');
    }

    if (files.length === 0) {
      throw new Error('No files to upload');
    }

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      const onProgress = (p: UploadProgress) => {
        setProgress(p.percentage);
      };

      let results: UploadResult[];
      if (files.length === 1) {
        const result = await FileUploadService.uploadFile(
          uploadEndpoint,
          files[0],
          options,
          onProgress
        );
        results = [result];
      } else {
        results = await FileUploadService.uploadMultiple(
          uploadEndpoint,
          files,
          options,
          onProgress
        );
      }

      setProgress(100);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [files, options]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setFiles([]);
    setPreviews([]);
    setProgress(0);
    setIsUploading(false);
    setError(null);
    setIsDragging(false);
    dragCounter.current = 0;
  }, []);

  /**
   * Drag and drop handlers
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await addFiles(droppedFiles);
    }
  }, [addFiles]);

  return {
    files,
    previews,
    progress,
    isUploading,
    error,
    addFiles,
    removeFile,
    upload,
    reset,
    isDragging,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}
