import express from "express";
import BookController from "../controllers/bookController.js";
import rateLimiterMiddleware from "../middleware/rateLimiter.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Book search (by title/author) - Public access
router.get(
  "/search",
  rateLimiterMiddleware,
  BookController.searchBooks
);

// Advanced search - Public access
router.get(
  "/search/advanced",
  rateLimiterMiddleware,
  BookController.advancedSearch
);

// Get book by ID - Public access
router.get(
  "/:id",
  rateLimiterMiddleware,
  BookController.getBookById
);

// Get author details by ID - Public access
router.get(
  "/author/:authorId",
  rateLimiterMiddleware,
  BookController.getAuthorDetails
);

// Example protected route (add a book)
router.post(
  "/",
  authMiddleware(),
  (req, res) => {
    res.status(200).json({ success: true, message: "This is a protected route. Only authenticated users can access it." });
  }
);

export default router;
