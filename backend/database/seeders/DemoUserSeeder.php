<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Country;
use App\Models\KYCDocument;
use App\Models\Payment;
use App\Models\Rating;
use App\Models\Shipment;
use App\Models\Trip;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('password');

        // Get some countries and cities for trips/shipments
        $france = Country::where('code', 'FR')->first();
        $senegal = Country::where('code', 'SN')->first();
        $cameroon = Country::where('code', 'CM')->first();
        $ivoryCoast = Country::where('code', 'CI')->first();

        $paris = City::where('name_en', 'Paris')->first();
        $dakar = City::where('name_en', 'Dakar')->first();
        $douala = City::where('name_en', 'Douala')->first();
        $abidjan = City::where('name_en', 'Abidjan')->first();
        $marseille = City::where('name_en', 'Marseille')->first();
        $yaounde = City::where('name_en', 'Yaoundé')->first();

        // ── 1. Users with APPROVED KYC (active, with activity) ──

        $user1 = User::firstOrCreate(
            ['email' => 'amadou.diallo@example.com'],
            [
                'name' => 'Amadou Diallo',
                'password' => $password,
                'phone' => '+221770001001',
                'role' => 'user',
                'kyc_status' => 'approved',
                'rating' => 4.7,
                'completed_deliveries' => 12,
                'is_recommended' => true,
                'locale' => 'fr',
                'currency_code' => 'XOF',
                'created_at' => Carbon::now()->subMonths(6),
            ]
        );

        $user2 = User::firstOrCreate(
            ['email' => 'fatou.sow@example.com'],
            [
                'name' => 'Fatou Sow',
                'password' => $password,
                'phone' => '+33612345678',
                'role' => 'user',
                'kyc_status' => 'approved',
                'rating' => 4.9,
                'completed_deliveries' => 25,
                'is_recommended' => true,
                'locale' => 'fr',
                'currency_code' => 'EUR',
                'created_at' => Carbon::now()->subMonths(8),
            ]
        );

        $user3 = User::firstOrCreate(
            ['email' => 'jean.mbarga@example.com'],
            [
                'name' => 'Jean Mbarga',
                'password' => $password,
                'phone' => '+237690001001',
                'role' => 'user',
                'kyc_status' => 'approved',
                'rating' => 3.8,
                'completed_deliveries' => 5,
                'is_recommended' => false,
                'locale' => 'fr',
                'currency_code' => 'XAF',
                'created_at' => Carbon::now()->subMonths(4),
            ]
        );

        $user4 = User::firstOrCreate(
            ['email' => 'marie.kouame@example.com'],
            [
                'name' => 'Marie Kouamé',
                'password' => $password,
                'phone' => '+22507001001',
                'role' => 'user',
                'kyc_status' => 'approved',
                'rating' => 4.5,
                'completed_deliveries' => 8,
                'is_recommended' => true,
                'locale' => 'fr',
                'currency_code' => 'XOF',
                'created_at' => Carbon::now()->subMonths(5),
            ]
        );

        $user5 = User::firstOrCreate(
            ['email' => 'ousmane.ba@example.com'],
            [
                'name' => 'Ousmane Ba',
                'password' => $password,
                'phone' => '+33678901234',
                'role' => 'user',
                'kyc_status' => 'approved',
                'rating' => 4.2,
                'completed_deliveries' => 15,
                'is_recommended' => true,
                'locale' => 'fr',
                'currency_code' => 'EUR',
                'created_at' => Carbon::now()->subMonths(10),
            ]
        );

        // ── 2. Users with PENDING KYC ──

        $user6 = User::firstOrCreate(
            ['email' => 'ibrahim.traore@example.com'],
            [
                'name' => 'Ibrahim Traoré',
                'password' => $password,
                'phone' => '+22670001001',
                'role' => 'user',
                'kyc_status' => 'pending',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
                'currency_code' => 'XOF',
                'created_at' => Carbon::now()->subWeeks(2),
            ]
        );

        $user7 = User::firstOrCreate(
            ['email' => 'aissatou.camara@example.com'],
            [
                'name' => 'Aïssatou Camara',
                'password' => $password,
                'phone' => '+224620001001',
                'role' => 'user',
                'kyc_status' => 'pending',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
                'currency_code' => 'XOF',
                'created_at' => Carbon::now()->subWeeks(1),
            ]
        );

        // ── 3. Users with REJECTED KYC ──

        $user8 = User::firstOrCreate(
            ['email' => 'paul.nguema@example.com'],
            [
                'name' => 'Paul Nguema',
                'password' => $password,
                'phone' => '+24107001001',
                'role' => 'user',
                'kyc_status' => 'rejected',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
                'currency_code' => 'XAF',
                'created_at' => Carbon::now()->subMonths(1),
            ]
        );

        // ── 4. Users with NO KYC (not_submitted) ──

        $user9 = User::firstOrCreate(
            ['email' => 'claire.dupont@example.com'],
            [
                'name' => 'Claire Dupont',
                'password' => $password,
                'phone' => '+33645678901',
                'role' => 'user',
                'kyc_status' => 'pending',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
                'currency_code' => 'EUR',
                'created_at' => Carbon::now()->subDays(3),
            ]
        );

        $user10 = User::firstOrCreate(
            ['email' => 'moussa.keita@example.com'],
            [
                'name' => 'Moussa Keita',
                'password' => $password,
                'phone' => '+22370001001',
                'role' => 'user',
                'kyc_status' => 'pending',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
                'currency_code' => 'XOF',
                'created_at' => Carbon::now()->subDays(1),
            ]
        );

        $approvedUsers = [$user1, $user2, $user3, $user4, $user5];
        $admin = User::where('role', 'super_admin')->first();

        // ── KYC Documents ──

        // Approved KYC documents
        foreach ($approvedUsers as $user) {
            KYCDocument::firstOrCreate(
                ['user_id' => $user->id, 'document_type' => 'passport'],
                [
                    'document_front_url' => 'kyc/demo/' . $user->id . '_passport_front.jpg',
                    'selfie_url' => 'kyc/demo/' . $user->id . '_selfie.jpg',
                    'status' => 'approved',
                    'submitted_at' => $user->created_at->addDay(),
                    'reviewed_at' => $user->created_at->addDays(2),
                    'reviewed_by' => $admin?->id,
                ]
            );
        }

        // Pending KYC documents
        KYCDocument::firstOrCreate(
            ['user_id' => $user6->id, 'document_type' => 'idCard'],
            [
                'document_front_url' => 'kyc/demo/' . $user6->id . '_id_front.jpg',
                'document_back_url' => 'kyc/demo/' . $user6->id . '_id_back.jpg',
                'selfie_url' => 'kyc/demo/' . $user6->id . '_selfie.jpg',
                'status' => 'pending',
                'submitted_at' => Carbon::now()->subDays(5),
            ]
        );

        KYCDocument::firstOrCreate(
            ['user_id' => $user7->id, 'document_type' => 'passport'],
            [
                'document_front_url' => 'kyc/demo/' . $user7->id . '_passport_front.jpg',
                'selfie_url' => 'kyc/demo/' . $user7->id . '_selfie.jpg',
                'status' => 'pending',
                'submitted_at' => Carbon::now()->subDays(2),
            ]
        );

        // Rejected KYC document
        KYCDocument::firstOrCreate(
            ['user_id' => $user8->id, 'document_type' => 'driversLicense'],
            [
                'document_front_url' => 'kyc/demo/' . $user8->id . '_license_front.jpg',
                'selfie_url' => 'kyc/demo/' . $user8->id . '_selfie.jpg',
                'status' => 'rejected',
                'rejection_reason' => 'Document illisible, veuillez soumettre une photo plus nette.',
                'submitted_at' => Carbon::now()->subWeeks(3),
                'reviewed_at' => Carbon::now()->subWeeks(2),
                'reviewed_by' => $admin?->id,
            ]
        );

        // ── Trips ──

        if ($france && $senegal && $paris && $dakar) {
            $trip1 = Trip::firstOrCreate(
                ['traveler_id' => $user2->id, 'departure_date' => Carbon::now()->subDays(30)],
                [
                    'departure_country' => 'France',
                    'departure_city' => 'Paris',
                    'departure_country_id' => $france->id,
                    'departure_city_id' => $paris->id,
                    'arrival_country' => 'Senegal',
                    'arrival_city' => 'Dakar',
                    'arrival_country_id' => $senegal->id,
                    'arrival_city_id' => $dakar->id,
                    'departure_date' => Carbon::now()->subDays(30),
                    'arrival_date' => Carbon::now()->subDays(29),
                    'available_capacity' => 20.00,
                    'price_per_kg' => 15.00,
                    'accepted_package_types' => ['documents', 'electronics', 'clothing'],
                    'currency_code' => 'EUR',
                    'status' => 'completed',
                    'verification_status' => 'verified',
                    'verified_by' => $admin?->id,
                    'verified_at' => Carbon::now()->subDays(31),
                ]
            );

            $trip2 = Trip::firstOrCreate(
                ['traveler_id' => $user5->id, 'departure_date' => Carbon::now()->subDays(15)],
                [
                    'departure_country' => 'Senegal',
                    'departure_city' => 'Dakar',
                    'departure_country_id' => $senegal->id,
                    'departure_city_id' => $dakar->id,
                    'arrival_country' => 'France',
                    'arrival_city' => 'Paris',
                    'arrival_country_id' => $france->id,
                    'arrival_city_id' => $paris->id,
                    'departure_date' => Carbon::now()->subDays(15),
                    'arrival_date' => Carbon::now()->subDays(14),
                    'available_capacity' => 15.00,
                    'price_per_kg' => 12.00,
                    'accepted_package_types' => ['food', 'clothing', 'cosmetics'],
                    'currency_code' => 'EUR',
                    'status' => 'completed',
                    'verification_status' => 'verified',
                    'verified_by' => $admin?->id,
                    'verified_at' => Carbon::now()->subDays(16),
                ]
            );
        }

        if ($cameroon && $france && $douala && $paris) {
            $trip3 = Trip::firstOrCreate(
                ['traveler_id' => $user3->id, 'departure_date' => Carbon::now()->addDays(5)],
                [
                    'departure_country' => 'Cameroon',
                    'departure_city' => 'Douala',
                    'departure_country_id' => $cameroon->id,
                    'departure_city_id' => $douala->id,
                    'arrival_country' => 'France',
                    'arrival_city' => 'Paris',
                    'arrival_country_id' => $france->id,
                    'arrival_city_id' => $paris->id,
                    'departure_date' => Carbon::now()->addDays(5),
                    'arrival_date' => Carbon::now()->addDays(6),
                    'available_capacity' => 10.00,
                    'price_per_kg' => 18.00,
                    'accepted_package_types' => ['documents', 'electronics'],
                    'currency_code' => 'EUR',
                    'status' => 'active',
                    'verification_status' => 'verified',
                    'verified_by' => $admin?->id,
                    'verified_at' => Carbon::now()->subDays(1),
                ]
            );
        }

        if ($ivoryCoast && $france && $abidjan && $marseille) {
            $trip4 = Trip::firstOrCreate(
                ['traveler_id' => $user4->id, 'departure_date' => Carbon::now()->addDays(10)],
                [
                    'departure_country' => 'Ivory Coast',
                    'departure_city' => 'Abidjan',
                    'departure_country_id' => $ivoryCoast->id,
                    'departure_city_id' => $abidjan->id,
                    'arrival_country' => 'France',
                    'arrival_city' => 'Marseille',
                    'arrival_country_id' => $france->id,
                    'arrival_city_id' => $marseille->id,
                    'departure_date' => Carbon::now()->addDays(10),
                    'arrival_date' => Carbon::now()->addDays(11),
                    'available_capacity' => 25.00,
                    'price_per_kg' => 10.00,
                    'accepted_package_types' => ['clothing', 'food', 'cosmetics'],
                    'currency_code' => 'EUR',
                    'status' => 'active',
                    'verification_status' => 'pending',
                ]
            );
        }

        // ── Shipments ──

        if (isset($trip1) && $france && $senegal && $paris && $dakar) {
            $shipment1 = Shipment::firstOrCreate(
                ['sender_id' => $user1->id, 'trip_id' => $trip1->id],
                [
                    'traveler_id' => $user2->id,
                    'package_description' => 'Documents administratifs et vêtements',
                    'package_weight' => 5.00,
                    'package_length' => 40,
                    'package_width' => 30,
                    'package_height' => 20,
                    'pickup_country' => 'France',
                    'pickup_city' => 'Paris',
                    'pickup_country_id' => $france->id,
                    'pickup_city_id' => $paris->id,
                    'pickup_address' => '15 Rue de Rivoli, Paris',
                    'delivery_country' => 'Senegal',
                    'delivery_city' => 'Dakar',
                    'delivery_country_id' => $senegal->id,
                    'delivery_city_id' => $dakar->id,
                    'delivery_address' => 'Quartier Plateau, Dakar',
                    'status' => 'delivered',
                    'payment_amount' => 75.00,
                    'payment_status' => 'released',
                ]
            );

            $shipment2 = Shipment::firstOrCreate(
                ['sender_id' => $user4->id, 'trip_id' => $trip1->id],
                [
                    'traveler_id' => $user2->id,
                    'package_description' => 'Produits cosmétiques',
                    'package_weight' => 3.00,
                    'package_length' => 25,
                    'package_width' => 20,
                    'package_height' => 15,
                    'pickup_country' => 'France',
                    'pickup_city' => 'Paris',
                    'pickup_country_id' => $france->id,
                    'pickup_city_id' => $paris->id,
                    'pickup_address' => '8 Avenue des Champs-Élysées, Paris',
                    'delivery_country' => 'Senegal',
                    'delivery_city' => 'Dakar',
                    'delivery_country_id' => $senegal->id,
                    'delivery_city_id' => $dakar->id,
                    'delivery_address' => 'Mermoz, Dakar',
                    'status' => 'delivered',
                    'payment_amount' => 45.00,
                    'payment_status' => 'released',
                ]
            );
        }

        if (isset($trip2) && $senegal && $france && $dakar && $paris) {
            $shipment3 = Shipment::firstOrCreate(
                ['sender_id' => $user1->id, 'trip_id' => $trip2->id],
                [
                    'traveler_id' => $user5->id,
                    'package_description' => 'Épices et produits locaux',
                    'package_weight' => 8.00,
                    'package_length' => 50,
                    'package_width' => 35,
                    'package_height' => 25,
                    'pickup_country' => 'Senegal',
                    'pickup_city' => 'Dakar',
                    'pickup_country_id' => $senegal->id,
                    'pickup_city_id' => $dakar->id,
                    'pickup_address' => 'Marché Sandaga, Dakar',
                    'delivery_country' => 'France',
                    'delivery_city' => 'Paris',
                    'delivery_country_id' => $france->id,
                    'delivery_city_id' => $paris->id,
                    'delivery_address' => '22 Rue de Belleville, Paris',
                    'status' => 'delivered',
                    'payment_amount' => 96.00,
                    'payment_status' => 'released',
                ]
            );
        }

        if (isset($trip3) && $cameroon && $france && $douala && $paris) {
            $shipment4 = Shipment::firstOrCreate(
                ['sender_id' => $user3->id, 'trip_id' => $trip3->id],
                [
                    'traveler_id' => $user3->id,
                    'package_description' => 'Matériel informatique',
                    'package_weight' => 2.00,
                    'package_length' => 30,
                    'package_width' => 25,
                    'package_height' => 10,
                    'pickup_country' => 'Cameroon',
                    'pickup_city' => 'Douala',
                    'pickup_country_id' => $cameroon->id,
                    'pickup_city_id' => $douala->id,
                    'pickup_address' => 'Akwa, Douala',
                    'delivery_country' => 'France',
                    'delivery_city' => 'Paris',
                    'delivery_country_id' => $france->id,
                    'delivery_city_id' => $paris->id,
                    'delivery_address' => '5 Rue du Faubourg, Paris',
                    'status' => 'accepted',
                    'payment_amount' => 36.00,
                    'payment_status' => 'escrowed',
                ]
            );
        }

        // ── Ratings ──

        if (isset($shipment1)) {
            Rating::firstOrCreate(
                ['from_user_id' => $user1->id, 'to_user_id' => $user2->id, 'shipment_id' => $shipment1->id],
                ['rating' => 5, 'comment' => 'Excellente livraison, très rapide et soigneuse !']
            );
            Rating::firstOrCreate(
                ['from_user_id' => $user2->id, 'to_user_id' => $user1->id, 'shipment_id' => $shipment1->id],
                ['rating' => 5, 'comment' => 'Colis bien emballé, expéditeur fiable.']
            );
        }

        if (isset($shipment2)) {
            Rating::firstOrCreate(
                ['from_user_id' => $user4->id, 'to_user_id' => $user2->id, 'shipment_id' => $shipment2->id],
                ['rating' => 4, 'comment' => 'Bon service, un peu de retard mais tout est arrivé.']
            );
            Rating::firstOrCreate(
                ['from_user_id' => $user2->id, 'to_user_id' => $user4->id, 'shipment_id' => $shipment2->id],
                ['rating' => 5, 'comment' => 'Colis parfait, merci !']
            );
        }

        if (isset($shipment3)) {
            Rating::firstOrCreate(
                ['from_user_id' => $user1->id, 'to_user_id' => $user5->id, 'shipment_id' => $shipment3->id],
                ['rating' => 4, 'comment' => 'Très bon transporteur, je recommande.']
            );
            Rating::firstOrCreate(
                ['from_user_id' => $user5->id, 'to_user_id' => $user1->id, 'shipment_id' => $shipment3->id],
                ['rating' => 4, 'comment' => 'Bon expéditeur, emballage correct.']
            );
        }

        // ── Wallets ──

        foreach ($approvedUsers as $user) {
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'balance' => round(rand(1000, 50000) / 100, 2),
                    'currency_code' => $user->currency_code ?? 'EUR',
                ]
            );

            // Add some transactions
            if ($wallet->wasRecentlyCreated) {
                WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'credit',
                    'amount' => 150.00,
                    'description' => 'Paiement livraison reçu',
                    'balance_after' => 150.00,
                    'currency_code' => $wallet->currency_code,
                ]);

                WalletTransaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'debit',
                    'amount' => 50.00,
                    'description' => 'Retrait vers compte bancaire',
                    'balance_after' => 100.00,
                    'currency_code' => $wallet->currency_code,
                ]);
            }
        }

        $this->command->info('Demo users seeded successfully!');
        $this->command->info('10 demo users created:');
        $this->command->info('  - 5 with approved KYC (with trips, shipments, ratings, wallets)');
        $this->command->info('  - 2 with pending KYC');
        $this->command->info('  - 1 with rejected KYC');
        $this->command->info('  - 2 new users (pending, no KYC document submitted)');
        $this->command->info('All demo users password: password');
    }
}
