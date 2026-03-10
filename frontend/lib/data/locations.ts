// Demo data for cities and countries
export interface Location {
  city: string;
  country: string;
  countryCode: string;
}

export const DEMO_LOCATIONS: Location[] = [
  // Russie
  { city: 'Moscou', country: 'Russie', countryCode: 'RU' },
  { city: 'Saint-Pétersbourg', country: 'Russie', countryCode: 'RU' },
  { city: 'Novossibirsk', country: 'Russie', countryCode: 'RU' },
  { city: 'Iekaterinbourg', country: 'Russie', countryCode: 'RU' },
  { city: 'Kazan', country: 'Russie', countryCode: 'RU' },
  { city: 'Nijni Novgorod', country: 'Russie', countryCode: 'RU' },
  { city: 'Tcheliabinsk', country: 'Russie', countryCode: 'RU' },
  { city: 'Samara', country: 'Russie', countryCode: 'RU' },
  { city: 'Omsk', country: 'Russie', countryCode: 'RU' },
  { city: 'Rostov-sur-le-Don', country: 'Russie', countryCode: 'RU' },
  { city: 'Oufa', country: 'Russie', countryCode: 'RU' },
  { city: 'Krasnoïarsk', country: 'Russie', countryCode: 'RU' },
  { city: 'Voronej', country: 'Russie', countryCode: 'RU' },
  { city: 'Perm', country: 'Russie', countryCode: 'RU' },
  { city: 'Volgograd', country: 'Russie', countryCode: 'RU' },
  
  // France
  { city: 'Paris', country: 'France', countryCode: 'FR' },
  { city: 'Lyon', country: 'France', countryCode: 'FR' },
  { city: 'Marseille', country: 'France', countryCode: 'FR' },
  { city: 'Toulouse', country: 'France', countryCode: 'FR' },
  { city: 'Nice', country: 'France', countryCode: 'FR' },
  
  // Cameroun
  { city: 'Yaoundé', country: 'Cameroun', countryCode: 'CM' },
  { city: 'Douala', country: 'Cameroun', countryCode: 'CM' },
  { city: 'Garoua', country: 'Cameroun', countryCode: 'CM' },
  { city: 'Bamenda', country: 'Cameroun', countryCode: 'CM' },
  { city: 'Bafoussam', country: 'Cameroun', countryCode: 'CM' },
  
  // Côte d'Ivoire
  { city: 'Abidjan', country: "Côte d'Ivoire", countryCode: 'CI' },
  { city: 'Yamoussoukro', country: "Côte d'Ivoire", countryCode: 'CI' },
  { city: 'Bouaké', country: "Côte d'Ivoire", countryCode: 'CI' },
  { city: 'Daloa', country: "Côte d'Ivoire", countryCode: 'CI' },
  
  // Sénégal
  { city: 'Dakar', country: 'Sénégal', countryCode: 'SN' },
  { city: 'Thiès', country: 'Sénégal', countryCode: 'SN' },
  { city: 'Saint-Louis', country: 'Sénégal', countryCode: 'SN' },
  { city: 'Kaolack', country: 'Sénégal', countryCode: 'SN' },
  
  // Mali
  { city: 'Bamako', country: 'Mali', countryCode: 'ML' },
  { city: 'Sikasso', country: 'Mali', countryCode: 'ML' },
  { city: 'Mopti', country: 'Mali', countryCode: 'ML' },
  
  // Burkina Faso
  { city: 'Ouagadougou', country: 'Burkina Faso', countryCode: 'BF' },
  { city: 'Bobo-Dioulasso', country: 'Burkina Faso', countryCode: 'BF' },
  
  // Bénin
  { city: 'Cotonou', country: 'Bénin', countryCode: 'BJ' },
  { city: 'Porto-Novo', country: 'Bénin', countryCode: 'BJ' },
  
  // Togo
  { city: 'Lomé', country: 'Togo', countryCode: 'TG' },
  { city: 'Sokodé', country: 'Togo', countryCode: 'TG' },
  
  // Gabon
  { city: 'Libreville', country: 'Gabon', countryCode: 'GA' },
  { city: 'Port-Gentil', country: 'Gabon', countryCode: 'GA' },
  
  // Congo
  { city: 'Brazzaville', country: 'Congo', countryCode: 'CG' },
  { city: 'Pointe-Noire', country: 'Congo', countryCode: 'CG' },
  
  // RDC
  { city: 'Kinshasa', country: 'RD Congo', countryCode: 'CD' },
  { city: 'Lubumbashi', country: 'RD Congo', countryCode: 'CD' },
  
  // Belgique
  { city: 'Bruxelles', country: 'Belgique', countryCode: 'BE' },
  { city: 'Anvers', country: 'Belgique', countryCode: 'BE' },
  { city: 'Liège', country: 'Belgique', countryCode: 'BE' },
  
  // Canada
  { city: 'Montréal', country: 'Canada', countryCode: 'CA' },
  { city: 'Québec', country: 'Canada', countryCode: 'CA' },
  { city: 'Ottawa', country: 'Canada', countryCode: 'CA' },
  { city: 'Toronto', country: 'Canada', countryCode: 'CA' },
];

// Get unique countries
export const getCountries = (): string[] => {
  const countries = new Set(DEMO_LOCATIONS.map(loc => loc.country));
  return Array.from(countries).sort();
};

// Get cities for a specific country
export const getCitiesByCountry = (country: string): string[] => {
  return DEMO_LOCATIONS
    .filter(loc => loc.country === country)
    .map(loc => loc.city)
    .sort();
};

// Get location by city and country
export const getLocation = (city: string, country: string): Location | undefined => {
  return DEMO_LOCATIONS.find(
    loc => loc.city === city && loc.country === country
  );
};
