import logger from "../config/logger.js";
import { ApiError } from "../utils/errors.js";

const AMAZON_ASSOCIATES_TAG = process.env.AMAZON_ASSOCIATES_TAG;
const AMAZON_DOMAIN = process.env.AMAZON_DOMAIN || "amazon.com";

class AmazonAffiliateService {
  /**
   * Generate Amazon affiliate link for a book
   * @param {Object} book - Book object with title, authors, etc.
   * @returns {Promise<string|null>} Amazon affiliate link or null if not available
   */
  async generateAffiliateLink(book) {
    try {
      if (!AMAZON_ASSOCIATES_TAG) {
        logger.warn("Amazon Associates tag not configured");
        throw new ApiError("Amazon Associates tag not configured", 500);
      }

      // Build search query for Amazon
      const searchQuery = this.buildSearchQuery(book);
      if (!searchQuery) {
        return null;
      }

      // Generate affiliate link
      const affiliateLink = `https://www.${AMAZON_DOMAIN}/s?k=${encodeURIComponent(searchQuery)}&tag=${AMAZON_ASSOCIATES_TAG}`;

      logger.debug("Generated Amazon affiliate link", {
        bookTitle: book.title,
        searchQuery,
        affiliateLink
      });

      return affiliateLink;
    } catch (error) {
      logger.error("Error generating Amazon affiliate link", {
        error: error.message,
        bookTitle: book.title
      });
      return null;
    }
  }

  /**
   * Build search query for Amazon based on book information
   * @param {Object} book - Book object
   * @returns {string|null} Search query or null if insufficient data
   */
  buildSearchQuery(book) {
    if (!book.title) {
      return null;
    }

    let query = book.title;

    // Add author if available
    if (book.authors && book.authors.length > 0) {
      query += ` ${book.authors[0]}`;
    }

    // Add "book" keyword to improve search results
    query += " book";

    return query;
  }

  /**
   * Generate affiliate links for multiple books
   * @param {Array} books - Array of book objects
   * @returns {Promise<Array>} Books with affiliate links added
   */
  async addAffiliateLinksToBooks(books) {
    try {
      const booksWithLinks = await Promise.all(
        books.map(async (book) => {
          const amazonLink = await this.generateAffiliateLink(book);
          return {
            ...book,
            amazonLink
          };
        })
      );

      logger.info("Added Amazon affiliate links to books", {
        totalBooks: books.length,
        booksWithLinks: booksWithLinks.filter(b => b.amazonLink).length
      });

      return booksWithLinks;
    } catch (error) {
      logger.error("Error adding affiliate links to books", {
        error: error.message
      });
      
      // Return books without affiliate links if there's an error
      return books.map(book => ({
        ...book,
        amazonLink: null
      }));
    }
  }
}

export default new AmazonAffiliateService();
