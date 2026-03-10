'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TripsPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to search page by default
        router.replace('/trips/search');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Redirection...</div>
        </div>
    );
}
