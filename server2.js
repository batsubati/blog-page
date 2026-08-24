// Importing express itself into the server
const express = require('express');
const Database = require('better-sqlite3');

// multer added
const multer = require('multer');

// express-session for admin auth installatiom
const session = require('express-session');


// Calling express creates an app
const app = express();
app.use(express.urlencoded({ extended: true }));

//adding frontend
app.use(express.static('public'));

//adding ejs - html inside javascript
app.set('view engine', 'ejs');

app.use(session({
  secret: process.env.SESSION_SECRET || 'only-admin-allowed',
  resave: false,
  saveUninitialized: false
}));

//Creating the database file
const db = new Database('blog.db'); 

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT 
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    content TEXT NOT NULL
  )
`)

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  const posts = db.prepare('SELECT * FROM posts').all();

  const postsWithComments = posts.map(post => {
    const comments = db.prepare('SELECT * FROM comments WHERE post_id = ?').all(post.id);
    return { ...post, comments: comments };
  });

  res.render('home', { posts: postsWithComments });

});

app.get('/admin', (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/login')
  }

  res.render('index',);
});

app.post('/posts', upload.single('image'), (req, res) => {
  if (!req.session.isAdmin) {
    return res.send('Not authorized');
  }

  console.log('req.file:', req.file);
  console.log('req.body:', req.body)

  const { title, content } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  const stmt = db.prepare('INSERT INTO posts (title, content, image) VALUES (?, ?, ?)');
  stmt.run(title, content, imagePath);

  res.redirect('/posts')
});

app.get('/posts', (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/login')
  }

  const posts = db.prepare('SELECT * FROM posts').all();
  const postsWithComments = posts.map(post => {
    const comments = db.prepare('SELECT * FROM comments WHERE post_id = ?').all(post.id);
    return { ...post, comments: comments };
  });

  res.render('posts', { posts: postsWithComments })
});

app.post('/posts/:id/delete', (req, res) => {
  if (!req.session.isAdmin) {
    return res.send('Not authorized');
  }

  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
  stmt.run(id);
  res.redirect('/posts');
});

// comment POST 
app.post('/posts/:id/comments', (req, res) => {
  const { id } = req.params
  const { content } = req.body

  const stmt = db.prepare('INSERT INTO comments (post_id, content) VALUES (?, ?)');
  stmt.run(id, content);

  res.redirect('/')
}); 

// admin panel delete the comment
app.post('/comments/:id/delete', (req, res) => {
  if(!req.session.isAdmin) {
    return res.send('Not authorized')
  }

  const { id } = req.params
  const stmt = db.prepare('DELETE FROM comments WHERE id = ?');
  stmt.run(id);

  res.redirect('/posts')
});

//login page created
app.get('/login', (req, res) => {
  res.render('login')
});

app.post('/login', (req, res) => {
  const { password } = req.body;

  if (password === '1234asdF') {
    req.session.isAdmin = true
    res.redirect('/posts')
  } else {
    res.send('Wrong password');
  }
});

//adding the search festure
app.get('/search', (req, res) => {
  const { q } = req.query

  if (!q) {
    return res.redirect('/')
  } 
  const query = q.trim();
  const searchPattern = `%${query}%`
  // const limit = req.query.limit || 2;

  const stmt = db.prepare("SELECT * FROM posts WHERE title LIKE ? OR content LIKE ?");
  const results = stmt.all(searchPattern, searchPattern);

  res.render('search' , {
    posts: results,
    query: query
  });
});

app.get('/about', (req, res) => {
  res.render('about')
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running succesfully at port: ${PORT}`)
});