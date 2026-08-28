Photo Blog
A full-stack blog built from scratch with Node.js, Express, and MongoDB. Features an Instagram-style public homepage, admin-only post management, public commenting, and search.

Features
Public homepage (/) — Grid of posts with photos, open to all visitors
Comments — visitors can comment on posts without logging in
Admin panel (/admin) — password-protected route for creating new posts with photo uploads
Post management (/posts) — admin-only view listing all posts (with comments) and delete controls
Search (/search) — search posts by title or content
Session-based admin auth (/login) — single admin login, no visitor accounts

Tech Stack
Runtime: Node.js
Framework: Express
Database: MongoDB (Atlas), accessed via the raw MongoDB Node.js driver (no ODM)
Templating: EJS
File uploads: Multer (for post photos)
Sessions: express-session (for admin auth)