import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";

interface BookSearchForm {
  title: string;
  author: string;
}

export function BookSearch() {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<BookSearchForm>();

  const onSubmit = async (data: BookSearchForm) => {
    try {
      const searchQuery = `${data.title} ${data.author}`.trim();
      const params = new URLSearchParams({
        q: searchQuery
      }).toString();
      const res = await fetch(`http://localhost:3001/api/books/search?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
  
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const json = await res.json();
      if (json.success) {
        setSearchResults(json.books);
      } else {
        console.error(json.error);
        setSearchResults([]);
      }
    } catch (err) {
      console.error("Error fetching books:", err);
      if (err instanceof Error) {
        console.error("Error details:", err.message);
      }
      setSearchResults([]);
    }
  };
  

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Book Search</CardTitle>
          <CardDescription>
            Search for books by title or author
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                placeholder="Enter book title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                placeholder="Enter author name"
                {...register("author")}
              />
            </div>
            <Button type="submit" className="w-full">
              Search Books
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <div className="mt-8 space-y-4">
          {searchResults.map((book) => (
            <Card key={book.id}>
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
                <CardDescription>By {book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>{book.description}</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 