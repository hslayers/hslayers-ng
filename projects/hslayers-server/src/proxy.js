require("dotenv").config();

const VERSION = require('../version');

const yargs = require('yargs');
const argv = yargs.argv;
const querystring = require("node:querystring");
// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || "0.0.0.0";
// Listen on a specific port via the PORT environment variable
const port = process.env.PROXY_PORT || 8085;

const cors_proxy = require("cors-anywhere").createServer({
  originWhitelist: [], // Allow all origins
  httpProxyOptions: {
    // Disable X-Forwarded-* headers since some map servers use it to generate URLs in capabilities
    xfwd: false,
    ssl: {
      //https://nodejs.org/api/tls.html#tlscreatesecurecontextoptions
      //https://wiki.openssl.org/index.php/List_of_SSL_OP_Flags#Table_of_Options
      //https://github.com/rwinlib/openssl/blob/b78d57f34d726627aeadcb6867e439dcc4f89e07/include/openssl/ssl.h#L343
      secureOptions: 1 << 2,
    },
  },
  // Remove X-Forwarded-* headers since some map servers (ArcGIS) use it to generate URLs in capabilities and 'xfwd' option does not guarantee that
  removeHeaders: ['x-forwarded-for', 'x-forwarded-host', 'x-forwarded-site', 'x-forwarder-server']
});
const GEONAMES_APIKEY = process.env.HS_GEONAMES_API_KEY || "hslayersng";

require("http")
  .createServer((req, res) => {
    try {
      if (argv.verbose) {
        console.log('Request URL: ' + req.url);
        console.log('Request headers: ' + JSON.stringify(req.headers));
        console.log('Request method: ' + req.method);
        console.log('Request body: ' + req.body);
        console.log('Request query: ' + req.query);
        console.log('Request params: ' + req.params);
        console.log('Request path: ' + req.path);
        console.log('Request protocol: ' + req.protocol);
        console.log('Request hostname: ' + req.hostname);
        console.log('Request ip: ' + req.ip);
        console.log('Request port: ' + req.port);
        console.log('Request secure: ' + req.secure);
        console.log('Request xhr: ' + req.xhr);
        console.log('Request base: ' + req.base);
        console.log('--------------------------------');
      }
      // Remove any proxy prefix from the URL like /proxy/ or /hslayers-server/proxy/
      req.url = req.url.replace(/^.*?(\/https?)/, '$1');
      if (req.url == "" || req.url == "/") {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.write('hslayers-server proxy<br>');
        res.write('version: ' + VERSION.VERSION + '<br>');
        res.write(`${getIP()}:${port}`);
        res.end();
      } else {
        // tinyurl requests are encoded on client
        if (req.url.includes('http://tinyurl.com/api-create.php')) {
          cors_proxy.emit('request', req, res);
          return;
        }
        // Previously, decoding incoming URL was necessary, but all known clients now send non-encoded requests
        //req.url = decodeURIComponent(req.url);
        req.url = encodeUrlPathAndParams(req.url);
        const [base, tld, pathAndQueryParams] = splitUrlAtTld(req.url);
        const params = querystring.parse(pathAndQueryParams.split("?")[1]);
        if (base.includes("api.geonames") && tld === "org" && pathAndQueryParams.startsWith("searchJSON")) {
          if (
            typeof params.provider == "undefined" ||
            params.provider == "geonames"
          ) {
            req.url = `/http://api.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(
              params.name_startsWith,
            )}&username=${GEONAMES_APIKEY}`;
          }
        }
        if (base.includes("api.openrouteservice") && tld == "org") {
          req.headers.authorization = process.env.OPENROUTESERVICE_API_KEY;
        }
        cors_proxy.emit("request", req, res);
      }
    } catch (ex) {
      if (argv.verbose) {
        console.error(ex);
        console.error(ex.stack);
        console.error(ex.message);
        console.error(ex.name);
        console.error(ex.code);
        console.error(ex.syscall);
        console.error(ex.address);
        console.error(ex.port);
        console.error('--------------------------------');
      }
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.write("Invalid request");
      res.write(ex.message || ex);
      res.end();
    }
  })
  .listen(port, host, () => {
    console.log("HSLayers proxy listening on " + host + ":" + port);
  });

function getIP() {
  const { networkInterfaces } = require("os");

  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "0";
}

/**
 * Created by ChatGPT
 * @param {string} url URL
 * @returns Array consisting of [domain, TLD+port, rest of the URL]
 */
function splitUrlAtTld(url) {
  // Regular expression to match the TLD with port (assuming it's a simple dot-based TLD)
  const tldWithPortRegex = /\.([a-zA-Z]{2,}|[0-9]{1,3})(?::\d+)?(?:\/|$)/;

  // Use the regex to find the TLD with port in the URL
  const tldWithPortMatch = url.match(tldWithPortRegex);

  if (tldWithPortMatch) {
    // The TLD with port including the dot
    const tldWithPort = tldWithPortMatch[0];

    // Split the URL using the TLD with port as the delimiter
    const parts = url.split(tldWithPort);

    // Remove the leading dot from the TLD
    const cleanedTLD = tldWithPort.slice(1).replace('/', '');

    return [
      parts[0], // Everything before the TLD with port
      cleanedTLD, // The TLD with port itself
      parts[1] || "", // Everything after the TLD with port (if present)
    ];
  } else {
    // No TLD with port found, return the original URL
    return [
      url,
      "",
      "",
    ];
  }
}

/**
 * Takes a decoded URL, splits it into parts and encodes its path and search strings
 * but leaves the host name untouched
 * @param {string} url URL
 * @returns partially encoded URL
 */
function encodeUrlPathAndParams(url) {
  const [base, tld, pathAndQueryParams] = splitUrlAtTld(url);
  const encodedPath = pathAndQueryParams.split('?')[0].split('/').map(segment => encodeURIComponent(segment));
  const queryParams = pathAndQueryParams.split('?').slice(1).join('?');
  const params = querystring.parse(queryParams);
  return base +
    '.' +
    tld +
    '/' +
    encodedPath.join('/') +
    (Object.keys(params).length == 0 ? '' : '?') +
    querystring.encode(params);
}
