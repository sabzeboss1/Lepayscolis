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

        // Get countries and cities
        $cameroon = Country::where('code', 'CM')->first();
        $russia   = Country::where('code', 'RU')->first();

        $douala      = City::where('name_en', 'Douala')->first();
        $yaounde     = City::where('name_en', 'Yaoundé')->first();
        $bafoussam   = City::where('name_en', 'Bafoussam')->first();
        $moscow      = City::where('name_en', 'Moscow')->first();
        $stPetersburg = City::where('name_en', 'Saint Petersburg')->first();
        $kazan       = City::where('name_en', 'Kazan')->first();

        // ── 1. Users with APPROVED KYC ──

        $user1 = User::firstOrCreate(
            ['email' => 'jean.mbarga@example.com'],
            [
                'name' => 'Jean Mbarga',
                'password' => $password,
                'phone' => '+237690001001',
                'role' => 'user',
                'kyc_status' => 'approved',
                'rating' => 4.7,
                'completed_deliveries' => 12,
                'is_recommended' => true,
                'locale' => 'fr',
                'currency_code' => 'XAF',
                'created_at' => Carbon::now()->subMonths(6),
            ]
        );

        $user2 = User::firstOrCreate(
            ['email' => 'alexei.petrov@example.com'],
            [
                'name' => 'Alexei Petrov',
                'password' => $password,
                'phone' => '+79161234567',
                'role' => 'user',
                'kyc_status' => 'approved',
                'rating' => 4.9,
                'completed_deliveries' => 20,
                'is_recommended' => true,
                'locale' => 'en',
                'currency_code' => 'RUB',
                'created_at' => Carbon::now()->subMonths(8),
            ]
        );

        $user3 = User::firstOrCreate(
            ['email' => 'marie.kouame@example.com'],
            [
                'name' => 'Marie Ngono',
                'password' => $password,
                'phone' => '+237670002002',
                'role' => 'user',
                'kyc_status' => 'approved',
                'rating' => 4.5,
                'completed_deliveries' => 8,
                'is_recommended' => true,
                'locale' => 'fr',
                'currency_code' => 'XAF',
                'created_at' => Carbon::now()->subMonths(5),
            ]
        );

        $user4 = User::firstOrCreate(
            ['email' => 'elena.ivanova@example.com'],
            [
                'name' => 'Elena Ivanova',
                'password' => $password,
                'phone' => '+79057654321',
                'role' => 'user',
                'kyc_status' => 'approved',
                'rating' => 4.2,
                'completed_deliveries' => 15,
                'is_recommended' => true,
                'locale' => 'en',
                'currency_code' => 'RUB',
                'created_at' => Carbon::now()->subMonths(10),
            ]
        );

        $user5 = User::firstOrCreate(
            ['email' => 'paul.essomba@example.com'],
            [
                'name' => 'Paul Essomba',
                'password' => $password,
                'phone' => '+237655003003',
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

        // ── 2. Users with PENDING KYC ──

        $user6 = User::firstOrCreate(
            ['email' => 'dmitri.sokolov@example.com'],
            [
                'name' => 'Dmitri Sokolov',
                'password' => $password,
                'phone' => '+79031112233',
                'role' => 'user',
                'kyc_status' => 'pending',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'en',
                'currency_code' => 'RUB',
                'created_at' => Carbon::now()->subWeeks(2),
            ]
        );

        $user7 = User::firstOrCreate(
            ['email' => 'aissatou.fotso@example.com'],
            [
                'name' => 'Aïssatou Fotso',
                'password' => $password,
                'phone' => '+237680004004',
                'role' => 'user',
                'kyc_status' => 'pending',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
                'currency_code' => 'XAF',
                'created_at' => Carbon::now()->subWeeks(1),
            ]
        );

        // ── 3. User with REJECTED KYC ──

        $user8 = User::firstOrCreate(
            ['email' => 'boris.volkov@example.com'],
            [
                'name' => 'Boris Volkov',
                'password' => $password,
                'phone' => '+79264445566',
                'role' => 'user',
                'kyc_status' => 'rejected',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'en',
                'currency_code' => 'RUB',
                'created_at' => Carbon::now()->subMonths(1),
            ]
        );

        // ── 4. Users with NO KYC ──

        $user9 = User::firstOrCreate(
            ['email' => 'sarah.ndam@example.com'],
            [
                'name' => 'Sarah Ndam',
                'password' => $password,
                'phone' => '+237699005005',
                'role' => 'user',
                'kyc_status' => 'pending',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'fr',
                'currency_code' => 'XAF',
                'created_at' => Carbon::now()->subDays(3),
            ]
        );

        $user10 = User::firstOrCreate(
            ['email' => 'igor.kozlov@example.com'],
            [
                'name' => 'Igor Kozlov',
                'password' => $password,
                'phone' => '+79107778899',
                'role' => 'user',
                'kyc_status' => 'pending',
                'rating' => 0,
                'completed_deliveries' => 0,
                'is_recommended' => false,
                'locale' => 'en',
                'currency_code' => 'RUB',
                'created_at' => Carbon::now()->subDays(1),
            ]
        );

        $approvedUsers = [$user1, $user2, $user3, $user4, $user5];
        $admin = User::where('role', 'super_admin')->first();

        // ── KYC Documents ──

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

        // ── Trips (Cameroun ↔ Russie) — 20 voyages ──

        $travelers = [$user1, $user2, $user3, $user4, $user5];
        $cmCities = [
            ['city' => $douala, 'name' => 'Douala'],
            ['city' => $yaounde, 'name' => 'Yaoundé'],
            ['city' => $bafoussam, 'name' => 'Bafoussam'],
        ];
        $ruCities = [
            ['city' => $moscow, 'name' => 'Moscou'],
            ['city' => $stPetersburg, 'name' => 'Saint-Pétersbourg'],
            ['city' => $kazan, 'name' => 'Kazan'],
        ];
        $packageTypes = [
            ['documents', 'electronics', 'clothing'],
            ['food', 'clothing', 'cosmetics'],
            ['documents', 'electronics'],
            ['clothing', 'food'],
            ['cosmetics', 'food', 'electronics'],
        ];

        $tripDefinitions = [
            // ── Completed trips (past) ──
            ['from' => 'cm', 'cmIdx' => 0, 'ruIdx' => 0, 'travIdx' => 0, 'days' => -45, 'cap' => 20, 'price' => 5000, 'cur' => 'XAF', 'status' => 'completed', 'pkgIdx' => 0],
            ['from' => 'ru', 'cmIdx' => 0, 'ruIdx' => 0, 'travIdx' => 1, 'days' => -30, 'cap' => 15, 'price' => 800,  'cur' => 'RUB', 'status' => 'completed', 'pkgIdx' => 1],
            ['from' => 'cm', 'cmIdx' => 1, 'ruIdx' => 1, 'travIdx' => 2, 'days' => -25, 'cap' => 12, 'price' => 5500, 'cur' => 'XAF', 'status' => 'completed', 'pkgIdx' => 2],
            ['from' => 'ru', 'cmIdx' => 2, 'ruIdx' => 0, 'travIdx' => 3, 'days' => -20, 'cap' => 18, 'price' => 650,  'cur' => 'RUB', 'status' => 'completed', 'pkgIdx' => 3],
            ['from' => 'cm', 'cmIdx' => 0, 'ruIdx' => 2, 'travIdx' => 4, 'days' => -15, 'cap' => 25, 'price' => 4800, 'cur' => 'XAF', 'status' => 'completed', 'pkgIdx' => 4],
            ['from' => 'ru', 'cmIdx' => 1, 'ruIdx' => 0, 'travIdx' => 1, 'days' => -10, 'cap' => 10, 'price' => 900,  'cur' => 'RUB', 'status' => 'completed', 'pkgIdx' => 0],

            // ── Active trips (future, verified) ──
            ['from' => 'cm', 'cmIdx' => 0, 'ruIdx' => 0, 'travIdx' => 0, 'days' => 3,  'cap' => 22, 'price' => 5200, 'cur' => 'XAF', 'status' => 'active', 'pkgIdx' => 0],
            ['from' => 'ru', 'cmIdx' => 0, 'ruIdx' => 1, 'travIdx' => 1, 'days' => 5,  'cap' => 30, 'price' => 550,  'cur' => 'RUB', 'status' => 'active', 'pkgIdx' => 1],
            ['from' => 'cm', 'cmIdx' => 1, 'ruIdx' => 0, 'travIdx' => 2, 'days' => 7,  'cap' => 8,  'price' => 6000, 'cur' => 'XAF', 'status' => 'active', 'pkgIdx' => 2],
            ['from' => 'ru', 'cmIdx' => 2, 'ruIdx' => 2, 'travIdx' => 3, 'days' => 10, 'cap' => 35, 'price' => 700,  'cur' => 'RUB', 'status' => 'active', 'pkgIdx' => 3],
            ['from' => 'cm', 'cmIdx' => 2, 'ruIdx' => 0, 'travIdx' => 4, 'days' => 12, 'cap' => 15, 'price' => 4500, 'cur' => 'XAF', 'status' => 'active', 'pkgIdx' => 4],
            ['from' => 'ru', 'cmIdx' => 0, 'ruIdx' => 0, 'travIdx' => 1, 'days' => 14, 'cap' => 20, 'price' => 750,  'cur' => 'RUB', 'status' => 'active', 'pkgIdx' => 0],
            ['from' => 'cm', 'cmIdx' => 0, 'ruIdx' => 1, 'travIdx' => 0, 'days' => 18, 'cap' => 28, 'price' => 4000, 'cur' => 'XAF', 'status' => 'active', 'pkgIdx' => 1],
            ['from' => 'ru', 'cmIdx' => 1, 'ruIdx' => 2, 'travIdx' => 3, 'days' => 20, 'cap' => 12, 'price' => 850,  'cur' => 'RUB', 'status' => 'active', 'pkgIdx' => 2],
            ['from' => 'cm', 'cmIdx' => 1, 'ruIdx' => 0, 'travIdx' => 2, 'days' => 25, 'cap' => 18, 'price' => 5800, 'cur' => 'XAF', 'status' => 'active', 'pkgIdx' => 3],
            ['from' => 'ru', 'cmIdx' => 2, 'ruIdx' => 1, 'travIdx' => 1, 'days' => 28, 'cap' => 40, 'price' => 480,  'cur' => 'RUB', 'status' => 'active', 'pkgIdx' => 4],
            ['from' => 'cm', 'cmIdx' => 2, 'ruIdx' => 2, 'travIdx' => 4, 'days' => 30, 'cap' => 14, 'price' => 5300, 'cur' => 'XAF', 'status' => 'active', 'pkgIdx' => 0],

            // ── Active trips (pending verification) ──
            ['from' => 'cm', 'cmIdx' => 0, 'ruIdx' => 0, 'travIdx' => 2, 'days' => 35, 'cap' => 16, 'price' => 4700, 'cur' => 'XAF', 'status' => 'active', 'pkgIdx' => 1, 'pending' => true],
            ['from' => 'ru', 'cmIdx' => 1, 'ruIdx' => 0, 'travIdx' => 3, 'days' => 38, 'cap' => 20, 'price' => 620,  'cur' => 'RUB', 'status' => 'active', 'pkgIdx' => 2, 'pending' => true],
            ['from' => 'cm', 'cmIdx' => 1, 'ruIdx' => 1, 'travIdx' => 0, 'days' => 40, 'cap' => 10, 'price' => 6500, 'cur' => 'XAF', 'status' => 'active', 'pkgIdx' => 4, 'pending' => true],
        ];

        $trips = [];
        foreach ($tripDefinitions as $i => $def) {
            $cm = $cmCities[$def['cmIdx']];
            $ru = $ruCities[$def['ruIdx']];
            $traveler = $travelers[$def['travIdx']];

            if (!$cm['city'] || !$ru['city']) continue;

            $isCmToRu = $def['from'] === 'cm';
            $depDate = $def['days'] > 0 ? Carbon::now()->addDays($def['days']) : Carbon::now()->subDays(abs($def['days']));
            $arrDate = $depDate->copy()->addDays(2);
            $isPending = $def['pending'] ?? false;

            $tripData = [
                'departure_country'    => $isCmToRu ? 'Cameroun' : 'Russie',
                'departure_city'       => $isCmToRu ? $cm['name'] : $ru['name'],
                'departure_country_id' => $isCmToRu ? $cameroon->id : $russia->id,
                'departure_city_id'    => $isCmToRu ? $cm['city']->id : $ru['city']->id,
                'arrival_country'      => $isCmToRu ? 'Russie' : 'Cameroun',
                'arrival_city'         => $isCmToRu ? $ru['name'] : $cm['name'],
                'arrival_country_id'   => $isCmToRu ? $russia->id : $cameroon->id,
                'arrival_city_id'      => $isCmToRu ? $ru['city']->id : $cm['city']->id,
                'departure_date'       => $depDate,
                'arrival_date'         => $arrDate,
                'available_capacity'   => $def['cap'],
                'price_per_kg'         => $def['price'],
                'accepted_package_types' => $packageTypes[$def['pkgIdx']],
                'currency_code'        => $def['cur'],
                'status'               => $def['status'],
                'verification_status'  => $isPending ? 'pending' : 'verified',
            ];

            if (!$isPending) {
                $tripData['verified_by'] = $admin?->id;
                $tripData['verified_at'] = $depDate->copy()->subDay();
            }

            $trip = Trip::firstOrCreate(
                ['traveler_id' => $traveler->id, 'departure_date' => $depDate],
                $tripData
            );

            $trips[$i] = $trip;
        }

        // Alias for shipments/ratings (first 2 completed trips)
        $trip1 = $trips[0] ?? null;
        $trip2 = $trips[1] ?? null;
        $trip3 = $trips[6] ?? null; // first active trip

        // ── Shipments ──

        if (isset($trip1) && $cameroon && $russia && $douala && $moscow) {
            $shipment1 = Shipment::firstOrCreate(
                ['sender_id' => $user3->id, 'trip_id' => $trip1->id],
                [
                    'traveler_id' => $user1->id,
                    'package_description' => 'Documents administratifs et vêtements',
                    'package_weight' => 5.00,
                    'package_length' => 40,
                    'package_width' => 30,
                    'package_height' => 20,
                    'pickup_country' => 'Cameroun',
                    'pickup_city' => 'Douala',
                    'pickup_country_id' => $cameroon->id,
                    'pickup_city_id' => $douala->id,
                    'pickup_address' => 'Akwa, Douala',
                    'delivery_country' => 'Russie',
                    'delivery_city' => 'Moscou',
                    'delivery_country_id' => $russia->id,
                    'delivery_city_id' => $moscow->id,
                    'delivery_address' => 'Arbat 10, Moscou',
                    'status' => 'delivered',
                    'payment_amount' => 25000.00,
                    'payment_status' => 'released',
                ]
            );

            $shipment2 = Shipment::firstOrCreate(
                ['sender_id' => $user4->id, 'trip_id' => $trip1->id],
                [
                    'traveler_id' => $user1->id,
                    'package_description' => 'Produits cosmétiques camerounais',
                    'package_weight' => 3.00,
                    'package_length' => 25,
                    'package_width' => 20,
                    'package_height' => 15,
                    'pickup_country' => 'Cameroun',
                    'pickup_city' => 'Douala',
                    'pickup_country_id' => $cameroon->id,
                    'pickup_city_id' => $douala->id,
                    'pickup_address' => 'Bonanjo, Douala',
                    'delivery_country' => 'Russie',
                    'delivery_city' => 'Moscou',
                    'delivery_country_id' => $russia->id,
                    'delivery_city_id' => $moscow->id,
                    'delivery_address' => 'Tverskaya 25, Moscou',
                    'status' => 'delivered',
                    'payment_amount' => 15000.00,
                    'payment_status' => 'released',
                ]
            );
        }

        if (isset($trip2) && $cameroon && $russia && $douala && $moscow) {
            $shipment3 = Shipment::firstOrCreate(
                ['sender_id' => $user4->id, 'trip_id' => $trip2->id],
                [
                    'traveler_id' => $user2->id,
                    'package_description' => 'Livres et matériel informatique',
                    'package_weight' => 8.00,
                    'package_length' => 50,
                    'package_width' => 35,
                    'package_height' => 25,
                    'pickup_country' => 'Russie',
                    'pickup_city' => 'Moscou',
                    'pickup_country_id' => $russia->id,
                    'pickup_city_id' => $moscow->id,
                    'pickup_address' => 'Prospect Mira 12, Moscou',
                    'delivery_country' => 'Cameroun',
                    'delivery_city' => 'Douala',
                    'delivery_country_id' => $cameroon->id,
                    'delivery_city_id' => $douala->id,
                    'delivery_address' => 'Bonapriso, Douala',
                    'status' => 'delivered',
                    'payment_amount' => 6400.00,
                    'payment_status' => 'released',
                ]
            );
        }

        if (isset($trip3) && $cameroon && $russia && $douala && $moscow) {
            $shipment4 = Shipment::firstOrCreate(
                ['sender_id' => $user5->id, 'trip_id' => $trip3->id],
                [
                    'traveler_id' => $user1->id,
                    'package_description' => 'Épices et produits alimentaires',
                    'package_weight' => 2.00,
                    'package_length' => 30,
                    'package_width' => 25,
                    'package_height' => 10,
                    'pickup_country' => 'Cameroun',
                    'pickup_city' => 'Douala',
                    'pickup_country_id' => $cameroon->id,
                    'pickup_city_id' => $douala->id,
                    'pickup_address' => 'Marché Central, Douala',
                    'delivery_country' => 'Russie',
                    'delivery_city' => 'Moscou',
                    'delivery_country_id' => $russia->id,
                    'delivery_city_id' => $moscow->id,
                    'delivery_address' => 'Leninsky Prospect 15, Moscou',
                    'status' => 'accepted',
                    'payment_amount' => 10400.00,
                    'payment_status' => 'escrowed',
                ]
            );
        }

        // ── Ratings ──

        if (isset($shipment1)) {
            Rating::firstOrCreate(
                ['from_user_id' => $user3->id, 'to_user_id' => $user1->id, 'shipment_id' => $shipment1->id],
                ['rating' => 5, 'comment' => 'Excellente livraison, très rapide et soigneuse !']
            );
            Rating::firstOrCreate(
                ['from_user_id' => $user1->id, 'to_user_id' => $user3->id, 'shipment_id' => $shipment1->id],
                ['rating' => 5, 'comment' => 'Colis bien emballé, expéditeur fiable.']
            );
        }

        if (isset($shipment2)) {
            Rating::firstOrCreate(
                ['from_user_id' => $user4->id, 'to_user_id' => $user1->id, 'shipment_id' => $shipment2->id],
                ['rating' => 4, 'comment' => 'Bon service, un peu de retard mais tout est arrivé intact.']
            );
            Rating::firstOrCreate(
                ['from_user_id' => $user1->id, 'to_user_id' => $user4->id, 'shipment_id' => $shipment2->id],
                ['rating' => 5, 'comment' => 'Colis parfait, merci !']
            );
        }

        if (isset($shipment3)) {
            Rating::firstOrCreate(
                ['from_user_id' => $user4->id, 'to_user_id' => $user2->id, 'shipment_id' => $shipment3->id],
                ['rating' => 5, 'comment' => 'Très bon transporteur, je recommande fortement.']
            );
            Rating::firstOrCreate(
                ['from_user_id' => $user2->id, 'to_user_id' => $user4->id, 'shipment_id' => $shipment3->id],
                ['rating' => 4, 'comment' => 'Bon expéditeur, emballage correct.']
            );
        }

        // ── Wallets ──

        foreach ($approvedUsers as $user) {
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'balance' => round(rand(1000, 50000) / 100, 2),
                    'currency_code' => $user->currency_code ?? 'RUB',
                ]
            );

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
        $this->command->info('10 demo users created (Cameroun + Russie):');
        $this->command->info('  - 5 with approved KYC (with trips, shipments, ratings, wallets)');
        $this->command->info('  - 2 with pending KYC');
        $this->command->info('  - 1 with rejected KYC');
        $this->command->info('  - 2 new users (pending, no KYC document submitted)');
        $this->command->info('  - 20 trips across Cameroun↔Russie (6 completed, 11 active verified, 3 pending verification)');
        $this->command->info('  - 4 shipments with ratings');
        $this->command->info('All demo users password: password');
    }
}
