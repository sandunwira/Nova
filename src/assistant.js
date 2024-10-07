const { appWindow } = window.__TAURI__.window;

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



chatForm.addEventListener('submit', function (event) {
	event.preventDefault();
	const userMessage = chatMessage.value.trim();

	if (userMessage.startsWith("open") || userMessage.startsWith("launch") || userMessage.startsWith("run") || userMessage.startsWith("start") || userMessage.startsWith("execute")) {
		const { applicationName, applicationPath } = findApplication(userMessage);
		botResponse.textContent = "Launching " + applicationName + "...";

		if (applicationPath) {
			openApplication(applicationPath, applicationName);
		} else {
			console.log("No application name detected");
			botResponse.textContent = "Sorry, I couldn't detect any applications by that name.";
		}
	} else if (userMessage.toLowerCase().includes("search")) {
		botResponse.textContent = "Searching the web...";
		searchWeb(userMessage).then(snippetText => botResponse.textContent = snippetText).catch(error => botResponse.textContent = "Sorry, I couldn't find any relevant information. Please try again in a bit or try a different search query.");
	} else if (userMessage.toLowerCase().includes("random movie") || userMessage.toLowerCase().includes("movie recommendation") || userMessage.toLowerCase().includes("suggest me a movie") || userMessage.toLowerCase().includes("suggest a movie")) {
		botResponse.textContent = "Searching for a movie...";
		getRandomMovie();
	} else if (userMessage.toLowerCase().includes("ip address") || userMessage.toLowerCase().includes("ip")) {
		botResponse.textContent = "Fetching your IP Address...";
		getIPAddress().then(ipaddress => botResponse.textContent = "Your IP Address is: " + ipaddress).catch(error => botResponse.textContent = "Sorry, I couldn't fetch your IP Address.");
	} else if (userMessage.toLowerCase().includes("weather")) {
		botResponse.textContent = "Fetching the weather...";
		getWeather().then(weatherDetails => botResponse.textContent = weatherDetails).catch(error => botResponse.textContent = "Sorry, I couldn't fetch the weather data.");
	} else if (userMessage.toLowerCase().includes("time") || userMessage.toLowerCase().includes("clock") || userMessage.toLowerCase().includes("current time") || userMessage.toLowerCase().includes("what's the time") || userMessage.toLowerCase().includes("what time is it") || userMessage.toLowerCase().includes("tell me the time")) {
		botResponse.textContent = "Fetching the time...";
		botResponse.textContent = "Current time is " + getTime();
	} else if (userMessage.toLowerCase().includes("date") || userMessage.toLowerCase().includes("today's date") || userMessage.toLowerCase().includes("what's the date") || userMessage.toLowerCase().includes("tell me the date") || userMessage.toLowerCase().includes("what date is it") || userMessage.toLowerCase().includes("what's today's date")) {
		botResponse.textContent = "Fetching the date...";
		botResponse.textContent = "Today is " + getDate();
	} else if (userMessage.toLowerCase().includes("calc") || userMessage.toLowerCase().includes("calculate") || userMessage.toLowerCase().includes("calculator") || userMessage.toLowerCase().includes("math")) {
		const expression = userMessage.replace("calc", "").replace("calculate", "").replace("calculator", "").replace("math", "").trim();
		botResponse.textContent = "Calculating...";
		const result = calculateNumbers(expression);
		botResponse.textContent = `The answer of ${expression} is: ${result}`;
	} else {
		const response = findResponse(userMessage);
		botResponse.textContent = response;
	}
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



// Function to replace dynamic variables in the response
function replaceDynamicVariables(response) {
	const customData = {
		// Custom data
		name: "Adam",
	};

	return response.replace(/\[([^\]]+)\]/g, (match, variable) => {
		return customData[variable] || match;
	});
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
					let selectedResponse = responses[Math.floor(Math.random() * responses.length)];
					// Replace dynamic variables with custom data
					selectedResponse = replaceDynamicVariables(selectedResponse);
					return selectedResponse;
				} else {
					console.error('Responses array is undefined for intent:', intent);
				}
			}
		}
	}

	// Return a default response if no match is found
	return 'Sorry, I don\'t understand that. Please try again.';
}



let applicationPrefix = ["open ", "launch ", "run ", "start ", "execute "]

// Function to find the application name from the user message
function findApplication(requestKeyword) {
	let applicationName = null;
	let matchedApplicationName = null;
	let applicationPath = null;

	for (const prefix of applicationPrefix) {
		if (requestKeyword.startsWith(prefix)) {
			applicationName = requestKeyword.replace(prefix, '').trim();
			const matchedApplication = applicationsData.find(app =>
				app.keywords && app.keywords.some(keyword => keyword.toLowerCase() === applicationName.toLowerCase())
			);
			if (matchedApplication) {
				matchedApplicationName = matchedApplication.name;
				applicationPath = matchedApplication.path;
				console.log(`Detected Application Name: ${matchedApplication.name}`);
			}
		}
	}

	return { applicationName: matchedApplicationName, applicationPath };
}

// Open the application if the user message contains the application name
async function openApplication(applicationPath, applicationName) {
	try {
		await window.__TAURI__.invoke('open_application', {
			destination: applicationPath
		});
		botResponse.textContent = `${applicationName} launched successfully. Enjoy!`;
	} catch (error) {
		console.error('Failed to open application:', error);
		new Notification('Failed to open the application', {
			body: 'Failed to open the application. Please try again later',
			sound: 'Default'
		});
		botResponse.textContent = `Failed to open ${applicationName}. Please try again later.`;
	}
}



