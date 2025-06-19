import axios from "axios";
import { ApiError } from "../utils/errors.js";

const DEFAULT_ITEMS_PER_PAGE = 10;

/**
 * Service for searching books from external API
 */
export default class BookSearchService {
  /**
   * Initializes the service with optional configuration.
   * @param {Object} config - Custom configuration (optional)
   * @param {string} config.apiEndpoint - The book API base URL
   * @param {string} config.apiKey - API key for authorization
   * @param {number} config.timeout - Axios request timeout in ms
   */
  constructor(config = {}) {
    const apiEndpoint = config.apiEndpoint || process.env.BOOK_API_ENDPOINT;
    const apiKey = config.apiKey || process.env.BOOK_API_KEY;
    const timeout = parseInt(process.env.BOOK_API_TIMEOUT || "5000", 10);

    if (!apiEndpoint || !apiKey) {
      throw new Error("Book API configuration missing");
    }

    this.itemsPerPage = config.itemsPerPage || DEFAULT_ITEMS_PER_PAGE;

    this.axiosInstance = axios.create({
      baseURL: apiEndpoint,
      timeout,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }
  /**
   * Perform a book search query.
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search term
   * @param {string} params.searchType - Type of search ('title' or 'general')
   * @param {number} [params.page=1] - Page number
   * @returns {Promise<Object>} - Formatted search results
   */

  async search({ query, searchType = "general", page = 1 }) {
    if (!query?.trim()) {
      throw new ApiError(400, "Search query cannot be empty");
    }

    try {
      const params = {
        ...(searchType === "title"
          ? { title: query.trim() }
          : { search: query.trim() }),
        page,
        itemsPerPage: this.itemsPerPage,
      };

      const response = await this.axiosInstance.get("/books", { params });

      return this.formatResponse(response, page);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Format the raw API response for frontend consumption.
   * @param {Object} response - Axios response object
   * @param {number} currentPage - Current page number
   * @returns {Object} - Formatted data
   */

  formatResponse(response, currentPage) {
    const items = response?.data?.items || [];

    if (items.length === 0) {
      throw new ApiError(404, "No books found matching your search");
    }

    const totalItems = response.data.totalItems || items.length;

    return {
      data: items,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalItems / this.itemsPerPage),
      },
    };
  }

  /**
   * Normalize and return a custom ApiError.
   * @param {Error} error - Caught error
   * @returns {ApiError}
   */
  handleError(error) {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message || "Book search service unavailable";
    return new ApiError(status, message);
  }
}
