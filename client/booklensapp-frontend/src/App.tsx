import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useParams, Navigate } from 'react-router-dom';
import api from './api';
import { isAuthenticated } from './auth';

// Placeholder components
const Home = () => <div>Home Page</div>;
const Login = () => <div>Login Page</div>;
const Register = () => <div>Register Page</div>;

// ProtectedRoute component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

// BookDetails component with API integration
const BookDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await api.get(`/books/${id}`);
        setBook(response.data.data);
      } catch (err) {
        setError('Failed to fetch book details');
      }
    };
    fetchBook();
  }, [id]);

  if (error) return <div>{error}</div>;
  if (!book) return <div>Loading...</div>;

  return (
    <div>
      <h1>{book.title}</h1>
      <p>Author: {book.authors.join(', ')}</p>
      <p>Description: {book.description}</p>
    </div>
  );
};

const Collections = () => <div>Collections Page</div>;

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
