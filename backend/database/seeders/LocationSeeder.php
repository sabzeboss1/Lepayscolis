<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\Country;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $locations = [
            // Europe (Russie uniquement)
            'Russie' => [
                'continent' => 'europe',
                'cities' => [
                    'Moscou', 'Saint-Pétersbourg', 'Novossibirsk', 'Iekaterinbourg',
                    'Kazan', 'Nijni Novgorod', 'Tcheliabinsk', 'Samara', 'Omsk',
                    'Rostov-sur-le-Don', 'Oufa', 'Krasnoïarsk', 'Voronej', 'Perm', 'Volgograd',
                ],
            ],
            
            // Afrique
            'Cameroun' => [
                'continent' => 'africa',
                'cities' => ['Yaoundé', 'Douala', 'Garoua', 'Bamenda', 'Bafoussam'],
            ],
            "Côte d'Ivoire" => [
                'continent' => 'africa',
                'cities' => ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa'],
            ],
            'Sénégal' => [
                'continent' => 'africa',
                'cities' => ['Dakar', 'Thiès', 'Saint-Louis', 'Kaolack'],
            ],
            'Mali' => [
                'continent' => 'africa',
                'cities' => ['Bamako', 'Sikasso', 'Mopti'],
            ],
            'Burkina Faso' => [
                'continent' => 'africa',
                'cities' => ['Ouagadougou', 'Bobo-Dioulasso'],
            ],
            'Bénin' => [
                'continent' => 'africa',
                'cities' => ['Cotonou', 'Porto-Novo'],
            ],
            'Togo' => [
                'continent' => 'africa',
                'cities' => ['Lomé', 'Sokodé'],
            ],
            'Gabon' => [
                'continent' => 'africa',
                'cities' => ['Libreville', 'Port-Gentil'],
            ],
            'Congo' => [
                'continent' => 'africa',
                'cities' => ['Brazzaville', 'Pointe-Noire'],
            ],
            'RD Congo' => [
                'continent' => 'africa',
                'cities' => ['Kinshasa', 'Lubumbashi'],
            ],
            
            // Autres (pour référence future)
            'France' => [
                'continent' => 'other',
                'cities' => ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
            ],
            'Belgique' => [
                'continent' => 'other',
                'cities' => ['Bruxelles', 'Anvers', 'Liège'],
            ],
            'Canada' => [
                'continent' => 'other',
                'cities' => ['Montréal', 'Québec', 'Ottawa', 'Toronto'],
            ],
        ];

        foreach ($locations as $countryName => $data) {
            $country = Country::create([
                'name' => $countryName,
                'continent' => $data['continent'],
                'is_active' => true,
            ]);

            foreach ($data['cities'] as $cityName) {
                City::create([
                    'country_id' => $country->id,
                    'name' => $cityName,
                    'is_active' => true,
                ]);
            }
        }
    }
}
