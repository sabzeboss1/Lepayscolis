import { NextRequest, NextResponse } from 'next/server';

// Mock settings storage (in production, this would be in a database)
let platformSettings = {
  platform_name: 'Le Pays Express Colis',
  platform_url: 'https://lepaysexpresscolis.com',
  support_email: 'support@lepaysexpresscolis.com',
  support_phone: '+33 1 23 45 67 89',
  platform_fee_percentage: 10.0,
  
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_encryption: 'tls',
  smtp_from_address: 'noreply@lepaysexpresscolis.com',
  smtp_from_name: 'Le Pays Express Colis',
  
  stripe_public_key: '',
  stripe_secret_key: '',
  stripe_webhook_secret: '',
  payment_currency: 'EUR',
  
  orange_money_api_key: '',
  orange_money_merchant_id: '',
  orange_money_enabled: false,
  
  mtn_money_api_key: '',
  mtn_money_subscription_key: '',
  mtn_money_enabled: false,
  
  bank_name: '',
  bank_iban: '',
  bank_bic: '',
  bank_transfer_enabled: false,
  
  cash_payment_enabled: false,
  
  withdrawal_fee: 2.50,
  min_withdrawal_amount: 20.00,
  max_withdrawal_amount: 5000.00,
  
  min_shipment_price: 10.00,
  max_shipment_price: 1000.00,
  
  logo_url: '/logo.png',
  favicon_url: '/favicon.ico',
  primary_color: '#3B82F6',
  secondary_color: '#F97316',
  
  default_currency: 'EUR',
  supported_currencies: ['EUR', 'USD', 'GBP', 'XAF', 'XOF', 'RUB', 'CAD'],
  
  kyc_required: true,
  two_factor_enabled: false,
  session_timeout: 3600,
  max_login_attempts: 5,
  
  email_notifications_enabled: true,
  push_notifications_enabled: true,
  sms_notifications_enabled: false,
};

export async function GET(request: NextRequest) {
  try {
    // In production, fetch from database
    return NextResponse.json({
      success: true,
      settings: platformSettings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.platform_name || !body.support_email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate numeric values
    if (body.platform_fee_percentage < 0 || body.platform_fee_percentage > 100) {
      return NextResponse.json(
        { success: false, error: 'Platform fee must be between 0 and 100' },
        { status: 400 }
      );
    }
    
    if (body.min_withdrawal_amount >= body.max_withdrawal_amount) {
      return NextResponse.json(
        { success: false, error: 'Minimum withdrawal must be less than maximum' },
        { status: 400 }
      );
    }
    
    if (body.min_shipment_price >= body.max_shipment_price) {
      return NextResponse.json(
        { success: false, error: 'Minimum shipment price must be less than maximum' },
        { status: 400 }
      );
    }
    
    // Update settings (in production, save to database)
    platformSettings = { ...platformSettings, ...body };
    
    // In production, log this change to audit trail
    console.log('Settings updated:', {
      timestamp: new Date().toISOString(),
      updatedBy: 'admin', // Get from auth context
      changes: body
    });
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: platformSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
