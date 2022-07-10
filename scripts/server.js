const http = require('http');
const fs = require('fs');

const projectPath = __dirname.split('\\').slice(0, -1).join('/');

// if no port number is provided, 3000 is used
const port = parseFloat(process.argv[2]) || 3000;

try {
	http.createServer((request, response) => {
		if (!request.url.startsWith('/kleecalculator')) return return404();

		let path = `${projectPath}/docs${request.url.slice('/kleecalculator'.length)}`;

		// make sure no ../ shenanigans happen that can lead to possible vulnerabilities
		if (path.indexOf('..') !== -1) return return404();

		// html files are allowed to have no extension in url
		if (fs.existsSync(`${path}.html`)) return response.end(fs.readFileSync(`${path}.html`));

		if (fs.existsSync(path)) {
			if (fs.lstatSync(path).isDirectory()) {
				// check if a index.html file is located in that directory
				path = `${path}${path.endsWith('/') ? '' : '/'}index.html`;
				if (fs.existsSync(path)) return response.end(fs.readFileSync(path));
				// otherwise, send the file located in the initial path
			} else return response.end(fs.readFileSync(path));
		}

		return return404();

		function return404() {
			if (fs.existsSync(`${projectPath}/docs/404.html`)) response.end(fs.readFileSync(`${projectPath}/docs/404.html`));
			else {
				response.statusCode = 404;
				response.end('File not found!');
			}
		}
	}).listen(port);

	console.log(`Server listening to port ${port}. Go to http://localhost:${port} to check it out!`);
} catch (error) {
	console.log(`Server failed to initialize.\nError:\n${error}`);
}
