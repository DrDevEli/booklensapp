import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { isAuthenticated } from '@/auth';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isLoggedIn = isAuthenticated();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/search', label: 'Search' },
    { path: '/collections', label: 'Collections' },
  ];

  return (
    <div className="min-h-screen bg-background font-sans" style={{ backgroundImage: 'url(/booklens_pattern1.png)', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}>
      <header className="border-b bg-opacity-90 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-2">
                <img src="/booklens_logo_option3.png" alt="BookLens Logo" className="h-10 w-auto" />
                <span className="text-2xl font-heading text-primary" style={{ fontFamily: 'Montserrat, sans-serif' }}>BookLens</span>
              </Link>
              <nav className="hidden md:flex gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-medium transition-colors hover:text-primary ${
                      location.pathname === item.path
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}
                    style={{ fontFamily: 'Open Sans, sans-serif' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {isLoggedIn ? (
                <Button variant="outline" asChild>
                  <Link to="/profile">Profile</Link>
                </Button>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register">Register</Link>
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