require('dotenv').config();

const querystring = require('querystring');
// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = process.env.PROXY_PORT || 8085;

const cors_proxy = require('cors-anywhere').createServer({
  originWhitelist: [], // Allow all origins
  httpProxyOptions: {
    // Disable X-Forwarded-* headers since some map servers use it to generate URLs in capabilities
    xfwd: false,
    ssl: {
      //https://nodejs.org/api/tls.html#tlscreatesecurecontextoptions
      //https://wiki.openssl.org/index.php/List_of_SSL_OP_Flags#Table_of_Options
      //https://github.com/rwinlib/openssl/blob/b78d57f34d726627aeadcb6867e439dcc4f89e07/include/openssl/ssl.h#L343
      secureOptions: (1 << 2)
    },
  }
});
const GEONAMES_APIKEY = process.env.HS_GEONAMES_API_KEY || 'hslayersng';

require('http')
  .createServer((req, res) => {
    try {
      if (req.url == "" || req.url == "/") {
        res.write('HSLayers server proxy<br />');
        res.write(`${getIP()}:${port}`);
        res.end();
      }
      else {
        req.url = decodeURIComponent(req.url);
        const [base, queryParams] = req.url.split('?');
        const params = querystring.parse(queryParams);
        req.url = base + '?' + querystring.encode(params);
        if (req.url.indexOf('api.geonames.org/searchJSON') > -1) {
          if (
            typeof params.provider == 'undefined' ||
            params.provider == 'geonames'
          ) {
            req.url = `/http://api.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(
              params.name_startsWith
            )}&username=${GEONAMES_APIKEY}`;
          }
        }
        if (req.url.indexOf('api.openrouteservice.org') > -1) {
          req.headers.authorization = process.env.OPENROUTESERVICE_API_KEY
        }
        
        cors_proxy.emit('request', req, res);
      }
    } catch (ex) {
      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.write('Invalid request');
      res.write(ex);
      res.end();
    }
  })
  .listen(port, host, () => {
    console.log('HSLayers proxy listening on ' + host + ':' + port);
  });


function getIP() {
  const { networkInterfaces } = require('os');

  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }

  return "0";
}
