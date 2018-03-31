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
        response.writeHead(HTTP_STATUS_INTERNAL_SERVER_ERROR, getHeaders('?.html'));
        response.end(`<h1>\u{1F6D1}ERROR</h1><p>${error.message}</p>`, ENCODING);
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
      response.writeHead(HTTP_STATUS_INTERNAL_SERVER_ERROR, getHeaders('?.html'));
      response.end(`Can not read folder: ${folderPath}\r\n${err}`, ENCODING);
    } else {
      response.writeHead(HTTP_STATUS_OK, getHeaders('?.html'));
      response.write('<h1>Folder Contents</h1>', ENCODING);
      response.write(`<h2>\u{1F4C2}${folderPath}</h2>`, ENCODING);
      response.write('<ol>', ENCODING);
      response.write('<li>\u{1F3E0}<a href="/">(root) /</a></li>', ENCODING);
      response.write('<li>\u{1F53C}<a href="../">(parent) ../</a></li>', ENCODING);
      files.filter(isVisibleFile).forEach(writeLink, response);
      response.end('</ol>', ENCODING);
    }
  });
}

function isVisibleFile(file) {
  return file.indexOf(".") !== 0;
}

function writeLink(file) {
  let icon = '\u{1F4C3}';
  try {
    let stat = fs.statSync(file);
    if (stat.isDirectory()) {
      file += '/';
      icon = '\u{1F4C1}';
    }
  } catch (e) {
    // swallow (probably looking at a file in a hidden .folder path)
  }
  this.write(`<li>${icon}<a href="${file}">${file}</a></li>`, ENCODING);
}

function getHeaders(localPath) {
  let ext = localPath ? path.extname(localPath).split('.').pop() : '';
  const CONTENT_TYPES = {
    js: 'text/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    png: 'image/png',
    css: 'text/css; charset=utf-8',
    html: 'text/html; charset=utf-8'
  };
  return {
    'Content-Type': CONTENT_TYPES[(ext || '').toLowerCase()] || 'text/plain; charset=utf-8'
  };
}
