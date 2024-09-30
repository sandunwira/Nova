const { appWindow } = window.__TAURI__.window;

document.addEventListener('DOMContentLoaded', () => {
	const chatForm = document.getElementById('chatForm');
	const chatMessage = document.getElementById('chatMessage');
	const botResponse = document.getElementById('botResponse');

	let requestsData = [];
	let responsesData = [];
	let applicationsData = [];

	// Fetch the JSON files
	fetch('data/requests.json')
		.then(response => response.json())
		.then(data => {
			requestsData = data;
		});

	fetch('data/responses.json')
		.then(response => response.json())
		.then(data => {
			responsesData = data;
		});

	fetch('data/applications.json')
		.then(response => response.json())
		.then(data => {
			applicationsData = data;
		});

	// Function to calculate Levenshtein distance
	function levenshtein(a, b) {
		const matrix = [];

		for (let i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		for (let j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		for (let i = 1; i <= b.length; i++) {
			for (let j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) === a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(
						matrix[i - 1][j - 1] + 1,
						Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
					);
				}
			}
		}

		return matrix[b.length][a.length];
	}

	// Function to find the relevant response for a given request keyword
	function findResponse(requestKeyword) {
		// Find the intent for the given request keyword
		let intent = null;
		let minDistance = Infinity;
		let closestRequest = null;

		for (const request of requestsData) {
			for (const req of request.requests) {
				const distance = levenshtein(req.toLowerCase(), requestKeyword.toLowerCase());
				if (distance < minDistance) {
					minDistance = distance;
					closestRequest = req;
					intent = request.intent;
				}
			}
		}

		// Log the closest request keyword
		console.log(`Matched Intent: ${intent}`);

		// If intent is found, find the relevant response
		if (intent) {
			for (const response of responsesData) {
				if (response.intent === intent) {
					// Return a random response from the matched intent
					const responses = response.responses;
					if (responses) {
						return responses[Math.floor(Math.random() * responses.length)];
					} else {
						console.error('Responses array is undefined for intent:', intent);
					}
				}
			}
		}

		// Return a default response if no match is found
		return "Sorry, I don't understand.";
	}

	let applicationPrefix = [
		"open ",
		"launch ",
		"run ",
		"start ",
		"execute "
	]

	// Function to find the application name from the user message
	function findApplication(requestKeyword) {
		let applicationName = null;
		let matchedApplicationName = null;
		for (const prefix of applicationPrefix) {
			if (requestKeyword.startsWith(prefix)) {
				applicationName = requestKeyword.replace(prefix, '').trim();
				const matchedApplication = applicationsData.find(app => 
					app.keywords && app.keywords.some(keyword => keyword.toLowerCase() === applicationName.toLowerCase())
				);
				matchedApplicationName = matchedApplication.name;
				console.log(`Detected Application Name: ${matchedApplication.name}`);
			}
		}

		return matchedApplicationName;
	}

	// Open the application if the user message contains the application name
	async function openApplication(applicationPath) {
		try {
			await window.__TAURI__.invoke('open_application', {
				destination: applicationPath
			});
		} catch (error) {
			console.error('Failed to open application:', error);
			new Notification('Open Failed', {
				body: 'Failed to open the application. Please try again later',
				sound: 'Default'
			});
		}
	}


	chatForm.addEventListener('submit', function (event) {
		event.preventDefault();
		const userMessage = chatMessage.value.trim();
		if (userMessage.startsWith("open") || userMessage.startsWith("launch") || userMessage.startsWith("run") || userMessage.startsWith("start") || userMessage.startsWith("execute")) {
			const response = findResponse(userMessage);
			const applicationName = findApplication(userMessage);
			if (applicationName) {
				botResponse.textContent = "Opening " + applicationName + "...";
				const matchedApplication = applicationsData.find(app => 
					app.keywords && app.keywords.some(keyword => keyword.toLowerCase() === applicationName.toLowerCase())
				);
				if (matchedApplication) {
					openApplication(matchedApplication.path);
					console.log(`Opening application: ${matchedApplication.name}`);
				} else {
					console.log("Application not found in data");
					botResponse.textContent = "Sorry, I couldn't find the application in the data.";
				}
			} else {
				console.log("No application name detected");
				botResponse.textContent = "Sorry, I couldn't detect any applications by that name.";
			}
		} else if (userMessage.toLowerCase().includes("random movie") || userMessage.toLowerCase().includes("movie recommendation") || userMessage.toLowerCase().includes("suggest me a movie") || userMessage.toLowerCase().includes("suggest a movie")) {
			getRandomMovie();
		} else {
			const response = findResponse(userMessage);
			botResponse.textContent = response;
		}
	});
});


// function to get a random movie
function getRandomMovie() {
	let movieDetails = null;
	let randomMovieID = Math.floor(Math.random() * 10000000);

	fetch(`https://www.omdbapi.com/?i=tt${randomMovieID}&apikey=1e86c5d2`)
		.then(response => response.json())
		.then(data => {
			const movieTitle = data.Title;
			const movieYear = data.Year;
			const movieGenre = data.Genre;
			const moviePlot = data.Plot;
			const movieRating = data.imdbRating;
			const movieActors = data.Actors;
			const movieDirector = data.Director;
			const type = data.Type;

			console.log(randomMovieID);

			if (movieTitle === undefined || type === "episode") {
				getRandomMovie();
				return;
			}

			movieDetails = `${movieTitle} (${movieYear})\nGenre: ${movieGenre}\nRating: ${movieRating}\nDirector: ${movieDirector}\nActors: ${movieActors}\nPlot: ${moviePlot}\nImdb: https://www.imdb.com/title/${data.imdbID}`;
			console.log(movieDetails);
			botResponse.textContent = movieDetails
		});

	return movieDetails;
}