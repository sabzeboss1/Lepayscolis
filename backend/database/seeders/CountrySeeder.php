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
            ['code' => 'CM', 'name_en' => 'Cameroon', 'name_fr' => 'Cameroun', 'phone_code' => '+237', 'default_currency_code' => 'XAF', 'default_locale' => 'fr'],
            ['code' => 'RU', 'name_en' => 'Russia', 'name_fr' => 'Russie', 'phone_code' => '+7', 'default_currency_code' => 'RUB', 'default_locale' => 'en'],
        ];

        foreach ($countries as $data) {
            Country::updateOrCreate(
                ['code' => $data['code']],
                $data
            );
        }

        // Seed cities
        $cities = [
            'CM' => [
                ['name_en' => 'Douala', 'name_fr' => 'Douala'],
                ['name_en' => 'Yaoundé', 'name_fr' => 'Yaoundé'],
                ['name_en' => 'Bafoussam', 'name_fr' => 'Bafoussam'],
                ['name_en' => 'Bamenda', 'name_fr' => 'Bamenda'],
                ['name_en' => 'Garoua', 'name_fr' => 'Garoua'],
                ['name_en' => 'Kribi', 'name_fr' => 'Kribi'],
            ],
            'RU' => [
                ['name_en' => 'Moscow', 'name_fr' => 'Moscou'],
                ['name_en' => 'Saint Petersburg', 'name_fr' => 'Saint-Pétersbourg'],
                ['name_en' => 'Kazan', 'name_fr' => 'Kazan'],
                ['name_en' => 'Rostov-on-Don', 'name_fr' => 'Rostov-sur-le-Don'],
                ['name_en' => 'Novosibirsk', 'name_fr' => 'Novossibirsk'],
                ['name_en' => 'Krasnodar', 'name_fr' => 'Krasnodar'],
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
