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


### Proxy

Used to proxify requests made from client applications to access map layers or capability descriptions for services residing on other domains.
CORS headers are added to proxied requests.
A typical proxied request URL looks like this: `http://localhost:8085/http://google.com`

Proxy is also used for toponym searches (GeoNames) and routing (OpenRoutingService). 
API keys defined in .env files are added for those on server side to not expose secrets to users of client application. 

Following environment variables can be set:

* `PROXY_PORT=8085` - (optional, default port 8085) specify port on which the service will run
* `HS_GEONAMES_API_KEY=*****` - (optional) GeoNames API key (username) that will be used to authorize the GeoNames request
* `OPENROUTESERVICE_API_KEY=*****` - (optional) OpenRoutingService API key to be appended to requests GET parameters

Usually the hslayers-server is put behind another webserver such as Nginx or Apache using mod_proxy to have both the map application and proxy running on the same domain and port. Be careful not to merge double slashes in that case: set `merge_slashes off;` in nginx config.

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
