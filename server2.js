// Importing express itself into the server
const express = require('express');
const Database = require('better-sqlite3');

// Calling express creates an app
const app = express();
app.use(express.urlencoded({ extended: true }));

//Creating the database file
const db = new Database('blog.db'); 

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL
  )
`);


app.get('/', (req, res) => {
  res.send(`
  <h1>New Post</h1>
  <form action="/posts" method="POST">
    <input type="text" name="title" placeholder="Title" /><br/>
    <textarea name="content" placeholder="Write something..."></textarea><br/>
    <button type="submit">Submit</button>
  </form>
  `);
});

app.post('/posts', (req, res) => {
  const { title, content } = req.body;

  const stmt = db.prepare('INSERT INTO posts (title, content) VALUES (?, ?)');
  stmt.run(title, content);

  res.send(`Saved! Title: ${title}`);


});

app.get('/posts', (req, res) => {
  const posts = db.prepare('SELECT * FROM posts').all();

  const html = posts.map(post => 
    `<h2>${post.title}</h2>
    <p>${post.content}</p>
    <hr/>`
    ).join('');

    res.send(html)
});


app.get('/about', (req, res) => {
  res.send('About page')
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running succesfully at port: ${PORT}`)
});