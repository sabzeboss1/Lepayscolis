<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;

class StaticPageController extends Controller
{
    /**
     * Get privacy policy content
     */
    public function privacy(): JsonResponse
    {
        $content = PlatformSetting::get('privacy_policy_content', 
            'Notre politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos informations personnelles.'
        );

        return response()->json([
            'title' => 'Politique de Confidentialité',
            'content' => $content,
            'last_updated' => PlatformSetting::get('privacy_policy_updated', now()->format('Y-m-d')),
        ]);
    }

    /**
     * Get terms of service content
     */
    public function terms(): JsonResponse
    {
        $content = PlatformSetting::get('terms_of_service_content', 
            'Nos conditions d\'utilisation définissent les règles et réglementations pour l\'utilisation de notre plateforme.'
        );

        return response()->json([
            'title' => 'Conditions d\'Utilisation',
            'content' => $content,
            'last_updated' => PlatformSetting::get('terms_of_service_updated', now()->format('Y-m-d')),
        ]);
    }

    /**
     * Get contact information
     */
    public function contact(): JsonResponse
    {
        return response()->json([
            'title' => 'Contact',
            'email' => PlatformSetting::get('contact_email', 'contact@lepaysexpresscolis.com'),
            'phone' => PlatformSetting::get('contact_phone', '+33 1 23 45 67 89'),
            'address' => PlatformSetting::get('contact_address', 'Paris, France'),
            'whatsapp' => PlatformSetting::get('whatsapp_number', ''),
            'business_hours' => PlatformSetting::get('business_hours', 'Lundi - Vendredi: 9h00 - 18h00'),
            'support_email' => PlatformSetting::get('support_email', 'support@lepaysexpresscolis.com'),
        ]);
    }

    /**
     * Get cookies policy content
     */
    public function cookies(): JsonResponse
    {
        $content = PlatformSetting::get('cookies_policy_content', 
            'Notre politique des cookies explique comment nous utilisons les cookies et technologies similaires.'
        );

        return response()->json([
            'title' => 'Politique des Cookies',
            'content' => $content,
            'last_updated' => PlatformSetting::get('cookies_policy_updated', now()->format('Y-m-d')),
        ]);
    }

    /**
     * Get legal notices content
     */
    public function legal(): JsonResponse
    {
        $content = PlatformSetting::get('legal_notices_content', 
            'Mentions légales et informations sur l\'entreprise.'
        );

        return response()->json([
            'title' => 'Mentions Légales',
            'content' => $content,
            'company_name' => PlatformSetting::get('company_name', 'Le Pays Express Colis'),
            'company_address' => PlatformSetting::get('company_address', 'Paris, France'),
            'company_registration' => PlatformSetting::get('company_registration', ''),
            'vat_number' => PlatformSetting::get('vat_number', ''),
            'last_updated' => PlatformSetting::get('legal_notices_updated', now()->format('Y-m-d')),
        ]);
    }
}