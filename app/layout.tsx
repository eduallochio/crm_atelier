import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Meu Atelier - Sistema de Gestão para Ateliês de Costura e Artesanato",
  description: "Sistema completo de gestão para ateliês: controle de clientes, ordens de serviço, financeiro e muito mais. Grátis para começar, sem cartão de crédito.",
  keywords: [
    "CRM para ateliê",
    "gestão de ateliê",
    "sistema para costura",
    "controle de ordens de serviço",
    "gestão de clientes",
    "software para costureira",
    "gestão financeira ateliê",
    "sistema para artesanato"
  ],
  authors: [{ name: "Meu Atelier" }],
  creator: "Meu Atelier",
  publisher: "Meu Atelier",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://meuatelier.com.br'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Meu Atelier - Sistema de Gestão para Ateliês",
    description: "Sistema completo de gestão para ateliês: controle de clientes, ordens de serviço, financeiro e muito mais. Grátis para começar.",
    url: 'https://meuatelier.com.br',
    siteName: 'Meu Atelier',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Meu Atelier - Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Meu Atelier - Sistema de Gestão para Ateliês",
    description: "Sistema completo de gestão para ateliês: controle de clientes, ordens de serviço, financeiro e muito mais.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'seu-codigo-google-search-console',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
