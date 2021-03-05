const refresh = require('passport-oauth2-refresh');
const got = require('got');
require('dotenv').config();


exports.addIncomingTimestamp = (req, res) => {
  req.incoming_timestamp = Date.now();
};

exports.ensureUsername = async (access_token, profile) => {
  if (!profile['username']) {
    var response = await got.patch(`${process.env.LAYMAN_USER_PROFILE_URL}?adjust_username=true`, {
      responseType: 'json',
      headers: {
        'AuthorizationIssUrl': process.env.OAUTH2_AUTH_URL,
        'Authorization': `Bearer ${access_token}`,
      }
    });

    profile = response;
  }
  return profile;
};

exports.deleteUserSession = async (req) => {
  let authenticated = !!(req.session.passport && req.session.passport.user);
  if (authenticated) {
    const user = req.session.passport.user;

    try {

      let response = await got.delete(process.env.LAYMAN_USER_PROFILE_URL, {
        headers: getAuthenticationHeaders(user)
      });

    } catch (e) {
      console.log('Error during DELETE User Session', e);
    }
  }
  return null;
};

const getAuthenticationHeaders = (user) => {
  return {
    AuthorizationIssUrl: process.env.OAUTH2_AUTH_URL,
    Authorization: `Bearer ${user.authn.accessToken}`,
  }
};

exports.addAuthenticationHeaders = (proxyReq, req, res) => {
  if (req.session.passport && req.session.passport.user) {
    const user = req.session.passport.user;
    const headers = getAuthenticationHeaders(user);
    Object.keys(headers).forEach(k => {
      const v = headers[k];
      proxyReq.setHeader(k, v);
    });
  }
};

exports.allowOrigin = (proxyRes, req, res) => {
  var whitelist = JSON.parse(process.env.CORS_WHITELIST);
  var origin = req.header('Origin');
  if (whitelist.indexOf(origin) !== -1) {
    proxyRes.headers['Access-Control-Allow-Origin'] = origin;
  }
};

exports.checkTokenExpiration = (req, strategyName) => {
  if (req.session.passport && req.session.passport.user && req.session.passport.user.authn) {
    let incomingTimestamp = req.incoming_timestamp;
    let refreshBeforeTimeSpan = process.env.REFRESH_SESSION_BEFORE || 10000; // 10 seconds

    // session is about to expire in the given time span, refresh the token
    if (incomingTimestamp - refreshBeforeTimeSpan > req.session.passport.user.authn.expires) {
      refreshAuthentication(req, req.session.passport.user, strategyName);
    }
  }
};

const refreshAuthentication = (req, user, strategyName) => {
  if (user.authn.refreshing) {
    let i = 0;
    const timer = setTimeout(() => {
      user = req.session.passport && req.session.passport.user;
      if (!user || !user.authn.refreshing || i > 100) {
        clearTimeout(timer);
      }
    }, 100);
    if (i > 100) {
      throw Error('OAuth2 refresh timeout reached!');
    }
    return;
  }

  user.authn.refreshing = true;

  refresh.requestNewAccessToken(strategyName, user.authn.refreshToken, function (err, accessToken, refreshToken, extraParams) {
    req.session.passport.user.authn = {
      accessToken: accessToken,
      expires: Date.now() + extraParams.expires_in,
      refreshToken: refreshToken,
      iss: process.env.OAUTH2_AUTH_URL
    };
  });
};
