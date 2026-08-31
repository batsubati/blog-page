// Importing express itself into the server
const express = require('express');

// multer added
const multer = require('multer');

// express-session for admin auth installatiom
const session = require('express-session');

//adding hashing
const bcrypt = require('bcryptjs');

//adding rate limiting
const sessionlimit = require('express-rate-limit');

// Calling express creates an app
const app = express();
app.use(express.urlencoded({ extended: true }));

//adding frontend
app.use(express.static('public'));

//adding ejs - html inside javascript
app.set('view engine', 'ejs');

//adding session rate limiting
const loginLimiter = sessionlimit({
  windowMs : 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempt'
})

const registerLimiter = sessionlimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many accounts created'
})


app.use(session({
  secret: process.env.SESSION_SECRET || 'only-admin-allowed',
  resave: false,
  saveUninitialized: false
}));

//adding mongoDB
const { mongoDBConnect } = require('./db');
const { ObjectId } = require('mongodb');
console.log(require('./db'))

//adding res.locals
app.use(async (req, res, next) => {
  if (req.session.userId) {
    const db = app.locals.db;
    const result = await db.collection('accounts').findOne({ _id : new ObjectId(req.session.userId) })
    res.locals.currentUser = result
  } else {
    res.locals.currentUser = null;
  }
  next();
})

//adding admin check
function requireAdmin(req, res, next) {
  if (res.locals.currentUser && res.locals.currentUser.isAdmin) {
    next();
  } else {
    return res.redirect('/login');
  }
}

//adding comments middleware
function isLoggedin(req, res, next) {
  if (res.locals.currentUser) {
    next();
  } else {
    return res.redirect('/login');
  }
}

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
    const comments = await app.locals.db.collection('comments').aggregate([
      { $match: { post_id: post._id } },
      {
        $lookup: {
          from: 'accounts',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      }
    ]).toArray();
    postsWithComments.push({...post, comments: comments})
  }

  res.render('home', { posts: postsWithComments });

});

app.get('/admin', requireAdmin, (req, res) => {

  res.render('index');
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

app.get('/posts', requireAdmin, async (req, res) => {

  const db = app.locals.db;
  const posts = await db.collection('posts').find().toArray();

  const postsWithComments = [];

  for (const post of posts) {
    const comments = await db.collection('comments').find({ post_id: post._id }).toArray();
    postsWithComments.push({ ...post, comments: comments })
  }

  res.render('posts', { posts: postsWithComments })
});

app.post('/posts/:id/delete', requireAdmin, async (req, res) => {

  const { id } = req.params;
  const db = app.locals.db;
  const postID = new ObjectId(id);
  await db.collection('posts').deleteOne({ _id : postID });

  res.redirect('/posts');
});

// comment POST 
app.post('/posts/:id/comments', isLoggedin, async (req, res) => {
  const { id } = req.params
  const { content } = req.body
  const postID = new ObjectId(id);

  const db = app.locals.db;
  await db.collection('comments').insertOne({ post_id: postID, user_id: res.locals.currentUser._id ,content: content })

  res.redirect('/')
}); 

// admin panel delete the comment
app.post('/comments/:id/delete', requireAdmin, async (req, res) => {
  const { id } = req.params
  const db = app.locals.db;
  const commentID = new ObjectId(id);

  await db.collection('comments').deleteOne({ _id: commentID })

  res.redirect('/posts')
});

//users to delete their comments
app.post('/comments/:id/delete-own', isLoggedin ,async (req, res) =>{
  const { id } = req.params;
  const db = app.locals.db
  const commentID = new ObjectId(id);

  const comment = await db.collection('comments').findOne({ _id: commentID })
  if (comment.user_id.toString() === res.locals.currentUser._id.toString()) {
    await db.collection('comments').deleteOne({ _id: commentID })
    return res.redirect('/')
  } else {
    return res.redirect('/')
  }
})

//login page created
app.get('/login', (req, res) => {
  res.render('login', {error: null})
});

app.post('/login', loginLimiter, async (req, res) => {
  const { username } = req.body;
  const { password } = req.body;

  const db = app.locals.db

  const user = await db.collection('accounts').findOne({ username: username });

  if(!user){
    return res.render('login', {error: 'Username doesnt exist'})
  }

  if (await bcrypt.compare(password, user.password)){
    req.session.userId = user._id.toString();
    res.redirect('/')
  } else {
    return res.render('login', { error: 'Wrong password' })
  }

})

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

//added register page
app.get('/register', (req, res) => {
  res.render('register', {error: null});
})

app.post('/register', registerLimiter, async (req, res) => {
  const { username } = req.body
  const { password } = req.body

  const db = app.locals.db;
  const user = await db.collection('accounts').findOne({ username : username })

  if (user) {
    return res.render('register', { error: 'Username already exists' })
  } 

  const passwordHashed = await bcrypt.hash(password, 10)
  const result = await db.collection('accounts').insertOne({ username : username , password: passwordHashed})
  req.session.userId = result.insertedId.toString();
  console.log(result)
  res.redirect('/')
})

app.get('/about', (req, res) => {
  res.render('about');
})

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