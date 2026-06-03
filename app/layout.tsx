import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { Providers } from '@/providers'
import './globals.css'

// KURO Design System — Geist Sans (UI + headings) + Geist Mono (IDs, labels
// uppercase, placeholders). Weights 400/500/600 (sin 700+).
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400', '500'],
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common')
  return {
    title: {
      default: t('meta.appName'),
      template: t('meta.titleTemplate'),
    },
    description: t('meta.appDescription'),
    metadataBase: new URL('https://kuro.app'),
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}