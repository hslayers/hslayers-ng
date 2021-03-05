require('dotenv').config();

const session = require('express-session');
const connectSQLite3 = require('connect-sqlite3');

exports.createExpressSession = () => {
  const SQLiteStore = connectSQLite3(session);
  const session_store = new SQLiteStore({
    table: 'sessions',
    db: process.env.DB_PATH,
    //dir: './data'
  });

  const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) * 1000,
    },
    resave: false,
    saveUninitialized: true,
    store: session_store
  };

  return session(sessionConfig);

};
