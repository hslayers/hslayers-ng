## HSLayers Server

HSLayers Server is a server component for HSLayers map client applications. It is providing three web services:

* [Proxy](#proxy)
* [Share](#share)
* [Layman Authentication Client](#layman-auth-client).

All three services are configured using [.env file](https://github.com/motdotla/dotenv#readme). It is mandatory to create one at least for running the Layman Client.


## Installation

```
npm i hslayers-server
```


## Run

```
npx hslayers-server [options]
```

#### Options

--proxy (-p) - run the proxy service (default: true)

--share (-s) - run the map share service (default: true)

--layman (-l) - run the Layman client service (default: false)


Run `npx hslayers-server --help` to get more info.


### Proxy (GIS Gateway)

The proxy service is a GIS-aware gateway built on top of [Hono](https://hono.dev) and [`@hono/node-server`](https://github.com/honojs/node-server). Unlike a generic HTTP proxy, it only forwards requests that classify as a recognized GIS map service or one of the named integrations listed below. Anything else is rejected with HTTP 400. CORS headers are added to forwarded requests so map libraries running in the browser can consume cross-origin responses.

A typical forwarded request URL still looks like: `http://localhost:8085/https://ags.cuzk.cz/.../WMSServer?SERVICE=WMS&REQUEST=GetMap&...` - the URL shape is backward compatible with the previous proxy, so no changes are required on the client side (`HsProxyService`).

#### Supported GIS services

| Kind | Detected by |
| --- | --- |
| OGC WMS / WMTS / WFS / WCS / CSW | `SERVICE=` query parameter, with `REQUEST=` restricted to a fixed allowlist (`GetCapabilities`, `GetMap`, `GetFeatureInfo`, `GetLegendGraphic`, `GetTile`, `GetFeature`, `DescribeFeatureType`, `GetCoverage`, `DescribeCoverage`, `GetRecords`, `GetRecordById`, ...) |
| ArcGIS REST | Path under `/rest/services/` ending in `MapServer`, `FeatureServer`, `ImageServer`, `GPServer`, `GeometryServer`, `VectorTileServer`, `SceneServer`, `WMSServer`, `WFSServer`, `WMTSServer` |
| OGC API (Features / Tiles / Maps / Processes / Styles) | Path contains `collections`, `conformance`, `api`, `tiles`, `styles`, `processes`, `jobs`, `queryables`, `items` |
| XYZ / TMS tiles | Path matches `/{z}/{x}/{y}.(png\|jpg\|jpeg\|webp\|gif\|pbf\|mvt\|json)` (optionally with `@2x` retina suffix) |
| Cesium 3D Tiles / Quantized Mesh terrain | Path ends in `tileset.json`, `layer.json`, `.terrain`, `.b3dm`, `.i3dm`, `.pnts`, `.cmpt`, `.glb`, `.gltf` |

#### Named integrations (non-GIS helpers)

API keys defined in `.env` are injected server-side so secrets never reach the browser.

| Host | Behavior |
| --- | --- |
| `api.geonames.org` | Only `/searchJSON` is allowed; the query is rewritten to `?name_startsWith=<name>&username=<HS_GEONAMES_API_KEY>` |
| `api.openrouteservice.org` | The `Authorization` header is set to `OPENROUTESERVICE_API_KEY` |
| `tinyurl.com` | Only `/api-create.php` is allowed (map-share permalink shortener) |

#### Environment variables

* `PROXY_PORT=8085` - (optional, default 8085) port on which the gateway listens
* `HOST=0.0.0.0` - (optional, default 0.0.0.0) bind address
* `HS_GEONAMES_API_KEY=*****` - (optional) GeoNames API key (username) injected into GeoNames requests
* `OPENROUTESERVICE_API_KEY=*****` - (optional) OpenRouteService API key injected as `Authorization` header
* `PROXY_ALLOWED_PORTS=80,443,8080,8443` - (optional) comma-separated allowlist of upstream ports
* `PROXY_TIMEOUT_MS=15000` - (optional, default 15 s) per-request upstream timeout
* `PROXY_MAX_BODY_MB=50` - (optional, default 50 MB) maximum request and response body size

#### SSRF protection

The gateway is designed to minimize the risk of Server-Side Request Forgery. Each request passes through the following defense-in-depth pipeline; any failure returns `400`, `403`, `413` or `502`:

1. **URL shape check** - only `http:` and `https:` schemes are accepted; URLs carrying `user:pass@` credentials are rejected; the port must be in `PROXY_ALLOWED_PORTS`.
2. **IP-literal screening** - if the host is an IP literal, it is matched against the private/reserved block list (below) before any DNS activity.
3. **GIS classification** - the URL must classify as one of the supported GIS services or named integrations; any other URL is rejected with `400`.
4. **DNS pre-resolution** - the hostname is resolved with `dns.lookup({all: true})` and **every** returned address is screened. If any resolves to a reserved range (below), the request is refused.
5. **IP pinning** - the chosen address is pinned into Node's `http`/`https` request via the standard socket `lookup` option, defeating DNS-rebinding attacks that would otherwise flip a hostname to an internal IP between validation and connection. The original hostname is preserved for TLS SNI and the `Host` header so virtual-hosted services still route correctly.
6. **Header sanitization** - only a small whitelist of request headers is forwarded (`Accept`, `Accept-Language`, `Accept-Encoding`, `Range`, `If-None-Match`, `If-Modified-Since`, plus `Content-Type` for POST). `Cookie`, `Authorization`, `Host`, `Origin`, `Referer`, all `X-Forwarded-*`, and hop-by-hop headers are dropped. `Set-Cookie` and `WWW-Authenticate` are stripped from the response.
7. **Method restriction** - only `GET`, `HEAD`, `POST`, `OPTIONS` are accepted.
8. **Timeouts and size caps** - upstream requests are bounded by `PROXY_TIMEOUT_MS`; both request and response bodies are capped at `PROXY_MAX_BODY_MB`.
9. **Manual redirect re-validation** - redirects are never followed automatically. Up to 3 hops are allowed and each `Location` is re-run through the full pipeline (classification + SSRF screening + IP pinning) before being dispatched.

Blocked IPv4 ranges: `0.0.0.0/8`, `10.0.0.0/8`, `100.64.0.0/10`, `127.0.0.0/8`, `169.254.0.0/16` (includes `169.254.169.254` cloud-metadata endpoint), `172.16.0.0/12`, `192.0.0.0/24`, `192.0.2.0/24`, `192.168.0.0/16`, `198.18.0.0/15`, `198.51.100.0/24`, `203.0.113.0/24`, multicast `224.0.0.0/4` and above.

Blocked IPv6 ranges: `::`, `::1`, `fc00::/7` (ULA), `fe80::/10` (link-local), `ff00::/8` (multicast), `2001:db8::/32` (documentation), and any IPv4-mapped or IPv4-compatible form of a blocked IPv4.

#### Reverse-proxy deployment

The hslayers-server is typically placed behind Nginx or Apache (via `mod_proxy`) so that both the map application and the gateway share a domain and port. When using Nginx, set `merge_slashes off;` to preserve the embedded-URL format.

#### GeoNames

Example GeoNames GET request: 
`http://localhost:8085/http://api.geonames.org/searchJSON?&name_startsWith=New%20York`

`name_startsWith` GET parameter must be provided. Currently the API doesn't support other GeoNames requests or parameters. 

#### OpenRoutingService

Hslayers-server adds API to authorization header of all requests which contain `api.openrouteservice.org` in the URL.

Example POST request: `http://localhost:8085/https://api.openrouteservice.org/v2/directions/driving-car/geojson` 
and payload: 

```
{"coordinates":[[19.55436476896666,30.357609142973132],[20.186078636154157,30.910609695756108]]}
```


### Share
Used for storing and serving maps for the purposes of sharing them via permalinks or to social media. Uses SQLite database for which you need to specify the path to (DB_PATH variable).
The same database is used by the [Layman authentication service](#layman). Following env variables can be set:

* `SHARING_PORT=8086` - (optional, default port 8086) specify port on which the service will be available
* `DB_PATH=src/data/hslayers-server.db` - path to the SQLite database for storing shared maps


Supported operations:
* `HTTP GET /?id=xxx&request=load` - returns previously saved map as JSON
* `HTTP GET /?id=xxx&request=socialshare` - returns previously saved map as HTML fragment that can be used for publishing to the most popular social media
* `HTTP GET /?id=xxx&request=loadsocialsharethumb` - returns image thumbnail of the previously saved map
* `HTTP POST /save` - saves map specified in the request body
* `HTTP POST /socialshare` - saves map attributes needed for generating social share HTML fragment (url, title, description, image = thumbnail)


### Layman Auth Client
Server part component of the OAuth2 authentication workflow for the [Layman](https://github.com/jirik/layman) server. 
It has been implemented based on the [recommendations](https://github.com/jirik/layman/blob/master/doc/oauth2/client-recommendations.md) for Layman client.
Wagtail CMS is tested and being actively used as an identity provider. Liferay portal has been tested in the past.
Following env variables can be set:

* `LAYMAN_PORT=8087` - (optional, default port 8087) specify port on which the service will be available
* `DB_PATH=src/data/hslayers-server.db` - path to the SQLite database for storing user sessions
* `SESSION_SECRET=XXXXX` - OAuth2 session secret key (session between your application and Layman Auth Client)
* `SESSION_MAX_AGE=604800` - session cookie expiration, eg. 60 * 60 * 24 * 7 = 604800 s = 7 days
* `LAYMAN_BASEURL=https://[layman.server]` - Layman instance URL
* `LAYMAN_USER_PROFILE_URL=https://[layman.server]/rest/current-user` - URL of Layman REST API method that returns the identity of currently logged in user
* `OAUTH2_AUTH_URL=https://[layman.server]/o/oauth2/authorize` - URL of Identity provider OAuth2 authorization endpoint
* `OAUTH2_TOKEN_URL=https://[layman.server]/o/oauth2/token` - URL of Identity provider OAuth2 access token endpoint
* `OAUTH2_CLIENT_ID=id-XXXXX-XXXX-XXXXX` - OAuth2 Client ID assigned to your application by the Identity provider
* `OAUTH2_SECRET=secret-XXXXX-XXXXX-XXXXX` - OAuth2 secret key assigned to your application by the Identity provider
* `OAUTH2_CALLBACK_URL=http://localhost:8087/callback` - OAuth2 successful authentication callback endpoint (served by the Layman Auth Client)
* `CORS_WHITELIST=["http://localhost:4200", "https://hub.lesprojekt.cz"]` - origins allowed to use the Layman Auth Client for authentication

The client can be configured for any Layman instance. If your application runs in the same domain as the client, OAuth2 identity provider authorization form will appear in modal window.
If the application runs in different domain (or localhost), authorization form will open in a new window.
