import { ApiError } from "../utils/errors.js";
import openLibraryService from "./openLibraryService.js";
import { searchGutendex } from "./gutendexService.js";
import { searchGoogleBooks } from "./googleBooksService.js";
import amazonAffiliateService from "./amazonAffiliateService.js";
import booklookerService from "./bookLookerService.js";
import logger from "../config/logger.js";

export default class BookSearchService {
  async search({ title, author, page = 1 }) {
    if (!title && !author) {
      throw new ApiError(400, "At least one search parameter must be provided");
    }

    try {
      logger.info("Searching books using multiple APIs", { 
        title, 
        author, 
        page
      });

      // Fetch from all sources in parallel
      const [openLibResult, gutendexResult, googleResult, booklookerResult] = await Promise.allSettled([
        openLibraryService.search({ title, author, page }),
        searchGutendex({ title, author, page }),
        searchGoogleBooks({ title, author, page }),
        booklookerService.searchBooklooker({ title, author, page })
      ]);

      // Process results and handle errors gracefully
      let allBooks = [];
      let errors = [];

      // Process Open Library results
      if (openLibResult.status === 'fulfilled') {
        allBooks = allBooks.concat(openLibResult.value.data || []);
        logger.info("Open Library search successful", { 
          resultCount: openLibResult.value.data?.length || 0 
        });
      } else {
        errors.push(`Open Library: ${openLibResult.reason.message}`);
        logger.warn("Open Library search failed", { 
          error: openLibResult.reason.message 
        });
      }

      // Process Gutendex results
      if (gutendexResult.status === 'fulfilled') {
        allBooks = allBooks.concat(gutendexResult.value || []);
        logger.info("Gutendex search successful", { 
          resultCount: gutendexResult.value?.length || 0 
        });
      } else {
        errors.push(`Gutendex: ${gutendexResult.reason.message}`);
        logger.warn("Gutendex search failed", { 
          error: gutendexResult.reason.message 
        });
      }

      // Process Google Books results
      if (googleResult.status === 'fulfilled') {
        allBooks = allBooks.concat(googleResult.value || []);
        logger.info("Google Books search successful", { 
          resultCount: googleResult.value?.length || 0 
        });
      } else {
        errors.push(`Google Books: ${googleResult.reason.message}`);
        logger.warn("Google Books search failed", { 
          error: googleResult.reason.message 
        });
      }

      // Process Booklooker results
      if (booklookerResult.status === 'fulfilled') {
        allBooks = allBooks.concat(booklookerResult.value || []);
        logger.info("Booklooker search successful", { 
          resultCount: booklookerResult.value?.length || 0 
        });
      } else {
        errors.push(`Booklooker: ${booklookerResult.reason.message}`);
        logger.warn("Booklooker search failed", { 
          error: booklookerResult.reason.message 
        });
      }

      // Deduplicate results based on title and author
      const uniqueBooks = this.deduplicateBooks(allBooks);

      // Add Amazon affiliate links (optional - can be implemented later)
      const booksWithAffiliateLinks = await this.addAffiliateLinks(uniqueBooks);

      // Calculate pagination
      const totalResults = uniqueBooks.length;
      const limit = 20;
      const totalPages = Math.ceil(totalResults / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBooks = booksWithAffiliateLinks.slice(startIndex, endIndex);

      const result = {
        data: paginatedBooks,
        pagination: {
          currentPage: page,
          totalPages,
          totalResults,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        sources: {
          openLibrary: openLibResult.status === 'fulfilled',
          gutendex: gutendexResult.status === 'fulfilled',
          googleBooks: googleResult.status === 'fulfilled',
          booklooker: booklookerResult.status === 'fulfilled'
        },
        errors: errors.length > 0 ? errors : undefined
      };
      
      logger.info("Aggregated book search completed successfully", { 
        resultCount: paginatedBooks.length,
        totalResults,
        totalPages,
        sourcesUsed: Object.values(result.sources).filter(Boolean).length
      });

      return result;
    } catch (error) {
      logger.error("Book search error", {
        error: error.message,
        title,
        author,
        page
      });

      throw new ApiError(500, `Book search error: ${error.message}`);
    }
  }

  /**
   * Deduplicate books based on title and author similarity
   */
  deduplicateBooks(books) {
    const seen = new Set();
    const uniqueBooks = [];

    for (const book of books) {
      // Create a key based on normalized title and author
      const normalizedTitle = book.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
      const normalizedAuthors = book.authors?.map(a => a.toLowerCase().replace(/[^a-z0-9]/g, '')).join('') || '';
      const key = `${normalizedTitle}-${normalizedAuthors}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueBooks.push(book);
      }
    }

    return uniqueBooks;
  }

  /**
   * Add Amazon affiliate links to books
   */
  async addAffiliateLinks(books) {
    try {
      return await amazonAffiliateService.addAffiliateLinksToBooks(books);
    } catch (error) {
      logger.error("Error adding affiliate links", {
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