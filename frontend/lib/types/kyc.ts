export interface KYCDocument {
  id: string;
  user_id: string;
  document_type: 'passport' | 'id_card' | 'driver_license';
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface KYCSubmission {
  document_type: 'passport' | 'id_card' | 'driver_license';
  document_file: File;
}
