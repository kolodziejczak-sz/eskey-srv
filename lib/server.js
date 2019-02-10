"use strict";
var http = require("http");
var url_1 = require("url");
var EskeyServer = /** @class */ (function () {
    function EskeyServer(routes, server) {
        if (routes === void 0) { routes = []; }
        if (server === void 0) { server = http.createServer(); }
        this.routes = routes;
        this.server = server;
        this.onError = function (req, res, err) {
            res.statusCode = 500;
            res.statusMessage = http.STATUS_CODES[500];
            res.end();
        };
        this.onNotFound = function (req, res) {
            res.statusCode = 404;
            res.statusMessage = http.STATUS_CODES[404];
            res.end();
        };
    }
    EskeyServer.prototype.applyRoutes = function (routes) {
        this.routes = routes;
        return this;
    };
    EskeyServer.prototype.listen = function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.server.on('request', function (req, res) {
            try {
                _this.handleRequest(req, res);
            }
            catch (err) {
                _this.onError(req, res, err);
            }
        });
        this.server.listen.apply(this.server, args);
        return this;
    };
    EskeyServer.prototype.handleRequest = function (req, res) {
        var _this = this;
        var urlParsed = url_1.parse(req.url);
        var urlParts = urlParsed.pathname.split('/').filter(Boolean);
        req.params = {};
        req.queryParams = new url_1.URLSearchParams(urlParsed.query);
        var processRoutes = function (routes, urlParts) {
            var head = urlParts[0], tail = urlParts.slice(1);
            var route = matchRoute(routes, head);
            if (!route) {
                _this.onNotFound(req, res);
            }
            else if (route.redirectTo) {
                _this.redirect(res, route.redirectTo);
            }
            else if (route.use) {
                var arr_1 = [].concat(route.use), len_1 = arr_1.length, i_1 = 0;
                var next_1 = function () {
                    if (res.finished)
                        return true;
                    if (i_1 < len_1)
                        return arr_1[i_1++](req, res, next_1);
                    if ((route.children || []).length > 0) {
                        processRoutes(route.children, route.path ? tail : urlParts);
                    }
                    else {
                        _this.onNotFound(req, res);
                    }
                };
                next_1();
            }
            else if ((route.children || []).length > 0) {
                processRoutes(route.children, route.path ? tail : urlParts);
            }
            else {
                _this.onNotFound(req, res);
            }
        };
        var matchRoute = function (routes, urlPart) {
            if (urlPart === void 0) { urlPart = ''; }
            var isPathOk, isMethodOk, isParam;
            for (var _i = 0, routes_1 = routes; _i < routes_1.length; _i++) {
                var route = routes_1[_i];
                isMethodOk = (!route.method || route.method === req.method);
                if (!isMethodOk) {
                    continue;
                }
                isParam = (route.path && route.path[0] === ':');
                if (urlPart && isParam) {
                    req.params[route.path.substring(1)] = urlPart;
                    return route;
                }
                isPathOk = route.pathMatchFull ? (route.path === urlPart)
                    : (!route.path || route.path === urlPart);
                if (isPathOk) {
                    return route;
                }
            }
            return undefined;
        };
        return processRoutes(this.routes, urlParts);
    };
    EskeyServer.prototype.redirect = function (res, location) {
        res.writeHead(302, { 'Location': location });
        res.end();
    };
    return EskeyServer;
}());
module.exports = EskeyServer;
