"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookies = parseCookies;
function decodeCookieValue(value) {
    try {
        return decodeURIComponent(value);
    }
    catch {
        return value;
    }
}
function parseCookies(req, _res, next) {
    const header = req.headers.cookie;
    const cookies = {};
    if (header) {
        for (const part of header.split(';')) {
            const separator = part.indexOf('=');
            if (separator <= 0) {
                continue;
            }
            const name = part.slice(0, separator).trim();
            const value = part.slice(separator + 1).trim();
            if (name) {
                cookies[name] = decodeCookieValue(value);
            }
        }
    }
    req.cookies = cookies;
    next();
}
