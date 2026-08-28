(() => {
	const splash = document.getElementById('splash-screen');
	if (splash) {
		splash.style.removeProperty('display');
		splash.style.display = 'flex';
		splash.style.alignItems = 'center';
		splash.style.justifyContent = 'center';
	}
})();
