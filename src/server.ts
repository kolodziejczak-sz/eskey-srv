import * as http from 'http';
import { parse as urlParse, URLSearchParams } from 'url';
import { Route, ClientRequest, ServerResponse, Handler } from './server.d'

export default class EskeyServer {

  constructor(
    private routes: Route[] = [],
    private server: http.Server = http.createServer()
    ) {}

  public onError = function(req: ClientRequest, res: ServerResponse, err: any): void  {
    res.statusCode = 500;
    res.statusMessage = http.STATUS_CODES[500];
    res.end();
  }

  public onNotFound = function(req: ClientRequest, res: ServerResponse): void {
    res.statusCode = 404;
    res.statusMessage = http.STATUS_CODES[404];
    res.end();
  }

  public applyRoutes(routes: Route[]): EskeyServer {
    this.routes = routes;
    return this;
  }

  public listen(...args: any[]): EskeyServer {
    this.server.on('request', (req: ClientRequest, res: ServerResponse) => {
      try {
        this.handleRequest(req, res);
      }
      catch(err) {
        this.onError(req, res, err);
      }
    });
    this.server.listen.apply(this.server, args);
    return this;
  }

  private handleRequest(req: ClientRequest, res: ServerResponse): void {
    const urlParsed = urlParse(req.url);
    const urlParts = urlParsed.pathname.split('/').filter(Boolean);

    req.params = {};
    req.queryParams = new URLSearchParams(urlParsed.query);
   
    const processRoutes = (routes: Route[], urlParts: string[]): void => {
      const [ head, ...tail ] = urlParts;
      const route = matchRoute(routes, head);
      if(route) {
        if(route.redirectTo) {
          this.redirect(res, route.redirectTo);
          return;
        }
        if(route.use) {
          let arr=route.use,len=arr.length,i=0;
          const next = () => res.finished || i < len && arr[i++](req, res, next);
          if(next() || res.finished) {
            return;
          }
        }
        if((route.children || []).length > 0) {
          processRoutes(route.children, route.path === '' ? urlParts : tail)
        }
      }
      this.onNotFound(req, res);
    }

    const matchRoute = (routes: Route[], urlPart: string): Route => {
      let isPathOk, isMethodOk, isParam;

      for(let route of routes) {
        isMethodOk = (!route.method || route.method === req.method);
        if(!isMethodOk) {
          continue;
        }
        isParam = (route.path && route.path[0] === ':');
        if(urlPart && isParam) {
          req.params[route.path.substring(1)] = urlPart;
          return route;
        }
        isPathOk = (!route.path || route.path === urlPart)
        if(isPathOk) {
          return route
        }
      }
      return undefined;
    }
    return processRoutes(this.routes, urlParts);
  }

  private redirect(res: ServerResponse, location: string): void {
    res.writeHead(302, { 'Location': location });
    res.end();
  }
}