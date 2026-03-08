import './globals.css';
import { AuthProvider } from '@/lib/context/AuthContext';
import { LanguageProvider } from './lib/i18n/useLanguage';
import { ToastProvider } from '@/lib/context/ToastContext';

export const metadata = {
  title: 'Flowly - AI Social Media Manager',
  description: 'Generate stunning social media content with AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <AuthProvider>
          <LanguageProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
