## HSLayers Server

HSLayers Server is a server component for HSLayers map client applications. It is providing three web services:

* [Proxy](#proxy)
* [Share](#share)
* [Layman Authentication Client](#layman-auth-client).

All three services are configured using [.env file](https://github.com/motdotla/dotenv#readme).


### Proxy

Used to proxify requests made from the map client applications. Following env variables can be set:

`PROXY_PORT=8085` - (optional, default port 8085) specify port on which the service will run


### Share
Used for storing and serving maps for the purposes of sharing them via permalinks or to social media. Uses SQLite database for which you need to specify the path to (DB_PATH variable).
The same database is used by the [Layman authentication service](#layman). Following env variables can be set:

`SHARING_PORT=8086` - (optional, default port 8086) specify port on which the service will 
`DB_PATH=src/data/hslayers-server.db` - path to the SQLite database for storing shared maps


Supported operations:
*  `HTTP GET /?id=xxx&request=load` - returns previously saved map as JSON
* `HTTP GET /?id=xxx&request=socialshare` - returns previously saved map as HTML fragment that can be used for publishing to the most popular social media
* `HTTP GET /?id=xxx&request=loadsocialsharethumb` - returns image thumbnail of the previously saved map
* `HTTP POST /save` - saves map specified in the request body
* `HTTP POST /socialshare` - saves map attributes needed for generating social share HTML fragment (url, title, description, image = thumbnail)


### Layman Auth Client
Server part component of the OAuth2 authentication workflow for the [Layman](https://github.com/jirik/layman) server. 
It has been implemented based on the [recommendations](https://github.com/jirik/layman/blob/master/doc/oauth2/client-recommendations.md) for Layman client.
Liferay portal is being currently used as an identity provider. Following env variables can be set:

`LAYMAN_PORT=8087` - (optional, default port 8087) specify port on which the service will 
`DB_PATH=src/data/hslayers-server.db` - path to the SQLite database for storing user sessions
`SESSION_SECRET`=XXXXX` - OAuth2 session secret key
`SESSION_MAX_AGE=604800` - session cookie expiration
`LAYMAN_BASEURL=https://[layman.server]` - Layman instance URL
`LAYMAN_USER_PROFILE_URL=https://[layman.server]/rest/current-user` - URL of Layman REST API method that returns the identity of currently logged in user
`OAUTH2_AUTH_URL=https://[layman.server]/o/oauth2/authorize` - URL of Identity provider OAuth2 authorization endpoint
`OAUTH2_TOKEN_URL=https://[layman.server]/o/oauth2/token` - URL of Identity provider OAuth2 access token endpoint
`OAUTH2_CLIENT_ID=id-XXXXX-XXXX-XXXXX` - OAuth2 Client ID assigned to your application by the Identity provider
`OAUTH2_SECRET=secret-XXXXX-XXXXX-XXXXX` - OAuth2 secret key assigned to your application by the Identity provider
`OAUTH2_CALLBACK_URL=http://localhost:8087/callback` - OAuth2 successful authentication callback endpoint (served by the Layman Auth Client)
`CORS_WHITELIST=["http://localhost:4200", "https://hub.lesprojekt.cz"]` - origins allowed to use the Layman Auth Client for authentication

The client can be configured for any Layman instance. If your application runs in the same domain as the client, OAuth2 identity provider authorization form will appear in modal window.
If the application runs in different domain (or localhost), authorization form will open in a new window.

## Installation

```
npm i hslayers-server
```

## Run

./node_modules/.bin/hslayers-server
