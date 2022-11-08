const path = require('path');
const express = require('express');
const app = express();
const { engine } = require ('express-handlebars');
const session = require('express-session');
const handlebars = require('express-handlebars');
const {User,BlogTemplate} = require('./models/index');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const sequelize = require('./config/connection');
const withAuth = require('../utils/auth');


//here we set the engine that is called handlebars string to handlebars engine(const { engine } = require ('express-handlebars');)
app.engine('handlebars', engine());
//after that view engine tells express to use this value that is called handlebars string
//then express will look for it up to find it equal to engine.
app.set('view engine', 'handlebars');


app.use(express.static('public'));

const sess = {
  secret: 'Super secret secret',
  cookie: {
    maxAge: 300000,
    httpOnly: true,
    secure: false,
    sameSite: 'strict',
  },
  resave: false,
  saveUninitialized: true,
  store: new SequelizeStore({
    db: sequelize
  })
};



app.use(session(sess));

app.get('/', (req, res) => {
  //Serves the body of the page aka "main.handlebars" to the container //aka "index.handlebars"
  res.render('main', {layout : 'index'});
  });

// const routes = require('./controllers');

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(routes);

// app.use("*",(req,res)=>{console.log("method is "+req.method)});

// Login
app.post('/login', async (req, res) => {
  try {
    const dbUserData = await User.findOne({
      where: {
        username: req.body.logUsername,
      },
    });

    if (!dbUserData) {
      res
      .status(400)
      .json({ message: 'Incorrect email or password. Please try again!' });
      return;
    }
    
    console.log(req.body.logPassword);
    const validPassword = await dbUserData.checkPassword(req.body.logPassword);
    if (!validPassword) {
      res
        .status(400)
        .json({ message: 'Incorrect email or password. Please try again!' });
      return;
    }

  // Once the user successfully logs in, set up the sessions variable 'loggedIn'


  req.session.save(() => {
    req.session.user_id = dbUserData.id;
    req.session.logged_In = true;

    res.json({ user: dbUserData, message: 'You are now logged in!' });
  });
} catch (err) {
  console.log(err);
  res.status(400).json(err);
}
});

// app.use("*",(req,res)=>{
//   console.log("all routes "+ req.method);
// })  



app.post('/register',async(req,res)=>{
    try {
    const dbUserData = await User.create({
      username: req.body.regUsername,
      password: req.body.regPassword,
    });
    // Set up sessions with a 'loggedIn' variable set to `true`
    req.session.save(() => {
      req.session.loggedIn = true;
      res.status(200).json(dbUserData);
    });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);  
    }
  })


app.get('/login',(req,res)=>{
      res.render("login", {layout : 'index'});
  });


  app.get('/register',(req,res)=>{
      res.render("register", {layout : 'index'});
  });


sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => console.log(`Now listening on port ${PORT}`));
});
