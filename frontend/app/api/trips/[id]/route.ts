import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const csrfToken = request.headers.get('x-xsrf-token');
    
    // Forward the request to Laravel backend
    const backendUrl = `${BACKEND_URL}/api/trips/${id}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader || '',
        'X-XSRF-TOKEN': csrfToken || '',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Get trip details error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const csrfToken = request.headers.get('x-xsrf-token');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the FormData from the request
    const formData = await request.formData();
    
    // Forward the request to Laravel backend
    const backendUrl = `${BACKEND_URL}/api/trips/${id}`;
    
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader,
        'X-XSRF-TOKEN': csrfToken || '',
      },
      body: formData,
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Update trip error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    const csrfToken = request.headers.get('x-xsrf-token');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Forward the request to Laravel backend
    const backendUrl = `${BACKEND_URL}/api/trips/${id}`;
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': authHeader,
        'X-XSRF-TOKEN': csrfToken || '',
      },
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete trip error:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
