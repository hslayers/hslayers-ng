require('dotenv').config();

const session = require('express-session');
const connect_sqlite3 = require('connect-sqlite3');

exports.create_express_session = () => {
  const SQLiteStore = connect_sqlite3(session);
  const session_store = new SQLiteStore({
    table: 'sessions',
    db: process.env.DB_PATH,
    //dir: './data'
  });

  const session_config = {
    secret: process.env.SESSION_SECRET,
    cookie: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) * 1000,
    },
    resave: false,
    saveUninitialized: true,
    store: session_store
  };

  return session(session_config);

};
