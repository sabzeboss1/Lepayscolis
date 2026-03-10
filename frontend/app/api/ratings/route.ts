import { NextRequest, NextResponse } from 'next/server';
import { mockRatings, mockUsers } from '@/lib/api/mockData';
import type { Rating } from '@/lib/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.shipment_id || !body.rated_id || !body.score) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate score value
    if (body.score < 1 || body.score > 5) {
      return NextResponse.json(
        { error: 'Score must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate comment for low ratings
    if (body.score < 3 && (!body.comment || !body.comment.trim())) {
      return NextResponse.json(
        { error: 'Comment is required for ratings below 3 stars' },
        { status: 400 }
      );
    }

    // Check if rating already exists for this shipment
    const existingRating = mockRatings.find(
      r => r.shipment_id === body.shipment_id && r.rated_id === body.rated_id
    );

    if (existingRating) {
      return NextResponse.json(
        { error: 'Rating already submitted for this shipment' },
        { status: 400 }
      );
    }

    // Create new rating
    const newRating: Rating = {
      id: `rating-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shipment_id: body.shipment_id,
      rater_id: body.rater_id || 'current-user-id', // In production, get from auth
      rater: {} as any, // Would be populated from database
      rated_id: body.rated_id,
      rated: {} as any, // Would be populated from database
      score: body.score,
      comment: body.comment || undefined,
      created_at: new Date().toISOString(),
    };

    // Add to mock data
    mockRatings.push(newRating);

    // Update user's average rating
    const userIndex = mockUsers.findIndex(u => u.id === body.rated_id);
    if (userIndex !== -1) {
      const userRatings = mockRatings.filter(r => r.rated_id === body.rated_id);
      const totalRating = userRatings.reduce((sum, r) => sum + r.score, 0);
      const averageRating = totalRating / userRatings.length;
      
      mockUsers[userIndex].rating = Math.round(averageRating * 10) / 10;
      mockUsers[userIndex].total_ratings = userRatings.length;
    }

    return NextResponse.json({
      rating: newRating,
      message: 'Rating submitted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const shipmentId = searchParams.get('shipmentId');

    let filteredRatings = [...mockRatings];

    if (userId) {
      filteredRatings = filteredRatings.filter(r => r.rated_id === userId);
    }

    if (shipmentId) {
      filteredRatings = filteredRatings.filter(r => r.shipment_id === shipmentId);
    }

    // Sort by date (newest first)
    filteredRatings.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      ratings: filteredRatings,
      total: filteredRatings.length,
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ratings' },
      { status: 500 }
    );
  }
}
