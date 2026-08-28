// Importing express itself into the server
const express = require('express');

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

//adding mongoDB
const { mongoDBConnect } = require('./db');
const { ObjectId } = require('mongodb');
console.log(require('./db'))


const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

app.get('/', async (req, res) => {
  const posts = await app.locals.db.collection('posts').find().toArray();

  const postsWithComments = [];

  for (const post of posts) {
    const comments =  await app.locals.db.collection('comments').find({ post_id: post._id }).toArray(); 
    postsWithComments.push({...post, comments: comments})
  }

  res.render('home', { posts: postsWithComments });

});

app.get('/admin', (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/login')
  }

  res.render('index',);
});

app.post('/posts', upload.single('image'), async (req, res) => {
  if (!req.session.isAdmin) {
    return res.send('Not authorized');
  }

  console.log('req.file:', req.file);
  console.log('req.body:', req.body)

  const { title, content } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  const db = app.locals.db;
  await db.collection('posts').insertOne({ title: title, content: content, image: imagePath });

  res.redirect('/posts')
});

app.get('/posts', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.redirect('/login')
  }
  const db = app.locals.db;
  const posts = await db.collection('posts').find().toArray();

  const postsWithComments = [];

  for (const post of posts) {
    const comments = await db.collection('comments').find({ post_id: post._id }).toArray();
    postsWithComments.push({ ...post, comments: comments })
  }

  res.render('posts', { posts: postsWithComments })
});

app.post('/posts/:id/delete', async (req, res) => {
  if (!req.session.isAdmin) {
    return res.send('Not authorized');
  }

  const { id } = req.params;
  const db = app.locals.db;
  const postID = new ObjectId(id);
  await db.collection('posts').deleteOne({ _id : postID });

  res.redirect('/posts');
});

// comment POST 
app.post('/posts/:id/comments', async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const postID = new ObjectId(id);

  const db = app.locals.db;
  await db.collection('comments').insertOne({ post_id: postID, content: content })

  res.redirect('/')
}); 

// admin panel delete the comment
app.post('/comments/:id/delete', async (req, res) => {
  if(!req.session.isAdmin) {
    return res.send('Not authorized')
  }

  const { id } = req.params
  const db = app.locals.db;
  const commentID = new ObjectId(id);

  await db.collection('comments').deleteOne({ _id: commentID })

  res.redirect('/posts')
});

//login page created
app.get('/login', (req, res) => {
  res.render('login')
});

app.post('/login', (req, res) => {
  const { password } = req.body;

  if (password === process.env.ADMINPASSWORD) {
    req.session.isAdmin = true
    res.redirect('/posts')
  } else {
    res.send('Wrong password');
  }
});

//adding the search festure
app.get('/search', async (req, res) => {
  const { q } = req.query

  if (!q) {
    return res.redirect('/')
  } 
  const query = q.trim();
  const db = app.locals.db;
  const searchQuery = new RegExp(query, 'i')

  const results = await db.collection('posts').find({ $or: [ {title: searchQuery}, {content: searchQuery}] }).toArray();

  res.render('search' , {
    posts: results,
    query: query
  });
});

app.get('/about', (req, res) => {
  res.render('about')
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const db = await mongoDBConnect();
    app.locals.db = db;
    app.listen(PORT, () => {
      console.log(`Sever running successfully at port ${PORT}`)
    })
  } catch(error) {
    console.log('Server failed to start', error)
  }
}
startServer();