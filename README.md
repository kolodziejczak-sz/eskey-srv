# eskey-srv
Nodejs micro http server with object notation routing. No dependencies are required.

```javascript
const EskeyServer = require('./lib/server');
const port = 8080
const app = new EskeyServer();

app.applyRoutes([{ method: 'GET', use: (req, res) => res.end("Hello world") }])

app.listen(port, () => process.stdout.write('Server is listening'));
```

Routing is based on provided array of routes. Interface of single route presented below:

```typescript
export interface Route {
  children?: Route[] 
  use?: Handler | Handler[],
  method?: string,
  path?: string,
  redirectTo?: string,
}
```

All properties are optional: more properties filled -> the match will be more precise.

The server extends ClientRequest with params and queryParams.

```typescript
export interface ClientRequest extends http.IncomingMessage {
  queryParams: URLSearchParams,
  params: {
    [key: string]:string
  },
}
export interface ServerResponse extends http.ServerResponse {}
```

With that being said below is more advanced example:

```typescript
const appRoutes: Route[] = [
  { 
    path: 'api',  use: someMiddleware, children: [
      { 
        path: 'users', children: [
          { 
            path: ':id', children: [
              { method: 'GET', use: usersController.getUser },
              { method: 'DELETE', use: [ usersController.auth, usersController.delete ] }
            ]
          },
          { method: 'GET', use: usersController.list }
        ]
      }
    ]
  },
  { path: '', use: (req, res) => res.end('Hello world') }
]

const httpServer = http.createServer();
const app = new EskeyServer(appRoutes, httpServer)
  .listen(8080, () => process.stdout.write('Server is listening'))
```
