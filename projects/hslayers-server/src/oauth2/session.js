import 'dotenv/config';

import session from 'express-session';
import connectSQLite3 from 'connect-sqlite3';

export const createExpressSession = () => {
  const SQLiteStore = connectSQLite3(session);
  const session_store = new SQLiteStore({
    table: 'sessions',
    db: process.env.DB_PATH
  });

  const sessionConfig = {
    name: "connect-hsl.sid",
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
