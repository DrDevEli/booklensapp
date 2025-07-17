import React from 'react';

const featuredBooks = [
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    cover: "https://covers.openlibrary.org/b/id/8225261-L.jpg",
    description: "A novel about the serious issues of rape and racial inequality.",
    price: 18.47
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    cover: "https://covers.openlibrary.org/b/id/240726-L.jpg",
    description: "A landmark volume in science writing by one of the great minds of our time.",
    price: 15.50
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    cover: "https://covers.openlibrary.org/b/id/7984916-L.jpg",
    description: "The first book in the Harry Potter series.",
    price: 15.75
  },
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    cover: "https://covers.openlibrary.org/b/id/7222161-L.jpg",
    description: "A story of the fabulously wealthy Jay Gatsby and his love for Daisy Buchanan.",
    price: 21.08
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    cover: "https://covers.openlibrary.org/b/id/6979861-L.jpg",
    description: "A fantasy novel and children's book by English author J. R. R. Tolkien.",
    price: 10.50
  },
  {
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    cover: "https://covers.openlibrary.org/b/id/8235118-L.jpg",
    description: "Explores the history and impact of Homo sapiens.",
    price: 14.11
  },
];

export default function FeaturedBooks() {
  return (
    <div className="my-8">
      <h2 className="text-2xl font-bold mb-4">Featured Books</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {featuredBooks.map((book, idx) => (
          <div
            key={idx}
            className="flex flex-col bg-white rounded-lg shadow hover:shadow-lg transition p-4 items-center"
            style={{
              background: 'linear-gradient(135deg, rgba(74, 0, 127, 0.1) 0%, rgba(0, 230, 230, 0.1) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <img
              src={book.cover}
              alt={book.title}
              className="w-20 h-28 object-cover rounded mb-2 flex-shrink-0"
            />
            <div className="w-full text-center">
              <div className="font-semibold text-lg mb-1">{book.title}</div>
              <div className="text-sm text-gray-600 mb-1">by {book.author}</div>
              <div className="text-gray-700 text-sm mb-2">{book.description}</div>
              <div className="italic text-xs text-teal-500 mb-2">Discovery...</div>
              {typeof book.price === 'number' && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-gradient-to-r from-yellow-200 via-yellow-300 to-yellow-400 text-yellow-900 text-xs font-bold rounded-full shadow-sm border border-yellow-300">
                  ${book.price.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 