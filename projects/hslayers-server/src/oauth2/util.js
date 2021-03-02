const refresh = require('passport-oauth2-refresh');
require('dotenv').config();

//const refresh_authn_info_if_needed = async (req, res, next) => {
//  if (req.session.passport && req.session.passport.user) {
//    const user = req.session.passport.user;
//    const provider = PROVIDERS[user.authn.iss_id];
//    await provider.refresh_authn_info_if_needed(req);
//  }
//};


//exports.add_incoming_timestamp = (req, res, next) => {
//  const d = new Date();
//  const seconds = Math.round(d.getTime() / 1000);
//  req.incoming_timestamp = seconds;
//};

exports.ensure_username = async (access_token, profile) => {
  if (!profile['username']) {
    var response = await got.patch(`${process.env.LAYMAN_USER_PROFILE_URL}?adjust_username=true`, {
      method: 'PATCH',
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

const get_authn_headers = (user) => {
  return {
    AuthorizationIssUrl: user.authn.iss,
    Authorization: `Bearer ${user.authn.accessToken}`,
  }
};

exports.add_authn_headers = (proxyReq, req, res) => {
  this.check_token_expiration(req, 'oauth2');

  const d = new Date();
  const seconds = Math.round(d.getTime() / 1000);
  proxyReq.incoming_timestamp = seconds;

  if (req.session.passport && req.session.passport.user) {
    const user = req.session.passport.user;
    const headers = get_authn_headers(user);
    Object.keys(headers).forEach(k => {
      const v = headers[k];
      proxyReq.setHeader(k, v);
    });
  }
};

exports.allow_origin = (proxyRes, req, res) => {
  var whitelist = JSON.parse(process.env.CORS_WHITELIST);
  var origin = req.header('Origin');
  if (whitelist.indexOf(origin) !== -1) {
    proxyRes.headers['Access-Control-Allow-Origin'] = origin;
  }
};

exports.check_token_expiration = (req, strategyName) => {
  if (req.session.passport && req.session.passport.user && req.session.passport.user.authn) {
    if (Math.round(Date.now() / 1000) - 10 > req.session.passport.user.authn.expires) {
      refresh.requestNewAccessToken(strategyName, req.session.passport.user.authn.refreshToken, function (err, accessToken, refreshToken, extraParams) {
        req.session.passport.user.authn = {
          accessToken: accessToken,
          expires: Date.now() + extraParams.expires_in,
          refreshToken: refreshToken,
          iss: process.env.OAUTH2_AUTH_URL
        };
      });
    }
  }
};
