'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  MapPin,
  Search,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';

interface Country {
  id: number;
  name: string;
  code: string | null;
  is_active: boolean;
  cities: City[];
  created_at: string;
  updated_at: string;
}

interface City {
  id: number;
  country_id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function LocationManagementPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [selectedCountryForCity, setSelectedCountryForCity] = useState<number | null>(null);
  
  // Form data
  const [countryForm, setCountryForm] = useState({ name: '', code: '', is_active: true });
  const [cityForm, setCityForm] = useState({ name: '', country_id: 0, is_active: true });
  
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      
      const response = await fetch('/api/admin/locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch locations');
      
      const data = await response.json();
      setCountries(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCountry = () => {
    setEditingCountry(null);
    setCountryForm({ name: '', code: '', is_active: true });
    setShowCountryModal(true);
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
    setCountryForm({ 
      name: country.name, 
      code: country.code || '', 
      is_active: country.is_active 
    });
    setShowCountryModal(true);
  };

  const handleAddCity = (countryId: number) => {
    setEditingCity(null);
    setSelectedCountryForCity(countryId);
    setCityForm({ name: '', country_id: countryId, is_active: true });
    setShowCityModal(true);
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityForm({ 
      name: city.name, 
      country_id: city.country_id, 
      is_active: city.is_active 
    });
    setShowCityModal(true);
  };

  const handleSubmitCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const url = editingCountry 
        ? `/api/admin/locations/countries/${editingCountry.id}`
        : '/api/admin/locations/countries';
      
      const response = await fetch(url, {
        method: editingCountry ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(countryForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save country');
      }

      setSuccessMessage(editingCountry ? 'Pays modifié avec succès' : 'Pays ajouté avec succès');
      setShowCountryModal(false);
      fetchLocations();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save country');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const url = editingCity 
        ? `/api/admin/locations/cities/${editingCity.id}`
        : '/api/admin/locations/cities';
      
      const response = await fetch(url, {
        method: editingCity ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(cityForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save city');
      }

      setSuccessMessage(editingCity ? 'Ville modifiée avec succès' : 'Ville ajoutée avec succès');
      setShowCityModal(false);
      fetchLocations();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save city');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCountry = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pays et toutes ses villes ?')) return;

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      
      const response = await fetch(`/api/admin/locations/countries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete country');

      setSuccessMessage('Pays supprimé avec succès');
      fetchLocations();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete country');
    }
  };

  const handleDeleteCity = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ville ?')) return;

    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      
      const response = await fetch(`/api/admin/locations/cities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete city');

      setSuccessMessage('Ville supprimée avec succès');
      fetchLocations();
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete city');
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.cities.some(city => city.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestion des Localisations</h1>
        <p className="text-gray-600">Gérez les pays et villes disponibles sur la plateforme</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un pays ou une ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button onClick={handleAddCountry} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un pays
        </Button>
      </div>

      {/* Countries List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCountries.map((country) => (
            <div key={country.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Country Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{country.name}</h3>
                    <p className="text-sm text-gray-600">{country.cities.length} ville(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCity(country.id)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ville
                  </Button>
                  <button
                    onClick={() => handleEditCountry(country)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCountry(country.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Cities List */}
              {country.cities.length > 0 && (
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {country.cities.map((city) => (
                      <div
                        key={city.id}
                        className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{city.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditCity(city)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCity(city.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredCountries.length === 0 && (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
              <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Aucun pays trouvé</p>
            </div>
          )}
        </div>
      )}

      {/* Country Modal */}
      {showCountryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCountry ? 'Modifier le pays' : 'Ajouter un pays'}
              </h2>
              <button
                onClick={() => setShowCountryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCountry} className="space-y-4">
              <Input
                label="Nom du pays"
                value={countryForm.name}
                onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                required
                placeholder="Ex: France"
              />
              
              <Input
                label="Code pays (optionnel)"
                value={countryForm.code}
                onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value })}
                placeholder="Ex: FR"
                maxLength={2}
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={countryForm.is_active}
                  onChange={(e) => setCountryForm({ ...countryForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Actif</span>
              </label>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCountryModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  loading={submitting}
                  className="flex-1"
                >
                  {editingCountry ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* City Modal */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCity ? 'Modifier la ville' : 'Ajouter une ville'}
              </h2>
              <button
                onClick={() => setShowCityModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCity} className="space-y-4">
              <Input
                label="Nom de la ville"
                value={cityForm.name}
                onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                required
                placeholder="Ex: Paris"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cityForm.is_active}
                  onChange={(e) => setCityForm({ ...cityForm, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCityModal(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  loading={submitting}
                  className="flex-1"
                >
                  {editingCity ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
