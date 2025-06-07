import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  authors: [{
    type: String,
    required: true,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  publishedDate: {
    type: Date
  },
  publisher: {
    type: String,
    trim: true
  },
  isbn: {
    type: String,
    trim: true,
    sparse: true,
    index: true
  },
  pageCount: {
    type: Number,
    min: 0
  },
  categories: [{
    type: String,
    trim: true
  }],
  language: {
    type: String,
    trim: true,
    default: 'en'
  },
  coverImage: {
    type: String,
    trim: true
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingsCount: {
    type: Number,
    min: 0,
    default: 0
  },
  externalId: {
    type: String,
    trim: true,
    index: true
  },
  bookmarkedBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, {
  timestamps: true
});

// Text index for search
bookSchema.index({ title: 'text', authors: 'text', description: 'text' });

// Static method to find books by title
bookSchema.statics.findByTitle = function(title) {
  return this.find({ title: new RegExp(title, 'i') });
};

// Static method to find books by author
bookSchema.statics.findByAuthor = function(author) {
  return this.find({ authors: new RegExp(author, 'i') });
};

// Static method to find books by ISBN
bookSchema.statics.findByISBN = function(isbn) {
  return this.findOne({ isbn });
};

const Book = mongoose.model('Book', bookSchema);

export default Book;
