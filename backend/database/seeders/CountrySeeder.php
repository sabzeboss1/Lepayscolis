<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Country;
use Illuminate\Database\Seeder;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            // Russia
            ['code' => 'RU', 'name_en' => 'Russia', 'name_fr' => 'Russie', 'phone_code' => '+7', 'default_currency_code' => 'RUB', 'default_locale' => 'en'],

            // West Africa (CFA XOF)
            ['code' => 'SN', 'name_en' => 'Senegal', 'name_fr' => 'Sénégal', 'phone_code' => '+221', 'default_currency_code' => 'XOF', 'default_locale' => 'fr'],
            ['code' => 'CI', 'name_en' => 'Ivory Coast', 'name_fr' => 'Côte d\'Ivoire', 'phone_code' => '+225', 'default_currency_code' => 'XOF', 'default_locale' => 'fr'],
            ['code' => 'ML', 'name_en' => 'Mali', 'name_fr' => 'Mali', 'phone_code' => '+223', 'default_currency_code' => 'XOF', 'default_locale' => 'fr'],
            ['code' => 'BF', 'name_en' => 'Burkina Faso', 'name_fr' => 'Burkina Faso', 'phone_code' => '+226', 'default_currency_code' => 'XOF', 'default_locale' => 'fr'],
            ['code' => 'TG', 'name_en' => 'Togo', 'name_fr' => 'Togo', 'phone_code' => '+228', 'default_currency_code' => 'XOF', 'default_locale' => 'fr'],
            ['code' => 'BJ', 'name_en' => 'Benin', 'name_fr' => 'Bénin', 'phone_code' => '+229', 'default_currency_code' => 'XOF', 'default_locale' => 'fr'],
            ['code' => 'NE', 'name_en' => 'Niger', 'name_fr' => 'Niger', 'phone_code' => '+227', 'default_currency_code' => 'XOF', 'default_locale' => 'fr'],
            ['code' => 'GW', 'name_en' => 'Guinea-Bissau', 'name_fr' => 'Guinée-Bissau', 'phone_code' => '+245', 'default_currency_code' => 'XOF', 'default_locale' => 'fr'],

            // Central Africa (CFA XAF)
            ['code' => 'CM', 'name_en' => 'Cameroon', 'name_fr' => 'Cameroun', 'phone_code' => '+237', 'default_currency_code' => 'XAF', 'default_locale' => 'fr'],
            ['code' => 'GA', 'name_en' => 'Gabon', 'name_fr' => 'Gabon', 'phone_code' => '+241', 'default_currency_code' => 'XAF', 'default_locale' => 'fr'],
            ['code' => 'CG', 'name_en' => 'Congo', 'name_fr' => 'Congo', 'phone_code' => '+242', 'default_currency_code' => 'XAF', 'default_locale' => 'fr'],
            ['code' => 'TD', 'name_en' => 'Chad', 'name_fr' => 'Tchad', 'phone_code' => '+235', 'default_currency_code' => 'XAF', 'default_locale' => 'fr'],
            ['code' => 'CF', 'name_en' => 'Central African Republic', 'name_fr' => 'République centrafricaine', 'phone_code' => '+236', 'default_currency_code' => 'XAF', 'default_locale' => 'fr'],

            // Other Africa
            ['code' => 'CD', 'name_en' => 'DR Congo', 'name_fr' => 'RD Congo', 'phone_code' => '+243', 'default_currency_code' => 'USD', 'default_locale' => 'fr'],
            ['code' => 'GN', 'name_en' => 'Guinea', 'name_fr' => 'Guinée', 'phone_code' => '+224', 'default_currency_code' => null, 'default_locale' => 'fr'],
            ['code' => 'MA', 'name_en' => 'Morocco', 'name_fr' => 'Maroc', 'phone_code' => '+212', 'default_currency_code' => null, 'default_locale' => 'fr'],
            ['code' => 'MG', 'name_en' => 'Madagascar', 'name_fr' => 'Madagascar', 'phone_code' => '+261', 'default_currency_code' => null, 'default_locale' => 'fr'],

            // Transit / European
            ['code' => 'FR', 'name_en' => 'France', 'name_fr' => 'France', 'phone_code' => '+33', 'default_currency_code' => 'EUR', 'default_locale' => 'fr'],
            ['code' => 'DE', 'name_en' => 'Germany', 'name_fr' => 'Allemagne', 'phone_code' => '+49', 'default_currency_code' => 'EUR', 'default_locale' => 'en'],
            ['code' => 'BE', 'name_en' => 'Belgium', 'name_fr' => 'Belgique', 'phone_code' => '+32', 'default_currency_code' => 'EUR', 'default_locale' => 'fr'],
            ['code' => 'TR', 'name_en' => 'Turkey', 'name_fr' => 'Turquie', 'phone_code' => '+90', 'default_currency_code' => null, 'default_locale' => 'en'],
        ];

        foreach ($countries as $data) {
            Country::updateOrCreate(
                ['code' => $data['code']],
                $data
            );
        }

        // Seed cities
        $cities = [
            'RU' => [
                ['name_en' => 'Moscow', 'name_fr' => 'Moscou'],
                ['name_en' => 'Saint Petersburg', 'name_fr' => 'Saint-Pétersbourg'],
                ['name_en' => 'Kazan', 'name_fr' => 'Kazan'],
                ['name_en' => 'Rostov-on-Don', 'name_fr' => 'Rostov-sur-le-Don'],
            ],
            'SN' => [
                ['name_en' => 'Dakar', 'name_fr' => 'Dakar'],
                ['name_en' => 'Saint-Louis', 'name_fr' => 'Saint-Louis'],
                ['name_en' => 'Thiès', 'name_fr' => 'Thiès'],
            ],
            'CI' => [
                ['name_en' => 'Abidjan', 'name_fr' => 'Abidjan'],
                ['name_en' => 'Yamoussoukro', 'name_fr' => 'Yamoussoukro'],
                ['name_en' => 'Bouaké', 'name_fr' => 'Bouaké'],
            ],
            'CM' => [
                ['name_en' => 'Douala', 'name_fr' => 'Douala'],
                ['name_en' => 'Yaoundé', 'name_fr' => 'Yaoundé'],
                ['name_en' => 'Bafoussam', 'name_fr' => 'Bafoussam'],
            ],
            'GA' => [
                ['name_en' => 'Libreville', 'name_fr' => 'Libreville'],
                ['name_en' => 'Port-Gentil', 'name_fr' => 'Port-Gentil'],
            ],
            'CG' => [
                ['name_en' => 'Brazzaville', 'name_fr' => 'Brazzaville'],
                ['name_en' => 'Pointe-Noire', 'name_fr' => 'Pointe-Noire'],
            ],
            'CD' => [
                ['name_en' => 'Kinshasa', 'name_fr' => 'Kinshasa'],
                ['name_en' => 'Lubumbashi', 'name_fr' => 'Lubumbashi'],
            ],
            'ML' => [
                ['name_en' => 'Bamako', 'name_fr' => 'Bamako'],
            ],
            'BF' => [
                ['name_en' => 'Ouagadougou', 'name_fr' => 'Ouagadougou'],
                ['name_en' => 'Bobo-Dioulasso', 'name_fr' => 'Bobo-Dioulasso'],
            ],
            'GN' => [
                ['name_en' => 'Conakry', 'name_fr' => 'Conakry'],
            ],
            'MA' => [
                ['name_en' => 'Casablanca', 'name_fr' => 'Casablanca'],
                ['name_en' => 'Rabat', 'name_fr' => 'Rabat'],
                ['name_en' => 'Marrakech', 'name_fr' => 'Marrakech'],
            ],
            'MG' => [
                ['name_en' => 'Antananarivo', 'name_fr' => 'Antananarivo'],
            ],
            'TG' => [
                ['name_en' => 'Lomé', 'name_fr' => 'Lomé'],
            ],
            'BJ' => [
                ['name_en' => 'Cotonou', 'name_fr' => 'Cotonou'],
                ['name_en' => 'Porto-Novo', 'name_fr' => 'Porto-Novo'],
            ],
            'NE' => [
                ['name_en' => 'Niamey', 'name_fr' => 'Niamey'],
            ],
            'TD' => [
                ['name_en' => 'N\'Djamena', 'name_fr' => 'N\'Djaména'],
            ],
            'CF' => [
                ['name_en' => 'Bangui', 'name_fr' => 'Bangui'],
            ],
            'GW' => [
                ['name_en' => 'Bissau', 'name_fr' => 'Bissau'],
            ],
            'FR' => [
                ['name_en' => 'Paris', 'name_fr' => 'Paris'],
                ['name_en' => 'Marseille', 'name_fr' => 'Marseille'],
                ['name_en' => 'Lyon', 'name_fr' => 'Lyon'],
            ],
            'DE' => [
                ['name_en' => 'Berlin', 'name_fr' => 'Berlin'],
                ['name_en' => 'Frankfurt', 'name_fr' => 'Francfort'],
            ],
            'BE' => [
                ['name_en' => 'Brussels', 'name_fr' => 'Bruxelles'],
            ],
            'TR' => [
                ['name_en' => 'Istanbul', 'name_fr' => 'Istanbul'],
                ['name_en' => 'Ankara', 'name_fr' => 'Ankara'],
            ],
        ];

        foreach ($cities as $countryCode => $cityList) {
            $country = Country::where('code', $countryCode)->first();
            if (!$country) {
                continue;
            }

            foreach ($cityList as $cityData) {
                City::updateOrCreate(
                    ['country_id' => $country->id, 'name_en' => $cityData['name_en']],
                    array_merge($cityData, ['country_id' => $country->id])
                );
            }
        }
    }
}
