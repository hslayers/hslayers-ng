const got = require('got');
require('dotenv').config();


exports.addIncomingTimestamp = (req, res, next) => {
  req.incoming_timestamp = Date.now();
  next();
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
    Authorization: user.ticket ? `Bearer ${user.ticket.access_token}` : ''
  }
};

exports.handleProxyRes = (proxyRes, req, res) => {
  this.allowOrigin(proxyRes, req, res);

  var body = [];
  proxyRes.on('data', function (chunk) {
    body.push(chunk);
  });
  proxyRes.on('end', function () {
    try {
      if (this.headers["content-type"] == "text/xml" || this.headers["content-type"] == "application/json") {
        let repl = new RegExp(process.env.LAYMAN_BASEURL.trimEnd('/') + '(?!/.*/record/basic)', "g");
        let replWith = process.env.OAUTH2_CALLBACK_URL.replace("/callback", "").trimEnd('/');
        body = Buffer.concat(body).toString().replace(repl, replWith);

        /* 
          /rest/layers || rest/workspaces/layers
          X-Total-Count header includes total number of layers available from the request
        */
        if (this.headers['x-total-count']) {
          res.setHeader('x-total-count', this.headers['x-total-count']);
          res.setHeader('Access-Control-Expose-Headers', 'x-total-count');
        }
        res.end(body);
      }
      else {
        res.end(Buffer.concat(body));
      }
    }
    catch (error) {
      res.end(error);
    }
  });
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
