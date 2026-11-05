# Swiss Book Club API

REST API for a platform where readers in Switzerland can find, create and join local book clubs. Users sign up with email verification (OTP), create clubs, plan reading events and RSVP to them. Club organisers manage members and events.

Built with **Node.js, Express, MongoDB (Mongoose), JWT auth and Swagger**. This is the backend for [book-reviews-client](https://github.com/rudolfcodes/book-reviews-client).

## Why

Book clubs are mostly organised through scattered WhatsApp groups and Meetup pages, which makes them hard to find, especially for people who just moved to a new city. This API gives clubs one place to live: searchable by canton, city, language and genre, with events and members built in.

Technical highlights:
- Layered structure: routes → controllers → services → models
- JWT auth in HTTP-only cookies, OTP email verification and a password reset flow
- Hourly cron job that marks past events as expired
- Book suggestions via the Google Books API
- Interactive API docs with Swagger

## Getting started

**Requirements:** Node.js 18+ and a MongoDB database (local or MongoDB Atlas).

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root:
   ```env
   MONGO_URI=mongodb://localhost:27017/book-clubs
   PORT=5000
   JWT_SECRET=change-me
   FRONTEND_URL=http://localhost:3000

   # SMTP, used for OTP and password reset emails
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   EMAIL_USER=you@example.com
   EMAIL_PASS=your-smtp-password
   ```
3. Start the server:
   ```bash
   node server.js
   ```
4. The API runs on `http://localhost:5000`. Docs are at **http://localhost:5000/api-docs**.

## Tests

No automated tests yet. Use the Swagger UI at `/api-docs` to try the endpoints.
