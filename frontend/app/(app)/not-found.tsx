import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-bold text-gray-900">
            Page non trouvée
          </h2>
          <p className="text-gray-600">
            Désolé, nous n'avons pas pu trouver la page que vous recherchez.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="primary">
              Retour au tableau de bord
            </Button>
          </Link>
          <Link href="/trips/search">
            <Button variant="outline">
              Rechercher des voyages
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
