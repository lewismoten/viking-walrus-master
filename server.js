let http = require('http');
let fs = require('fs');
let path = require('path');
let url = require('url');

const HTTP_PORT = 8888;
const HTTP_STATUS_OK = 200;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const ENCODING = 'utf-8';

http.createServer(requestCallback).listen(HTTP_PORT);
console.log('Listening at http://127.0.0.1:%s', HTTP_PORT);

function requestCallback(request, response) {
  if (request.url === '/favicon.ico') {
    request.url = '/favicon.png';
  }
  let localPath = '.' + url.parse(request.url).pathname;
  fs.readFile(localPath, (error, content) => {
    if (error) {
      if (error.code === 'EISDIR') {
        showFolderContents(response, localPath);
      } else {
        response.writeHead(HTTP_STATUS_INTERNAL_SERVER_ERROR, getHeaders());
        response.end(`ERROR: ${error.message}`, ENCODING);
        console.error(error);
      }
    } else {
      response.writeHead(HTTP_STATUS_OK, getHeaders(localPath));
      response.end(content, ENCODING)
    }
  });
}

function showFolderContents(response, folderPath) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      response.writeHead(HTTP_STATUS_INTERNAL_SERVER_ERROR, getHeaders());
      response.end(`Can not read folder: ${folderPath}\r\n${err}`, ENCODING);
    } else {
      response.writeHead(HTTP_STATUS_OK, getHeaders('?.html'));
      response.write('<ol>', ENCODING);
      response.write('<li><a href="/">(root) /</a></li>', ENCODING);
      response.write('<li><a href="../">(parent) ../</a></li>', ENCODING);
      files.filter(isVisibleFile).forEach(writeLink, response);
      response.end('</ol>', ENCODING);
    }
  });
}

function isVisibleFile(file) {
  return file.indexOf(".") !== 0;
}

function writeLink(file) {
  try {
    let stat = fs.statSync(file);
    if (stat.isDirectory()) {
      file += '/';
    }
  } catch (e) {
    // swallow (probably looking at a file in a hidden .folder path)
  }
  this.write(`<li><a href="${file}">${file}</a></li>`, ENCODING);
}

function getHeaders(localPath) {
  let ext = localPath ? path.extname(localPath).split('.').pop() : '';
  const CONTENT_TYPES = {
    js: 'text/javascript',
    json: 'application/json',
    png: 'image/png',
    css: 'text/css',
    html: 'text/html'
  };
  return {
    'Content-Type': CONTENT_TYPES[(ext || '').toLowerCase()] || 'text/plain'
  };
}
