import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LePaysExpressColis - Transport de Colis Russie ↔ Afrique",
  description: "Envoyez vos colis entre la Russie et l'Afrique avec des voyageurs de confiance. Livraison sûre, abordable et communautaire. Économisez jusqu'à 70%.",
  keywords: ['transport colis', 'Russie Afrique', 'livraison communautaire', 'voyageur confiance', 'envoi colis pas cher'],
  authors: [{ name: 'LePaysExpressColis' }],
  openGraph: {
    title: 'LePaysExpressColis - Transport de Colis Russie ↔ Afrique',
    description: 'Connectez-vous avec des voyageurs de confiance pour une livraison rapide, sûre et économique.',
    type: 'website',
    locale: 'fr_FR',
    siteName: 'LePaysExpressColis',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LePaysExpressColis - Transport de Colis Russie ↔ Afrique',
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
