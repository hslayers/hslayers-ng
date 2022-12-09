require('dotenv').config();

const https = require('https');
const express = require('express');
const cors = require('cors');

const passport = require('passport');
const OAuth2 = require('passport-oauth2').Strategy;
const OAuth2Refresh = require('passport-oauth2-middleware').Strategy;
const sqlite = require('better-sqlite3');
const got = require('got');
const { createProxyMiddleware } = require('http-proxy-middleware');

const authnUtil = require("./oauth2/util");
const sessionUtil = require('./oauth2/session');

const app = express();

var whitelist = JSON.parse(process.env.CORS_WHITELIST);
const successRedirectUrl = process.env.SUCCESS_REDIRECT_URL || '';
var corsOptions = {
  credentials: true,
  origin: whitelist
};
app.use(cors(corsOptions));


var refreshStrategy = new OAuth2Refresh({
  refreshWindow: 10, // Time in seconds to perform a token refresh before it expires
  userProperty: 'ticket', // Active user property name to store OAuth tokens
  authenticationURL: '/login', // URL to redirect unauthorized users to
  callbackParameter: 'callback' //URL query parameter name to pass a return URL
});

passport.use('main', refreshStrategy);  //Main authorization strategy that authenticates user and performs token refresh if needed

var strategy = new OAuth2({
  authorizationURL: process.env.OAUTH2_AUTH_URL,
  tokenURL: process.env.OAUTH2_TOKEN_URL,
  clientID: process.env.OAUTH2_CLIENT_ID,
  clientSecret: process.env.OAUTH2_SECRET,
  callbackURL: process.env.OAUTH2_CALLBACK_URL,
  passReqToCallback: false //Must be omitted or set to false in order to work with OAuth2RefreshTokenStrategy
},
  refreshStrategy.getOAuth2StrategyCallback()
);

passport.use('oauth2', strategy);
refreshStrategy.useOAuth2Strategy(strategy);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

app.use(sessionUtil.createExpressSession());
app.use(passport.initialize());
app.use(passport.session());
app.use(authnUtil.addIncomingTimestamp);

// Get user profile from Layman instead of CMS
OAuth2.prototype.userProfile = (access_token, done) => {

  (async () => {
    try {
      const response = await got(process.env.LAYMAN_USER_PROFILE_URL, {
        responseType: 'json',
        headers: {
          'AuthorizationIssUrl': process.env.OAUTH2_AUTH_URL,
          'Authorization': `Bearer ${access_token}`,
        }
      });

      // reserve username in Layman in case it does not exist yet
      authnUtil.ensureUsername(access_token, response.body);

      console.log(response.body);
      done(null, response.body);
    }
    catch (error) {
      console.log(error.response.body);
    }
  })();
};

// Layman proxy for whole REST API
app.use(`/rest`,
  createProxyMiddleware({
    target: process.env.LAYMAN_BASEURL,
    changeOrigin: true,
    selfHandleResponse: true,
    secure: !process.env.LAYMAN_BASEURL.includes('http://local'),
    onProxyReq: (proxyReq, req, res) => {
      try {
        authnUtil.addAuthenticationHeaders(proxyReq, req, res);
      }
      catch (error) {
        res.send(error);
      }
    },
    onProxyRes: authnUtil.handleProxyRes
  }),
);

const gsProxy = createProxyMiddleware({
  target: process.env.LAYMAN_BASEURL,
  changeOrigin: true,
  selfHandleResponse: true,
  secure: !process.env.LAYMAN_BASEURL.includes('http://local'),
  onProxyReq: (proxyReq, req, res) => {
    authnUtil.addAuthenticationHeaders(proxyReq, req, res);
  },
  onProxyRes: authnUtil.handleProxyRes
});
// Layman proxy for WFS transactions endpoint
app.use(`/geoserver`, gsProxy);
app.use(`/client/geoserver`, gsProxy);

app.get('/', (req, res) => {
  if (req.session.passport && req.session.passport.user && req.session.passport.user.authenticated) {
    res.send(req.session.passport.user.username); // TODO: - close opener window/modal popup
  }
  else
    res.send("<a href='/login'>Login</a>");
});

app.get('/login', passport.authenticate('oauth2'));

app.get('/logout', (req, res) => {
  authnUtil.deleteUserSession(req);
  req.logout((err) => {
    if (err) console.log(err);
  });
  res.redirect('/');
});

app.get('/callback', passport.authenticate('oauth2', { failureRedirect: '/error' }), function (req, res) {
  if (req.session.passport && req.session.passport.user && (req.session.passport.user.authenticated || req.session.passport.user.ticket)) {
    res.send(`Logged in as ${req.session.passport.user.username || req.session.passport.user.claims.screen_name}. You can now close this window and return back to the map.
    <script>
    function inIframe () {
        try {
            return window.self !== window.top;
        } catch (e) {
            return true;
        }
    }
    if(!inIframe ()){
      if('${successRedirectUrl}' != '') window.location.replace("${successRedirectUrl}");
    }
    </script>
    `);
  }
  else
    res.send("<a href='/login'>Login</a>");
});

app.get('/error', (req, res) => {
  res.send("error");
});

// start the service on the port xxxx
app.listen(process.env.LAYMAN_PORT || 8087, () => console.log(`HSLayers auth service for Layman listening on port ${process.env.LAYMAN_PORT || 8087}`));
