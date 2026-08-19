// Importing express itself into the server
const express = require('express');

// Calling express creates an app
const app = express();

app.use(express.urlencoded({ extended: true }));

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
  console.log(req.body)

  res.send(`Recieved title: ${req.body.title}, Content: ${req.body.content}`);
});

app.get('/about', (req, res) => {
  res.send('About page')
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running succesfully at port: ${PORT}`)
});