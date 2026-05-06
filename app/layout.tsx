import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Sidebar from '@/components/layout/Sidebar'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Dylan's Hub",
  description: 'Personal dashboard — sports, news, markets, finances, schedule, todos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  )
}
