import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { ProductionProvider } from '@/context/ProductionContext';
import { Navbar } from '@/components/Navbar';
import { Toast } from '@/components/Toast';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800']
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: 'BagTime - Sistema de Tempos de Produção & Cronoanálise Lean',
  description: 'Sistema industrial de cálculo de tempos de produção, cronoanálise por micro-operações e acompanhamento de eficiência de Big Bags. Desenvolvido por Mauricio Grigol.',
  authors: [{ name: 'Mauricio Grigol' }]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${outfit.variable} ${inter.variable} font-sans bg-[#060a13] text-slate-100 min-h-screen antialiased flex flex-col selection:bg-cyan-500 selection:text-slate-950`}>
        <ProductionProvider>
          <Navbar />
          <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
            {children}
          </main>
          <Toast />
        </ProductionProvider>
      </body>
    </html>
  );
}
