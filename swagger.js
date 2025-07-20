// swagger.js - Swagger Configuration for Book Club API

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Swiss Book Club API",
      version: "1.0.0",
      description:
        "API documentation for Swiss Book Club application - A platform for Swiss book lovers to connect, discuss, and discover books together.",
      contact: {
        name: "Book Club Team",
        email: "support@swissbookclub.ch",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:5000/api",
        description: "Development server",
      },
      {
        url: "https://api.swissbookclub.ch/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
      schemas: {
        User: {
          type: "object",
          required: ["username", "email"],
          properties: {
            _id: { type: "string", example: "64a7b8c9d1e2f3a4b5c6d7e8" },
            username: { type: "string", example: "swiss_reader" },
            email: {
              type: "string",
              format: "email",
              example: "reader@swiss.ch",
            },
            profile: {
              type: "object",
              properties: {
                firstName: { type: "string", example: "Hans" },
                lastName: { type: "string", example: "Müller" },
                avatar: {
                  type: "string",
                  example: "https://example.com/avatar.jpg",
                },
                location: {
                  type: "object",
                  properties: {
                    canton: { type: "string", example: "Zürich" },
                    city: { type: "string", example: "Zürich" },
                    postalCode: { type: "string", example: "8001" },
                  },
                },
                languagePreference: {
                  type: "string",
                  enum: ["de", "fr", "it", "rm", "en"],
                  example: "de",
                },
              },
            },
            readingStats: {
              type: "object",
              properties: {
                booksRead: { type: "number", example: 24 },
                currentStreak: { type: "number", example: 15 },
                favoriteGenres: {
                  type: "array",
                  items: { type: "string" },
                  example: ["Fiction", "Swiss Literature"],
                },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Book: {
          type: "object",
          required: ["title", "author"],
          properties: {
            _id: { type: "string", example: "64a7b8c9d1e2f3a4b5c6d7e9" },
            title: { type: "string", example: "Der Zauberberg" },
            author: { type: "string", example: "Thomas Mann" },
            isbn: { type: "string", example: "978-3-596-29431-8" },
            description: {
              type: "string",
              example: "A classic German novel...",
            },
            coverImage: {
              type: "string",
              example: "https://example.com/cover.jpg",
            },
            categories: {
              type: "array",
              items: { type: "string" },
              example: ["Fiction", "German Literature"],
            },
            publishedDate: { type: "string", format: "date" },
            pageCount: { type: "number", example: 1008 },
            language: { type: "string", example: "de" },
            isSwissAuthor: { type: "boolean", example: false },
            averageRating: { type: "number", format: "float", example: 4.2 },
            ratingsCount: { type: "number", example: 156 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        BookClub: {
          type: "object",
          required: ["name", "description", "createdBy"],
          properties: {
            _id: { type: "string", example: "64a7b8c9d1e2f3a4b5c6d7ea" },
            name: { type: "string", example: "Zürich Book Lovers" },
            description: {
              type: "string",
              example: "Monthly meetings to discuss contemporary fiction",
            },
            coverImage: {
              type: "string",
              example: "https://example.com/club-cover.jpg",
            },
            privacy: {
              type: "string",
              enum: ["public", "private", "invite-only"],
              example: "public",
            },
            maxMembers: { type: "number", example: 25 },
            currentBook: {
              type: "string",
              example: "64a7b8c9d1e2f3a4b5c6d7e9",
            },
            location: {
              type: "object",
              properties: {
                canton: { type: "string", example: "Zürich" },
                city: { type: "string", example: "Zürich" },
              },
            },
            language: {
              type: "string",
              enum: ["de", "fr", "it", "rm", "en"],
              example: "de",
            },
            members: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  userId: {
                    type: "string",
                    example: "64a7b8c9d1e2f3a4b5c6d7e8",
                  },
                  role: {
                    type: "string",
                    enum: ["admin", "moderator", "member"],
                    example: "member",
                  },
                  joinedAt: { type: "string", format: "date-time" },
                  isActive: { type: "boolean", example: true },
                },
              },
            },
            createdBy: { type: "string", example: "64a7b8c9d1e2f3a4b5c6d7e8" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Review: {
          type: "object",
          required: ["book", "reviewer", "rating"],
          properties: {
            _id: { type: "string", example: "64a7b8c9d1e2f3a4b5c6d7eb" },
            book: { type: "string", example: "64a7b8c9d1e2f3a4b5c6d7e9" },
            reviewer: { type: "string", example: "64a7b8c9d1e2f3a4b5c6d7e8" },
            rating: { type: "number", minimum: 1, maximum: 5, example: 4 },
            title: {
              type: "string",
              example: "A masterpiece of German literature",
            },
            content: {
              type: "string",
              example: "Thomas Mann's exploration of...",
            },
            containsSpoilers: { type: "boolean", example: false },
            likes: { type: "number", example: 12 },
            isVerifiedPurchase: { type: "boolean", example: true },
            language: {
              type: "string",
              enum: ["de", "fr", "it", "rm", "en"],
              example: "de",
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Resource not found" },
            message: {
              type: "string",
              example: "The requested book could not be found",
            },
            statusCode: { type: "number", example: 404 },
          },
        },
      },
    },
    tags: [
      { name: "Authentication", description: "User authentication endpoints" },
      { name: "Users", description: "User management and profiles" },
      { name: "Books", description: "Book catalog and information" },
      {
        name: "Book Clubs",
        description: "Book club management and membership",
      },
      { name: "Reviews", description: "Book reviews and ratings" },
      { name: "Genres", description: "Book categories and genres" },
      { name: "Search", description: "Search functionality" },
      { name: "Swiss Data", description: "Swiss-specific data and features" },
      { name: "Analytics", description: "Reading statistics and insights" },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js", "./models/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
