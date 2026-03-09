# AWS S3 Setup Guide

## Overview

The Le Pays Express Colis backend uses AWS S3 for file storage with two separate buckets:
- **Public Bucket**: For user avatars (publicly accessible)
- **Private Bucket**: For KYC documents and travel proofs (private access only)

## Installation

The AWS SDK for PHP is already installed via Composer:

```bash
composer require aws/aws-sdk-php
```

Current version: `^3.370`

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=lepaysexpresscolis-default
AWS_PUBLIC_BUCKET=lepaysexpresscolis-public
AWS_PRIVATE_BUCKET=lepaysexpresscolis-private
AWS_USE_PATH_STYLE_ENDPOINT=false
```

### S3 Buckets

Three filesystem disks are configured in `config/filesystems.php`:

1. **s3** - Default S3 disk
2. **s3-public** - For public files (avatars)
   - Visibility: public
   - Bucket: `AWS_PUBLIC_BUCKET`
3. **s3-private** - For private files (KYC documents, travel proofs)
   - Visibility: private
   - Bucket: `AWS_PRIVATE_BUCKET`

## AWS S3 Bucket Setup

### 1. Create S3 Buckets

Create two S3 buckets in your AWS account:

#### Public Bucket (for avatars)
- Name: `lepaysexpresscolis-public`
- Region: `us-east-1` (or your preferred region)
- Block all public access: **OFF**
- Bucket policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::lepaysexpresscolis-public/*"
        }
    ]
}
```

#### Private Bucket (for documents)
- Name: `lepaysexpresscolis-private`
- Region: `us-east-1` (or your preferred region)
- Block all public access: **ON**
- No bucket policy needed (private by default)

### 2. Create IAM User

Create an IAM user with programmatic access:

1. Go to AWS IAM Console
2. Create new user: `lepaysexpresscolis-backend`
3. Attach policy with S3 permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::lepaysexpresscolis-public/*",
                "arn:aws:s3:::lepaysexpresscolis-private/*",
                "arn:aws:s3:::lepaysexpresscolis-public",
                "arn:aws:s3:::lepaysexpresscolis-private"
            ]
        }
    ]
}
```

4. Save the Access Key ID and Secret Access Key

### 3. Configure CORS (for public bucket)

Add CORS configuration to the public bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

## Usage in Code

### Upload to Public Bucket (Avatars)

```php
use Illuminate\Support\Facades\Storage;

// Upload avatar
$path = Storage::disk('s3-public')->put('avatars', $file);
$url = Storage::disk('s3-public')->url($path);

// Delete avatar
Storage::disk('s3-public')->delete($path);
```

### Upload to Private Bucket (KYC Documents)

```php
use Illuminate\Support\Facades\Storage;

// Upload KYC document
$path = Storage::disk('s3-private')->put('kyc', $file);

// Generate temporary URL (valid for 1 hour)
$url = Storage::disk('s3-private')->temporaryUrl($path, now()->addHour());

// Delete document
Storage::disk('s3-private')->delete($path);
```

### Upload Travel Proof

```php
use Illuminate\Support\Facades\Storage;

// Upload travel proof
$path = Storage::disk('s3-private')->put('travel-proofs', $file);

// Generate temporary URL
$url = Storage::disk('s3-private')->temporaryUrl($path, now()->addHours(24));
```

## File Structure

### Public Bucket Structure
```
lepaysexpresscolis-public/
└── avatars/
    ├── {user_id}_{timestamp}.jpg
    ├── {user_id}_{timestamp}.png
    └── ...
```

### Private Bucket Structure
```
lepaysexpresscolis-private/
├── kyc/
│   ├── {user_id}/
│   │   ├── passport_front_{timestamp}.jpg
│   │   ├── passport_selfie_{timestamp}.jpg
│   │   ├── idcard_front_{timestamp}.jpg
│   │   ├── idcard_back_{timestamp}.jpg
│   │   └── ...
└── travel-proofs/
    ├── {trip_id}_{timestamp}.pdf
    └── ...
```

## Security Best Practices

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** when deploying to AWS (EC2, ECS, Lambda)
3. **Rotate access keys** regularly
4. **Enable S3 bucket versioning** for backup
5. **Enable S3 server-side encryption** (SSE-S3 or SSE-KMS)
6. **Monitor S3 access logs** for suspicious activity
7. **Use temporary URLs** for private files (expires after set time)

## Testing

For local development and testing, you can use:

1. **LocalStack** - Local AWS cloud stack
2. **MinIO** - S3-compatible object storage
3. **Fake disk** - Laravel's fake storage for unit tests

### Using Fake Storage in Tests

```php
use Illuminate\Support\Facades\Storage;

public function test_avatar_upload()
{
    Storage::fake('s3-public');
    
    // Your test code
    
    Storage::disk('s3-public')->assertExists($path);
}
```

## Troubleshooting

### Common Issues

1. **Access Denied Error**
   - Check IAM user permissions
   - Verify bucket policy
   - Ensure correct bucket names in .env

2. **CORS Error**
   - Add CORS configuration to bucket
   - Check AllowedOrigins includes your frontend URL

3. **File Not Found**
   - Verify file path is correct
   - Check bucket name in configuration
   - Ensure file was uploaded successfully

4. **Slow Upload/Download**
   - Consider using CloudFront CDN
   - Enable S3 Transfer Acceleration
   - Check network connectivity

## Related Requirements

This setup satisfies the following requirements:

- **Requirement 8.1-8.11**: File Management System
  - 8.1: Avatar resizing and public storage
  - 8.2: Public access for avatars
  - 8.4: Private storage for KYC documents
  - 8.6: Private storage for travel proofs
  - 8.8-8.10: File validation (types and sizes)

## Next Steps

After completing this setup:

1. Create `FileUploadService` class (Task 6.1)
2. Implement KYC verification system (Task 7.1-7.6)
3. Implement trip management with travel proof upload (Task 8.1-8.6)
4. Write property-based tests for file uploads (Task 6.2)

## References

- [AWS SDK for PHP Documentation](https://docs.aws.amazon.com/sdk-for-php/)
- [Laravel File Storage Documentation](https://laravel.com/docs/11.x/filesystem)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
