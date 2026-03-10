export interface KYCDocument {
  id: string;
  userId: string;
  documentType: 'passport' | 'idCard' | 'driversLicense';
  documentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: Date;
  reviewedAt?: Date;
}

export interface KYCSubmission {
  documentType: 'passport' | 'idCard' | 'driversLicense';
  documentFile: File;
}
