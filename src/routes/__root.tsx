import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { ToastProvider } from '../components/ui'
import { AuthProvider } from '../lib/auth-client'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content:
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
      },
      {
        title: 'Best Official App — Youth Football Club',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="so">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-pitch font-body text-chalk antialiased selection:bg-gold selection:text-pitch">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>

        <Scripts />
      </body>
    </html>
  )
}
