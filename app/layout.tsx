import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CRM Atelier - Sistema de Gestão para Ateliês de Costura e Artesanato",
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
  authors: [{ name: "CRM Atelier" }],
  creator: "CRM Atelier",
  publisher: "CRM Atelier",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://crmatelier.com.br'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "CRM Atelier - Sistema de Gestão para Ateliês",
    description: "Sistema completo de gestão para ateliês: controle de clientes, ordens de serviço, financeiro e muito mais. Grátis para começar.",
    url: 'https://crmatelier.com.br',
    siteName: 'CRM Atelier',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CRM Atelier - Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "CRM Atelier - Sistema de Gestão para Ateliês",
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
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}
