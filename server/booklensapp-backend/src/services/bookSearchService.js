import { ApiError } from "../utils/errors.js";
import openLibraryService from "./openLibraryService.js";
import logger from "../config/logger.js";

export default class BookSearchService {
  async search({ title, author, page = 1 }) {
    if (!title && !author) {
      throw new ApiError(400, "At least one search parameter must be provided");
    }

    try {
      logger.info("Searching books using Open Library API", { 
        title, 
        author, 
        page
      });

      const result = await openLibraryService.search({ title, author, page });
      
      logger.info("Book search completed successfully", { 
        resultCount: Array.isArray(result.data) ? result.data.length : 0,
        totalResults: result.pagination?.totalResults || 0
      });

      return result;
    } catch (error) {
      logger.error("Book search error", {
        error: error.message,
        title,
        author,
        page
      });

      // Re-throw the error as it's already an ApiError from the Open Library service
      throw error;
    }
  }
}