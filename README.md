# Photo Blog

A full-stack blog built from scratch with Node.js, Express, and MongoDB. Features a public homepage, user accounts with commenting, admin-only post management, and search.

## Features

- **Public homepage (`/`)** — feed of posts with photos, open to all visitors
- **User accounts** — visitors can register and log in to leave comments
- **Comments** — logged-in users can comment on posts
- **Admin role** — accounts can be flagged as admin; admins get access to post creation and management
- **Admin post creation (`/admin`)** — admin-only route for creating new posts with photo uploads
- **Post management (`/posts`)** — admin-only view listing all posts (with comments) and delete controls
- **Search (`/search`)** — search posts by title or content
- **Rate limiting** — login and registration routes are rate-limited to prevent brute-force attempts

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Atlas), accessed via the raw MongoDB Node.js driver (no ODM)
- **Templating:** EJS
- **File uploads:** Multer (for post photos)
- **Sessions:** express-session
- **Auth:** bcrypt for password hashing, session-based login for both regular users and admins
- **Rate limiting:** express-rate-limit