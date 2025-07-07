import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { isAuthenticated } from '@/auth';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const location = usePathname();
  const isLoggedIn = isAuthenticated();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Search' },
    { path: '/collections', label: 'Collections' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-2xl font-bold">
                BookLens
              </Link>
              <nav className="hidden md:flex gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location === item.path
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Button variant="outline" asChild>
                  <Link href="/profile">Profile</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} BookLens. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 