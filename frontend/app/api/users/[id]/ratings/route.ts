import { NextRequest, NextResponse } from 'next/server';
import { mockRatings } from '@/lib/api/mockData';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Filter ratings for this user
    const userRatings = mockRatings.filter(r => r.rated_id === id);
    
    // Calculate average rating
    const totalScore = userRatings.reduce((sum, r) => sum + r.score, 0);
    const averageRating = userRatings.length > 0 ? totalScore / userRatings.length : 0;
    
    // Sort by date (newest first)
    userRatings.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    return NextResponse.json({
      ratings: userRatings,
      average_rating: Math.round(averageRating * 10) / 10,
      total_ratings: userRatings.length,
    });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user ratings' },
      { status: 500 }
    );
  }
}
