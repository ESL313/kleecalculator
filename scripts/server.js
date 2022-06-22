const http = require('http');
const fs = require('fs');

const port = parseFloat(process.argv[2]) || 3000;

try {
	http.createServer(function (req, res) {
		let requestUrl = '';
		if (req.url.startsWith('/kleecalculator')) requestUrl = req.url.slice('/kleecalculator'.length);
		else {
			if (fs.existsSync('./docs/404.html')) {
				res.end(fs.readFileSync('./docs/404.html'));
				return;
			} else {
				res.statusCode = 404;
				res.end('File not found!');
				return;
			}
		}
		let path = `./docs${requestUrl}`;

		// to make sure no ../ shenanigans happen that can lead to vulnerabilities
		if (path.indexOf('..') !== -1) {
			if (fs.existsSync('./docs/404.html')) {
				res.end(fs.readFileSync('./docs/404.html'));
				return;
			} else {
				res.statusCode = 404;
				res.end('File not found!');
				return;
			}
		}

		// html files are allowed to have no extension in url
		if (fs.existsSync(`${path}.html`)) {
			res.end(fs.readFileSync(`${path}.html`));
			return;
		}

		if (fs.existsSync(path)) {
			if (fs.lstatSync(path).isDirectory()) {
				path = `${path}${path.endsWith('/') ? '' : '/'}index.html`;

				if (fs.existsSync(path)) {
					res.end(fs.readFileSync(path));
					return;
				}
			} else {
				res.end(fs.readFileSync(path));
				return;
			}
		}

		if (fs.existsSync('./docs/404.html')) {
			res.end(fs.readFileSync('./docs/404.html'));
			return;
		} else {
			res.statusCode = 404;
			res.end('File not found!');
			return;
		}
	}).listen(port);

	console.log(`Server listening on port ${port}. Go to http://localhost:${port} to check it out!`);
} catch (error) {
	console.log(`Server failed to initialized.\nError:\n${error}`);
}
