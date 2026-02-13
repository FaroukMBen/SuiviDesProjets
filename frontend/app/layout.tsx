import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import NextTopLoader from "nextjs-toploader"
import { ToastProvider } from '@/components/ui/Toast'
import { ConfirmProvider } from '@/components/ui/ConfirmDialog'

export const metadata: Metadata = {
  title: 'Nexus Project - University Project Management',
  description: 'Manage, evaluate, and collaborate on university projects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <NextTopLoader
          color="#2563EB"
          height={4}
          showSpinner={false}
          shadow="0 0 10px #2563EB,0 0 5px #2563EB"
        />
        <AuthProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
            </ConfirmProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
