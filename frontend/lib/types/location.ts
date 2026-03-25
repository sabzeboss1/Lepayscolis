/**
 * Country and City types matching the backend API response
 */

export interface City {
  id: number;
  name: string;
  name_en: string;
  name_fr: string;
  country_id: number;
  is_active: boolean;
}

export interface Country {
  id: number;
  name: string;
  name_en: string;
  name_fr: string;
  code: string;
  phone_code: string;
  default_currency_code: string;
  is_active: boolean;
  cities: City[];
}
