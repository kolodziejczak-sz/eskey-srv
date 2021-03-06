import * as http from 'http';
import { parse as urlParse, URLSearchParams } from 'url';

export interface ServerResponse extends http.ServerResponse {}

export interface ClientRequest extends http.IncomingMessage {
  queryParams: URLSearchParams,
  params: {
    [key: string]: string
  },
}

export type Handler = (req: ClientRequest, res: ServerResponse) => any;

export interface Route {
  children?: Route[] 
  use?: Handler | Handler[],
  method?: string,
  path?: string,
  pathMatchFull? : boolean,
  redirectTo?: string,
}