import { NextRequest, NextResponse } from 'next/server';
import { mockUsers } from '@/lib/api/mockData';
import type { KYCDocument } from '@/lib/types/kyc';

// Mock KYC documents storage
const mockKYCDocuments: KYCDocument[] = [];

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from token (in real app, decode JWT)
    const userId = authHeader.replace('Bearer ', '');

    // Find user's KYC document
    const kycDocument = mockKYCDocuments.find(doc => doc.user_id === userId);

    if (!kycDocument) {
      return NextResponse.json({ error: 'No KYC document found' }, { status: 404 });
    }

    return NextResponse.json({ document: kycDocument });
  } catch (error) {
    console.error('Error fetching KYC document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract user ID from token (in real app, decode JWT)
    const userId = authHeader.replace('Bearer ', '');

    const formData = await request.formData();
    const documentType = formData.get('document_type') as 'passport' | 'id_card' | 'driver_license';
    const documentFile = formData.get('document_file') as File;

    if (!documentType || !documentFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In a real app, upload file to storage and get URL
    const documentUrl = `https://storage.example.com/kyc/${userId}/${documentFile.name}`;

    // Create or update KYC document
    const existingIndex = mockKYCDocuments.findIndex(doc => doc.user_id === userId);

    const newDocument: KYCDocument = {
      id: `kyc-${Date.now()}`,
      user_id: userId,
      document_type: documentType,
      document_url: documentUrl,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      mockKYCDocuments[existingIndex] = newDocument;
    } else {
      mockKYCDocuments.push(newDocument);
    }

    // Update user's KYC status to pending
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      (user as any).kyc_status = 'pending';
    }

    return NextResponse.json({
      document: newDocument,
      message: 'Document submitted successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting KYC document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
