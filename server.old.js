// server.js

// Node's built-in module for creating a web server.
// No npm install needed — this comes with Node itself.
const http = require('http');

// createServer takes a function that runs EVERY TIME
// a request hits your server. Node calls this function for you.
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-type': 'text/plain' });
    res.end('Home page');
  } else if (req.url === '/about') {
    res.writeHead(200, { 'Content-type': 'text/plain' });
    res.end('About page');
  } else {
    res.writeHead(404, { 'Content-type': 'text/plain' });
    res.end('Not found');
  }
  // req = information about the incoming request (url, method, headers...)
  // res = the object you use to send a response back

  console.log(req.method, req.url); // e.g. "GET /"

  // You must tell the client what's coming back: status code + headers

  // Then write the actual body of the response
});

// Tell the server to actually start listening on a port
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});