process.env.NODE_PATH = (process.env.NODE_PATH || '') + ':/usr/lib/node_modules:/usr/lib/nodejs';
require('module').Module._initPaths();
process.env.APP_PATH = process.env.APP_PATH || __dirname;

var http = require('http');
var fs = require('fs');
var path = require('path');
var Service = require('webos-service');

// Port our bundled streaming server listens on. The default 11470 collides with
// the LG Content Store Stremio app's server already running on the TV, so server.js
// is patched (in the Makefile) to use this port and we proxy :8080 -> here.
var STREAMING_PORT = 11548;

// Lightweight logging so boot issues are diagnosable from the TV. Write to /tmp
// (world-writable, shared namespace) so it is readable over the dev SSH session
// regardless of which user the jailed service runs as.
var LOG_PATHS = ['/tmp/stremio-launch.log', path.join(__dirname, 'boot.log')];
function log(msg) {
    var line = '[' + new Date().toISOString() + '] ' + msg + '\n';
    LOG_PATHS.forEach(function(p) { try { fs.appendFileSync(p, line); } catch (_) {} });
    try { console.log(line.trim()); } catch (_) {}
}

// A crash in the streaming server must NOT take down the static UI server.
process.on('uncaughtException', function(err) {
    log('uncaughtException: ' + (err && err.stack ? err.stack : err));
});
process.on('unhandledRejection', function(err) {
    log('unhandledRejection: ' + err);
});

log('launch.js started, pid=' + process.pid);

var service = new Service('org.stremio.lgos.server');
var ready = false;
var pendingMessages = [];

// Keep the service alive indefinitely
service.activityManager.create('keepAlive', function() {});

// Register the start method — responds once the HTTP server is listening
service.register('start', function(message) {
    if (ready) {
        message.respond({ ready: true });
    } else {
        pendingMessages.push(message);
    }
});

// Static file serving
var wwwDir = path.join(__dirname, 'www');
var mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon', '.gif': 'image/gif', '.webp': 'image/webp',
    '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.json': 'application/json',
    '.map': 'application/json', '.txt': 'text/plain', '.mp3': 'audio/mpeg'
};

function serveStatic(urlPath, res, next) {
    // Reject path traversal
    var filePath = path.join(wwwDir, urlPath === '/' ? 'index.html' : urlPath);
    if (filePath.indexOf(wwwDir) !== 0) return next();

    fs.stat(filePath, function(err, stat) {
        if (err || !stat.isFile()) return next();
        var ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        var stream = fs.createReadStream(filePath);
        stream.on('error', function() { try { res.end(); } catch (_) {} });
        stream.pipe(res);
    });
}

function proxyToStreaming(req, res) {
    var opts = { hostname: '127.0.0.1', port: STREAMING_PORT, path: req.url, method: req.method, headers: req.headers };
    var proxy = http.request(opts, function(proxyRes) {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    proxy.on('error', function() { try { res.writeHead(502); res.end(); } catch (_) {} });
    req.pipe(proxy);
}

// Single server: static files first, then proxy to streaming server
var server = http.createServer(function(req, res) {
    var urlPath = req.url.split('?')[0];
    serveStatic(urlPath, res, function() { proxyToStreaming(req, res); });
});
server.on('error', function(err) {
    log('static server error: ' + err);
});
server.listen(8080, function() {
    ready = true;
    log('static UI server listening on port 8080');
    // Respond to any start calls that arrived before the server was ready
    pendingMessages.forEach(function(msg) { msg.respond({ ready: true }); });
    pendingMessages = [];
});

// Point the streaming server at the bundled ffmpeg binaries.
// HLS remux/transcode requires ffmpeg+ffprobe; without these the streaming
// server's /hlsv2/* endpoints return 500 "no ffmpeg found".
process.env.FFMPEG_BIN = path.join(__dirname, 'bin', 'ffmpeg');
process.env.FFPROBE_BIN = path.join(__dirname, 'bin', 'ffprobe');

// Load the bundled streaming server (listens on STREAMING_PORT). Guarded so a
// failure here still leaves the static UI server up.
try {
    log('loading server.js on port ' + STREAMING_PORT);
    require('./server.js');
    log('server.js loaded');
} catch (err) {
    log('server.js failed to load: ' + (err && err.stack ? err.stack : err));
}
