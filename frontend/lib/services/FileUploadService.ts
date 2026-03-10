/**
 * File Upload Service
 * Handles file validation, compression, and upload with progress tracking
 */

export interface UploadOptions {
  maxSize: number; // in bytes
  allowedTypes: string[];
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  key: string;
}

/**
 * Default upload options for different file types
 */
export const DEFAULT_UPLOAD_OPTIONS: Record<string, UploadOptions> = {
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    compress: true,
    maxWidth: 1920,
    maxHeight: 1920,
  },
  document: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    compress: false,
  },
  avatar: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    compress: true,
    maxWidth: 512,
    maxHeight: 512,
  },
};

export class FileUploadService {
  /**
   * Validate file against upload options
   */
  static validateFile(file: File, options: UploadOptions): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > options.maxSize) {
      const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `Le fichier est trop volumineux. Taille maximale: ${maxSizeMB} MB`,
      };
    }

    // Check file type
    if (!options.allowedTypes.includes(file.type)) {
      const allowedExtensions = options.allowedTypes
        .map(type => type.split('/')[1].toUpperCase())
        .join(', ');
      return {
        valid: false,
        error: `Type de fichier non autorisé. Formats acceptés: ${allowedExtensions}`,
      };
    }

    return { valid: true };
  }

  /**
   * Compress image file
   */
  static async compressImage(
    file: File,
    maxWidth: number = 1920,
    maxHeight: number = 1920,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      // Only compress images
      if (!file.type.startsWith('image/')) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Create new file from blob
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  }

  /**
   * Upload single file with progress tracking
   */
  static async uploadFile(
    endpoint: string,
    file: File,
    options?: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Validate file if options provided
    if (options) {
      const validation = this.validateFile(file, options);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    // Compress image if needed
    let fileToUpload = file;
    if (options?.compress && file.type.startsWith('image/')) {
      try {
        fileToUpload = await this.compressImage(
          file,
          options.maxWidth,
          options.maxHeight
        );
      } catch (error) {
        console.warn('Image compression failed, uploading original:', error);
        fileToUpload = file;
      }
    }

    // Upload file using XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', fileToUpload);

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Get auth token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      // Get CSRF token from cookies
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

      xhr.open('POST', endpoint);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (csrfToken) {
        xhr.setRequestHeader('X-XSRF-TOKEN', decodeURIComponent(csrfToken));
      }

      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  /**
   * Upload multiple files with progress tracking
   */
  static async uploadMultiple(
    endpoint: string,
    files: File[],
    options?: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    // Validate all files first
    if (options) {
      for (const file of files) {
        const validation = this.validateFile(file, options);
        if (!validation.valid) {
          throw new Error(`${file.name}: ${validation.error}`);
        }
      }
    }

    // Compress images if needed
    const filesToUpload: File[] = [];
    for (const file of files) {
      if (options?.compress && file.type.startsWith('image/')) {
        try {
          const compressed = await this.compressImage(
            file,
            options.maxWidth,
            options.maxHeight
          );
          filesToUpload.push(compressed);
        } catch (error) {
          console.warn(`Image compression failed for ${file.name}, uploading original:`, error);
          filesToUpload.push(file);
        }
      } else {
        filesToUpload.push(file);
      }
    }

    // Upload files
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();

      filesToUpload.forEach((file, index) => {
        formData.append(`files[${index}]`, file);
      });

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress({
              loaded: e.loaded,
              total: e.total,
              percentage: Math.round((e.loaded / e.total) * 100),
            });
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.files || response);
          } catch {
            reject(new Error('Invalid response format'));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.message || 'Upload failed'));
          } catch {
            reject(new Error('Upload failed'));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Get auth token from cookies
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      // Get CSRF token from cookies
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

      xhr.open('POST', endpoint);

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      if (csrfToken) {
        xhr.setRequestHeader('X-XSRF-TOKEN', decodeURIComponent(csrfToken));
      }

      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }

  /**
   * Create preview URL for file
   */
  static createPreview(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
    });
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}
