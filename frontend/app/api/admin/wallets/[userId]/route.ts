import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await context.params;
    const searchParams = request.nextUrl.searchParams.toString();
    const queryString = searchParams ? `?${searchParams}` : '';

    const response = await makeAdminRequest(
      request,
      `/api/admin/wallets/${params.userId}${queryString}`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const d = data.data;
    const wallet = d.wallet;
    const aggregates = d.aggregates;

    const transformed = {
      data: {
        wallet: {
          user: d.user,
          balance: wallet?.balance ?? 0,
          currency_code: wallet?.currency_code ?? 'EUR',
          total_credits: aggregates?.total_credits ?? 0,
          total_debits: aggregates?.total_debits ?? 0,
          total_adjustments: aggregates?.total_adjustments ?? 0,
        },
        transactions: (d.transactions ?? []).map((t: any) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          description: t.description,
          reference_type: t.reference_type,
          reference_id: t.reference_id,
          balance_after: t.balance_after,
          created_at: t.created_at,
        })),
      },
      meta: data.meta ?? { current_page: 1, last_page: 1, per_page: 25, total: 0 },
    };

    return NextResponse.json(transformed);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Wallet not found' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
    );
  }
}
