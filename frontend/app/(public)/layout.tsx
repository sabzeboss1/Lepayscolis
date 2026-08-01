import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Envoyez vos colis entre la Russie et l'Afrique avec des voyageurs de confiance. Livraison sûre, abordable et communautaire. Économisez jusqu'à 70%.",
  keywords: ['transport colis', 'Russie Afrique', 'livraison communautaire', 'voyageur confiance', 'envoi colis pas cher'],
  openGraph: {
    description: 'Connectez-vous avec des voyageurs de confiance pour une livraison rapide, sûre et économique.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    description: 'Envoyez vos colis entre la Russie et l\'Afrique avec des voyageurs de confiance.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
