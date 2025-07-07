import React from 'react';
import Link from 'next/link';
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

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Discover Your Next Favorite Book
        </h1>
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
          Explore our vast collection of books, create reading lists, and connect with fellow book lovers.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/search">Start Reading</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/register">Join Now</Link>
          </Button>
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
                  <Link href={`/books/${book.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="grid gap-8 md:grid-cols-3">
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Track Your Reading</h3>
          <p className="text-muted-foreground">
            Keep track of the books you've read and want to read.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Create Collections</h3>
          <p className="text-muted-foreground">
            Organize your books into custom collections and share them with others.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Discover New Books</h3>
          <p className="text-muted-foreground">
            Find your next favorite book with our powerful search and recommendations.
          </p>
        </div>
      </section>
    </div>
  );
} 