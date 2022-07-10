document.getElementById('redirect-link').addEventListener('click', redirect);

setTimeout(() => {
	redirect();
}, 5000);

// replace method replaces the most recent page in browser history
// there shouldn't be a reason for the user to go back to the 404 page anyways
function redirect() {
	window.location.replace('/kleecalculator');
}
