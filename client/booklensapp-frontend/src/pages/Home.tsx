import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const featuredBooks = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    description: "A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
    cover: "https://covers.openlibrary.org/b/id/12749891-L.jpg"
  },
  {
    id: 2,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    description: "The story of racial injustice and the loss of innocence in the American South.",
    cover: "https://covers.openlibrary.org/b/id/12749892-L.jpg"
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    description: "A dystopian social science fiction novel and cautionary tale.",
    cover: "https://covers.openlibrary.org/b/id/12749893-L.jpg"
  }
];

export function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section
        className="relative text-center space-y-6 py-20 rounded-2xl shadow-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4A007F 0%, #00E6E6 100%)',
        }}
      >
        <img
          src="/booklens_pattern1.png"
          alt="BookLens Abstract Pattern"
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
        />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <img
            src="/booklens_logo_option3.png"
            alt="BookLens Logo Hero"
            className="mx-auto mb-6 h-24 w-auto drop-shadow-lg"
          />
          <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tighter text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Discover Books with AI-Powered Insight
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-2xl text-white/90 mb-8" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            BookLens helps you explore, collect, and understand books—powered by artificial intelligence and a passion for discovery.
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg" className="bg-teal-500 hover:bg-teal-400 text-white shadow-lg px-8 py-3 text-lg font-bold rounded-full transition">
              <Link to="/search">Start Discovering</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="bg-white/80 text-primary border-primary px-8 py-3 text-lg font-bold rounded-full transition">
              <Link to="/register">Join Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight mb-8">Featured Books</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredBooks.map((book) => (
            <Card key={book.id} className="overflow-hidden">
              <div className="aspect-[3/4] relative">
                <img
                  src={book.cover}
                  alt={book.title}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
                <CardDescription>By {book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {book.description}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link to={`/books/${book.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid gap-8 md:grid-cols-3">
        <div className="space-y-2">
          <h3 className="text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Track Your Reading</h3>
          <p className="text-muted-foreground" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Keep track of the books you've read and want to read, with a beautiful and intuitive interface.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>Create Collections</h3>
          <p className="text-muted-foreground" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Organize your books into custom collections, share them, and personalize your reading journey.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>AI-Powered Discovery</h3>
          <p className="text-muted-foreground" style={{ fontFamily: 'Open Sans, sans-serif' }}>
            Find your next favorite book with smart recommendations and advanced search powered by AI.
          </p>
        </div>
      </section>
    </div>
  );
} 