// function to get a random movie
function getRandomMovie() {
	let movieDetails = null;
	let randomMovieID = Math.floor(Math.random() * 10000000);

	botResponse.textContent = "Searching for a movie...";

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



// function to get the ip address
async function getIPAddress() {
	return fetch('https://ipinfo.io/?token=a6384bf1fee5c5')
		.then(response => response.json())
		.then(data => {
			const ipaddress = data.ip;
			console.log(ipaddress);
			return ipaddress;
		})
		.catch(error => {
			console.error('Error in getIPAddress:', error);
			throw error;
		});
}



// function to get the weather
async function getWeather() {
	try {
		const ipaddressforlocation = await getIPAddress();
		console.log(`IP Address for Location: ${ipaddressforlocation}`);
		const location = await fetch(`https://ipinfo.io/${ipaddressforlocation}/city?token=a6384bf1fee5c5`)
			.then(response => response.text());
		console.log(`Location: ${location}`);
		const weatherData = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=2e65cf86daa6dc72fef7c3f47c32788e`)
			.then(response => response.json());
		console.log(weatherData);
		const weatherDetails = `Weather in ${location} (based on the IP Address) - ${weatherData.weather[0].description.charAt(0).toUpperCase() + weatherData.weather[0].description.slice(1)}\n- Temperature: ${Math.round(weatherData.main.temp - 273.15)}°C\n- Humidity: ${weatherData.main.humidity}%\n- Wind Speed: ${weatherData.wind.speed} m/s`;
		console.log(weatherDetails);
		return weatherDetails;
	} catch (error) {
		console.error('Error in getWeather:', error);
	}
}



// function to search the web
async function searchWeb(query) {
	query = query.replace('search ', '').trim();
	const proxyUrl = 'https://api.allorigins.win/get?url=';
	const targetUrl = encodeURIComponent(`https://html.duckduckgo.com/html/?q=${query}`);
	const url = proxyUrl + targetUrl;

	try {
		const response = await fetch(url);
		let data = await response.json();
		console.log('Fetched data:', data);

		let htmlString = data.contents.replace(/\s+/g, ' ').trim();
		console.log('HTML string:', htmlString);

		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, 'text/html');
		console.log('Parsed document:', doc);

		// Priority 1: Find the element with the ID 'zero_click_abstract'
		let snippetElement = doc.getElementById('zero_click_abstract');
		let snippetText = 'Sorry, I couldn\'t find any relevant information. Please try again in a bit or try a different search query.';

		if (snippetElement) {
			snippetText = snippetElement.innerText;
			console.log('Snippet text: ' + snippetText);
			snippetText = snippetText.replace('More at Wikipedia', '');
		} else {
			// Priority 2: Find the first element with the class 'result__snippet'
			const snippetElements = doc.querySelectorAll('.result__snippet');
			if (snippetElements.length > 0) {
				// Check if the first element's text starts with "Learn about"
				if (snippetElements[0].innerText.startsWith('Learn about')) {
					// If so, use the second element's text if it exists
					if (snippetElements.length > 1) {
						snippetText = snippetElements[1].innerText;
					}
				} else {
					// Otherwise, use the first element's text
					snippetText = snippetElements[0].innerText;
				}
			}
		}

		// Remove the last sentence that contains "More at..."
		snippetText = snippetText.replace(/\.?\s*More at.*$/, '');

		// Split the text into sentences
		let sentences = snippetText.split('. ');

		// Remove the last sentence that ends with "..."
		for (let i = sentences.length - 1; i >= 0; i--) {
			if (sentences[i].endsWith('...')) {
				sentences.splice(i, 1);
				break;
			}
		}

		// Remove citation elements such as "[1]" or "[a]", "[ 1 ]" or "[ a ]" from the sentences
		sentences = sentences.map(sentence => sentence.replace(/\[[a-zA-Z0-9]+\]/g, '').replace(/\[[ a-zA-Z0-9 ]+\]/g, ''));

		// Join the sentences back together
		snippetText = sentences.join('. ');

		if (snippetText.length === 0) {
			snippetText = 'Sorry, I couldn\'t find any relevant information. Please try again in a bit or try a different search query.';
		}

		console.log('Sanitized snippet text: ' + snippetText);

		return snippetText;
	}
	catch (error) {
		console.error('Error fetching or parsing HTML:', error);
		throw error;
	}
}



// function to get the time
function getTime() {
	let date = new Date();
	let hours = date.getHours();
	hours = hours - 12;
	if (hours < 10) {
		hours = '0' + hours;
	}
	let minutes = date.getMinutes();
	if (minutes < 10) {
		minutes = '0' + minutes;
	}
	let ampm = date.getHours() >= 12 ? 'pm' : 'am';
	return `${hours}:${minutes}${ampm}`;
}



// function to get the date
function getDate() {
	let date = new Date();
	let day = date.getDate();
	if (day < 10) {
		day = '0' + day;
	}
	let month = date.getMonth();
	switch (month) {
		case 0: month = "January"; break;
		case 1: month = "February"; break;
		case 2: month = "March"; break;
		case 3: month = "April"; break;
		case 4: month = "May"; break;
		case 5: month = "June"; break;
		case 6: month = "July"; break;
		case 7: month = "August"; break;
		case 8: month = "September"; break;
		case 9: month = "October"; break;
		case 10: month = "November"; break;
		case 11: month = "December"; break;
	}
	let year = date.getFullYear();
	return `${month} ${day}, ${year}`;
}



// function to calculate numbers
function calculateNumbers(expression) {
	try {
		const result = new Function('return ' + expression)();
		return result;
	}
	catch (error) {
		console.error('Error in calculateNumbers:', error);
		throw error;
	}
}