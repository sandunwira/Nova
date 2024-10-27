const { appWindow, WebviewWindow } = window.__TAURI__.window;
const { invoke } = window.__TAURI__.tauri;

const chatForm = document.getElementById('chatForm');
const chatMessage = document.getElementById('chatMessage');
const botResponse = document.getElementById('botResponse');
const chatFormSubmitBtn = document.getElementById('chatFormSubmitBtn');


let requestsData = [];
let responsesData = [];
let applicationsData = [];
let bugcodesData = [];


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

fetch('data/bugcodes.json')
	.then(response => response.json())
	.then(data => {
		bugcodesData = data;
	});



chatForm.addEventListener('submit', function (event) {
	event.preventDefault();
	const userMessage = chatMessage.value.trim();

	if (userMessage.toLowerCase().includes("visit") || userMessage.toLowerCase().includes("go to")) {
		const url = userMessage.replace("visit", "").replace("go to", "").trim();
		botResponse.textContent = "Opening " + url + "...";
		openURL(url).then(() => botResponse.innerHTML = `Opened <a href="https://${url}" target="_blank">https://${url}</a> successfully. Enjoy!`).catch(error => botResponse.textContent = "Sorry, I couldn't open the URL.");
	} else if (userMessage.startsWith("open") || userMessage.startsWith("launch") || userMessage.startsWith("run") || userMessage.startsWith("start") || userMessage.startsWith("execute")) {
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
		getIPAddress().then(({ ipaddress }) => botResponse.textContent = `Your IP Address is: ${ipaddress}`).catch(error => botResponse.textContent = "Sorry, I couldn't fetch your IP Address.");
	} else if (userMessage.toLowerCase().includes("weather")) {
		botResponse.textContent = "Fetching the weather...";
		getWeather().then(weatherDetails => botResponse.textContent = weatherDetails).catch(error => botResponse.textContent = "Sorry, I couldn't fetch the weather.");
	} else if (userMessage.toLowerCase().includes("time") || userMessage.toLowerCase().includes("clock") || userMessage.toLowerCase().includes("current time") || userMessage.toLowerCase().includes("what's the time") || userMessage.toLowerCase().includes("what time is it") || userMessage.toLowerCase().includes("tell me the time")) {
		botResponse.textContent = "Fetching the time...";
		botResponse.textContent = "Current time is " + getTime();
	} else if (userMessage.toLowerCase().includes("date") || userMessage.toLowerCase().includes("today's date") || userMessage.toLowerCase().includes("what's the date") || userMessage.toLowerCase().includes("tell me the date") || userMessage.toLowerCase().includes("what date is it") || userMessage.toLowerCase().includes("what's today's date")) {
		botResponse.textContent = "Fetching the date...";
		const { day, month, year } = getDate();
		botResponse.textContent = `Today's date is ${month} ${day}, ${year}`;
	} else if (userMessage.toLowerCase().includes("calc") || userMessage.toLowerCase().includes("calculate") || userMessage.toLowerCase().includes("calculator") || userMessage.toLowerCase().includes("math")) {
		const expression = userMessage.replace("calc", "").replace("calculate", "").replace("calculator", "").replace("math", "").trim();
		botResponse.textContent = "Calculating...";
		const result = calculateNumbers(expression);
		botResponse.textContent = `The answer of ${expression} is: ${result}`;
	} else if (userMessage.toLowerCase().includes("news") || userMessage.toLowerCase().includes("headlines") || userMessage.toLowerCase().includes("latest news") || userMessage.toLowerCase().includes("news headlines")) {
		botResponse.textContent = "Fetching the latest news...";
		fetchNews().then(newsItems => {
			let newsText = "Here are the latest news headlines:<br><br>";
			newsItems.forEach((item, index) => {
				newsText += `${index + 1}. ${item.title}<br>${item.description}<br><a href="${item.link}" target="_blank">Read more</a><br><br>`;
			});
			botResponse.innerHTML = newsText;
		}).catch(error => botResponse.textContent = "Sorry, I couldn't fetch the latest news.");
	} else if (userMessage.toLowerCase().includes("iotd") || userMessage.toLowerCase().includes("image of the day") || userMessage.toLowerCase().includes("bing image") || userMessage.toLowerCase().includes("bing wallpaper")) {
		botResponse.textContent = "Fetching the image of the day...";
		getImageOfTheDay().then(({ imageTitle, imageUrl, imageCredits }) => {
			botResponse.innerHTML = `<strong>${imageTitle}</strong><br><img src="${imageUrl}" alt="${imageTitle}" style="max-width: 100%;"><br><small>Image Credits: ${imageCredits}</small>`;
		}).catch(error => botResponse.textContent = "Sorry, I couldn't fetch the image of the day.");
	} else if (userMessage.toLowerCase().includes("qotd") || userMessage.toLowerCase().includes("quote of the day") || userMessage.toLowerCase().includes("inspirational quote") || userMessage.toLowerCase().includes("motivational quote")) {
		botResponse.textContent = "Fetching the quote of the day...";
		getQuoteOfTheDay().then(quote => botResponse.textContent = quote).catch(error => botResponse.textContent = "Sorry, I couldn't fetch the quote of the day.");
	} else if (userMessage.toLowerCase().includes("random quote") || userMessage.toLowerCase().includes("quote")) {
		botResponse.textContent = "Fetching a random quote...";
		getRandomQuote().then(quote => botResponse.textContent = quote).catch(error => botResponse.textContent = "Sorry, I couldn't fetch a random quote.");
	} else if (userMessage.toLowerCase().includes("on this day") || userMessage.toLowerCase().includes("on this day events") || userMessage.toLowerCase().includes("on this day in history") || userMessage.toLowerCase().includes("on this day facts")) {
		botResponse.textContent = "Fetching on this day events...";
		getOnThisDayEvents().then(events => {
			const { day, month } = getDate();
			let eventsText = `Here are some interesting events that happened on ${month} ${day} in history:<br><br>`;
			events.forEach((event, index) => {
				eventsText += `${index + 1}. ${event}<br>`;
			});
			botResponse.innerHTML = eventsText;
		}).catch(error => botResponse.textContent = "Sorry, I couldn't fetch on this day events.");
	} else if (userMessage.toLowerCase().includes("meal") || userMessage.toLowerCase().includes("recipe") || userMessage.toLowerCase().includes("food") || userMessage.toLowerCase().includes("random meal") || userMessage.toLowerCase().includes("meal recipe") || userMessage.toLowerCase().includes("meal suggestion") || userMessage.toLowerCase().includes("meal recommendation")) {
		botResponse.textContent = "Fetching a random meal recipe...";
		getRandomMeal().then(mealDetails => botResponse.innerHTML = mealDetails).catch(error => botResponse.textContent = "Sorry, I couldn't fetch a random meal recipe.");
	} else if (userMessage.toLowerCase().includes("books about")) {
		const query = userMessage.replace("books about", "").trim();
		botResponse.textContent = "Searching for books about " + query + "...";
		searchBooks(query).then(bookDetails => botResponse.innerHTML = `Here are books that I found for "${query}":<br><br>${bookDetails}`).catch(error => botResponse.textContent = "Sorry, I couldn't find any books about " + query + ".");
	} else if (userMessage.toLowerCase().startsWith("translate") && userMessage.toLowerCase().includes(" to ")) {
		const textToTranslate = userMessage.match(/translate (.+) to (.+)/i);
		if (textToTranslate && textToTranslate.length === 3) {
			const text = textToTranslate[1].trim();
			const targetLanguage = textToTranslate[2].trim();
			botResponse.textContent = "Translating the text...";
			translateText(text, targetLanguage).then(translatedText => botResponse.textContent = `Translated text: ${translatedText}`).catch(error => botResponse.textContent = "Sorry, I couldn't translate the text.");
		} else {
			botResponse.textContent = "Sorry, I couldn't understand the translation request. Please use the format: translate [text] to [target_language].";
		}
	} else if (userMessage.toLowerCase().includes("disaster") || userMessage.toLowerCase().includes("natural disaster") || userMessage.toLowerCase().includes("disaster alert") || userMessage.toLowerCase().includes("disaster warning")) {
		botResponse.textContent = "Fetching disaster alerts...";
		getDisasterAlerts().then(alerts => botResponse.innerHTML = alerts).catch(error => botResponse.textContent = "Sorry, I couldn't fetch disaster alerts.");
	} else if (userMessage.toLowerCase().includes("play")) {
		const query = userMessage.replace("play", "").trim();
		if (query === "") {
			botResponse.innerHTML = "Please provide a song name or artist to play.<br>Hint: play Believer by Imagine Dragons";
			return;
		} else {
			botResponse.textContent = "Opening YouTube Music...";
			openYTMusic(query).then(() => botResponse.textContent = "Opened YouTube Music").catch(error => botResponse.textContent = "Sorry, I couldn't open YouTube Music.");
		}
	} else if (userMessage.toLowerCase().includes("resume")) {
		botResponse.textContent = "Resuming playback...";
		playMedia();
	} else if (userMessage.toLowerCase().includes("pause")) {
		botResponse.textContent = "Pausing playback...";
		pauseMedia();
	} else if (userMessage.toLowerCase().includes("previous")) {
		botResponse.textContent = "Playing previous track...";
		previousMedia();
	} else if (userMessage.toLowerCase().includes("skip") || userMessage.toLowerCase().includes("next")) {
		botResponse.textContent = "Skipping to the next track...";
		nextMedia();
	} else if (userMessage.toLowerCase().includes("increase volume") || userMessage.toLowerCase().includes("volume up")) {
		botResponse.textContent = "Increasing volume...";
		increaseVolume();
	} else if (userMessage.toLowerCase().includes("decrease volume") || userMessage.toLowerCase().includes("volume down")) {
		botResponse.textContent = "Decreasing volume...";
		decreaseVolume();
	} else if (userMessage.toLowerCase().startsWith("mute")) {
		botResponse.textContent = "Muting the volume...";
		muteVolume();
	} else if (userMessage.toLowerCase().startsWith("unmute")) {
		botResponse.textContent = "Unmuting the volume...";
		unmuteVolume();
	} else if (userMessage.toLowerCase().includes("on wifi") || userMessage.toLowerCase().includes("wifi on")) {
		botResponse.textContent = "Turning on Wi-Fi...";
		turnOnWiFi();
	} else if (userMessage.toLowerCase().includes("off wifi") || userMessage.toLowerCase().includes("wifi off")) {
		botResponse.textContent = "Turning off Wi-Fi...";
		turnOffWiFi();
	} else if (userMessage.toLowerCase().startsWith("create qr for")) {
		const text = userMessage.replace("create qr for", "").trim();
		const qrCodeElement = createQRCode(text);
		botResponse.innerHTML = `Here's the QR Code for "${text}":<br><br>`;
		botResponse.appendChild(qrCodeElement);
	} else if (userMessage.toLowerCase().startsWith("convert")) {
		const match = userMessage.match(/convert (\d+)([a-zA-Z]+) to ([a-zA-Z]+)/);
		if (match) {
			const amount = parseFloat(match[1]);
			const fromCurrency = match[2].toUpperCase();
			const toCurrency = match[3].toUpperCase();
			let formattedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
			botResponse.textContent = `Converting ${formattedAmount} ${fromCurrency} to ${toCurrency}...`;
			convertCurrency(amount, fromCurrency, toCurrency)
				.then(convertedAmount => {
					botResponse.textContent = `${convertedAmount} as of ${getDate().month} ${getDate().day}, ${getDate().year} at ${getTime()}`;
				})
				.catch(error => {
					botResponse.textContent = "Sorry, I couldn't convert the currency.";
				});
		} else {
			botResponse.textContent = "Sorry, I couldn't understand the conversion request. Please use the format: convert [amount][base_currency] to [target_currency].";
		}
	} else if (userMessage.toLowerCase().includes("pc info")) {
		botResponse.textContent = "Fetching system information...";
		getSystemInfo().then(systemInfo => botResponse.textContent = systemInfo).catch(error => botResponse.textContent = "Sorry, I couldn't fetch system information.");
	} else if (userMessage.toLowerCase().includes("bug code") || userMessage.toLowerCase().includes("error")) {
		const bugCode = userMessage.match(/bug code 0x([0-9a-fA-F]+)/) || userMessage.match(/0x([0-9a-fA-F]+) error/);
		if (bugCode) {
			const bugCodeDetails = findBugCodeDetails(bugCode[1].toUpperCase());
			if (bugCodeDetails) {
				botResponse.innerHTML = `
					Here are the details for the bug code:<br><br>
					Bug Code: ${bugCodeDetails.code}<br>
					Code Name: ${bugCodeDetails.code_name}<br>
					Description: ${bugCodeDetails.description}<br>
					Solutions:<br>
					${bugCodeDetails.solutions.map(solution => `- ${solution}`).join('<br>')}
				`;
			} else {
				botResponse.textContent = "Sorry, I couldn't find any details for the bug code.";
			}
		} else {
			botResponse.textContent = "Sorry, I couldn't find any bug code in the request.";
		}
	} else if (userMessage.toLowerCase().includes("send email")) {
		botResponse.textContent = "Opening the email client...";
		sendEmail();
	} else if (userMessage.toLowerCase().startsWith("find")) {
		const searchTerms = userMessage.replace("find ", "");
		botResponse.textContent = `Searching for "${searchTerms}"...`;
		searchFile(searchTerms);
	} else if (userMessage.toLowerCase().includes("switch to light mode")) {
		botResponse.textContent = "Switching to Light Mode...";
		switchToLight().then(() => botResponse.textContent = "Switched to Light Mode successfully!").catch(error => botResponse.textContent = "Sorry, I couldn't switch to Light Mode.");
	} else if (userMessage.toLowerCase().includes("switch to dark mode")) {
		botResponse.textContent = "Switching to Dark Mode...";
		switchToDark().then(() => botResponse.textContent = "Switched to Dark Mode successfully!").catch(error => botResponse.textContent = "Sorry, I couldn't switch to Dark Mode.");
	} else if (userMessage.toLowerCase().includes("screenshot") || userMessage.toLowerCase().includes("take a screenshot")) {
		botResponse.textContent = "Taking a screenshot...";
		takeScreenshot().then(() => botResponse.textContent = "Screenshot successfully saved to Desktop!").catch(error => botResponse.textContent = "Sorry, I couldn't take a screenshot.");
	} else if (userMessage.toLowerCase().includes("wallpaper")) {
		const query = userMessage.match(/(?:set a |)([a-zA-Z]+) wallpaper/);

		if (query && query[1]) {
			const category = query[1];
			botResponse.textContent = "Changing the wallpaper...";
			changeWallpaper(category).then(() => botResponse.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} wallpaper changed successfully!`).catch(error => botResponse.textContent = "Sorry, I couldn't change the wallpaper.");
		} else {
			botResponse.textContent = "Sorry, I couldn't find any wallpaper to change.";
		}
	} else if (userMessage.toLowerCase().includes("shutdown pc") || userMessage.toLowerCase().includes("turn off pc")) {
		botResponse.textContent = "Shutting down the PC...";
		shutdown_pc().then(() => botResponse.textContent = "PC is shutting down...").catch(error => botResponse.textContent = "Sorry, I couldn't shut down the PC.");
	} else if (userMessage.toLowerCase().includes("restart pc") || userMessage.toLowerCase().includes("reboot pc")) {
		botResponse.textContent = "Restarting the PC...";
		restart_pc().then(() => botResponse.textContent = "PC is restarting...").catch(error => botResponse.textContent = "Sorry, I couldn't restart the PC.");
	} else if (userMessage.toLowerCase().includes("lock pc") || userMessage.toLowerCase().includes("lock computer")) {
		botResponse.textContent = "Locking the PC...";
		lock_pc().then(() => botResponse.textContent = "PC is locked...").catch(error => botResponse.textContent = "Sorry, I couldn't lock the PC.");
	} else if (userMessage.toLowerCase().includes("sleep pc") || userMessage.toLowerCase().includes("sleep computer")) {
		botResponse.textContent = "Putting the PC to sleep...";
		sleep_pc().then(() => botResponse.textContent = "PC is going to sleep...").catch(error => botResponse.textContent = "Sorry, I couldn't put the PC to sleep.");
	} else {
		const response = findResponse(userMessage);
		botResponse.innerHTML = response;
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
		feedback_url: "https://forms.gle/77MP5rjGaXWLjhmcA",
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



// Function to open a URL
async function openURL(url) {
	url = `https://${url}`;
	try {
		await window.__TAURI__.invoke('open_url', {
			url: url
		});
	} catch (error) {
		console.error('Failed to open URL:', error);
		throw error;
	}
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
			const country = data.country;
			return { ipaddress, country };
		})
		.catch(error => {
			console.error('Error in getIPAddress:', error);
			throw error;
		});
}



// function to get the weather
async function getWeather() {
	try {
		const { ipaddress } = await getIPAddress();
		console.log(`IP Address for Location: ${ipaddress}`);
		const location = await fetch(`https://ipinfo.io/${ipaddress}/city?token=a6384bf1fee5c5`)
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
		throw error;
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
	switch (hours) {
		case 0: hours = 12; break;
		case 13: hours = 1; break;
		case 14: hours = 2; break;
		case 15: hours = 3; break;
		case 16: hours = 4; break;
		case 17: hours = 5; break;
		case 18: hours = 6; break;
		case 19: hours = 7; break;
		case 20: hours = 8; break;
		case 21: hours = 9; break;
		case 22: hours = 10; break;
		case 23: hours = 11; break;
	}
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
	return { day, month, year };
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



// function to fetch news from rss feed
async function fetchNews() {
	try {
		const response = await fetch(`https://api.allorigins.win/get?url=https://abcnews.go.com/abcnews/internationalheadlines?${Date.now()}`);
		const data = await response.json();
		const xmlString = data.contents;
		const parser = new DOMParser();
		const xml = parser.parseFromString(xmlString, 'text/xml');
		const items = xml.querySelectorAll('item');
		const newsItems = [];

		items.forEach(item => {
			const title = item.querySelector('title').textContent;
			const description = item.querySelector('description').textContent;
			const link = item.querySelector('link').textContent;
			newsItems.push({ title, description, link });
		});

		return newsItems;
	} catch (error) {
		console.error('Error in fetchNews:', error);
		throw error;
	}
}



// function to get image of the day
async function getImageOfTheDay() {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US';
		const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const jsonData = JSON.parse(data.contents);
		const imageTitle = jsonData.images[0].title;
		const imageUrl = "https://www.bing.com" + jsonData.images[0].urlbase + "_1920x1080.jpg";
		const imageCredits = jsonData.images[0].copyright;
		return { imageTitle, imageUrl, imageCredits };
	} catch (error) {
		console.error('Error in getImageOfTheDay:', error);
		throw error;
	}
}



// function to get quote of the day
async function getQuoteOfTheDay() {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = 'https://zenquotes.io/api/today';
		const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const jsonData = JSON.parse(data.contents);
		const quote = jsonData[0].q + ' - ' + jsonData[0].a;
		return quote;
	}
	catch (error) {
		console.error('Error in getQuoteOfTheDay:', error);
		throw error;
	}
}



// function to get random quote
async function getRandomQuote() {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = 'https://zenquotes.io/api/random';
		const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}?${Date.now()}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const jsonData = JSON.parse(data.contents);
		const quote = jsonData[0].q + ' - ' + jsonData[0].a;
		return quote;
	}
	catch (error) {
		console.error('Error in getRandomQuote:', error);
		throw error;
	}
}



// function to get on this day events
async function getOnThisDayEvents() {
	let month = new Date().getMonth() + 1;
	let day = new Date().getDate();
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = `https://today.zenquotes.io/api/${month}/${day}`;
		const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const jsonData = JSON.parse(data.contents);
		const events = jsonData.data.Events.map(event => event.text);
		return events;
	}
	catch (error) {
		console.error('Error in getOnThisDayEvents:', error);
		throw error;
	}
}



// function to get random meal recipes
async function getRandomMeal() {
	try {
		const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
		const data = await response.json();
		const meal = data.meals[0];
		const mealName = meal.strMeal;
		const mealCategory = meal.strCategory;
		const mealArea = meal.strArea;
		const mealInstructions = meal.strInstructions;
		const mealIngredients = [];
		for (let i = 1; i <= 20; i++) {
			const ingredient = meal['strIngredient' + i];
			const measure = meal['strMeasure' + i];
			if (ingredient) {
				mealIngredients.push(`* ${ingredient}: ${measure}`);
			}
		}
		const mealImage = meal.strMealThumb;
		const mealYoutube = meal.strYoutube;
		const mealDetails = `
			${mealName} (${mealCategory}, ${mealArea})<br>
			<p>Ingredients:<br>
				${mealIngredients.join('<br>')}
			</p>
			<p>Instructions:<br>
				${mealInstructions}
			</p>
			<img src="${mealImage}" alt="${mealName}" style="height: 150px;">
			<p>YouTube: <a href="${mealYoutube}" target="_blank">${mealYoutube}</a></p>
		`;
		return mealDetails;
	} catch (error) {
		console.error('Error in getRandomMeal:', error);
		throw error;
	}
}



// function to search books
async function searchBooks(query) {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
		const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const jsonData = JSON.parse(data.contents);
		const books = jsonData.items;

		if (books && books.length > 0) {
			const bookDetails = books.map(book => {
				const volumeInfo = book.volumeInfo;
				const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : 'Unknown Author';
				return `
					<a href="${volumeInfo.infoLink}" target="_blank">${volumeInfo.title}</a><br>
					Authors: ${authors}<br>
					Publisher: ${volumeInfo.publisher}<br>
					Published Date: ${volumeInfo.publishedDate}<br>
					Description: ${volumeInfo.description}<br>
					${volumeInfo.imageLinks ? `<img src="${volumeInfo.imageLinks.thumbnail}" alt="${volumeInfo.title}">` : ''}<br>
				`;
			}).join('<br>');
			return bookDetails;
		} else {
			console.log('No books found');
			return [];
		}
	} catch (error) {
		console.error('Error fetching or parsing books:', error);
		throw error;
	}
}



// function to translate text
async function translateText(text, targetLanguage) {
	try {
		const proxyUrl = `https://auroraproxyserver.onrender.com/`;
		const targetUrl = 'https://api-free.deepl.com/v2/translate';
		targetLanguage = targetLanguage.toLowerCase();
		switch (targetLanguage) {
			case 'arabic': targetLanguage = 'AR'; break;
			case 'bulgarian': targetLanguage = 'BG'; break;
			case 'czech': targetLanguage = 'CS'; break;
			case 'danish': targetLanguage = 'DA'; break;
			case 'german': targetLanguage = 'DE'; break;
			case 'greek': targetLanguage = 'EL'; break;
			case 'english': targetLanguage = 'EN-US'; break;
			case 'spanish': targetLanguage = 'ES'; break;
			case 'estonian': targetLanguage = 'ET'; break;
			case 'finnish': targetLanguage = 'FI'; break;
			case 'french': targetLanguage = 'FR'; break;
			case 'hungarian': targetLanguage = 'HU'; break;
			case 'indonesian': targetLanguage = 'ID'; break;
			case 'italian': targetLanguage = 'IT'; break;
			case 'japanese': targetLanguage = 'JA'; break;
			case 'korean': targetLanguage = 'KO'; break;
			case 'lithuanian': targetLanguage = 'LT'; break;
			case 'latvian': targetLanguage = 'LV'; break;
			case 'norwegian': targetLanguage = 'NB'; break;
			case 'dutch': targetLanguage = 'NL'; break;
			case 'polish': targetLanguage = 'PL'; break;
			case 'portuguese br': targetLanguage = 'PT-BR'; break;
			case 'portuguese pt': targetLanguage = 'PT-PT'; break;
			case 'romanian': targetLanguage = 'RO'; break;
			case 'russian': targetLanguage = 'RU'; break;
			case 'slovak': targetLanguage = 'SK'; break;
			case 'slovenian': targetLanguage = 'SL'; break;
			case 'swedish': targetLanguage = 'SV'; break;
			case 'turkish': targetLanguage = 'TR'; break;
			case 'ukrainian': targetLanguage = 'UK'; break;
			case 'chinese': targetLanguage = 'ZH'; break;
			case 'chinese simplified': targetLanguage = 'ZH-HANS'; break;
			case 'chinese traditional': targetLanguage = 'ZH-HANT'; break;
		}
		const response = await fetch(`${proxyUrl}${targetUrl}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'DeepL-Auth-Key 93c60809-8f46-4788-b25f-9c73a7122ae8:fx'
			},
			body: JSON.stringify({
				text: [text],
				target_lang: targetLanguage
			})
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const translatedText = data.translations[0].text;
		return translatedText;
	} catch (error) {
		console.error('Error in translateText:', error);
		throw error;
	}
}



// function to create qr codes
function createQRCode(text) {
	const qrcode = new QRCode(document.createElement('div'), {
		text: text,
		width: 128,
		height: 128
	});

	const qrCodeImage = qrcode._el.firstChild.toDataURL('image/png');
	const qrCodeElement = document.createElement('img');
	qrCodeElement.src = qrCodeImage;
	qrCodeElement.alt = `QR Code for ${text}`;

	return qrCodeElement;
}



// function to open_ytmusic
async function openYTMusic(query) {
	try {
		console.log("Opening YouTube Music...");

		const ytmusic_window = new WebviewWindow('ytmusic_window', {
			url: 'https://music.youtube.com/search?q=' + query,
			title: 'YouTube Music',
			decorations: true,
			height: 400,
			width: 400,
			resizable: false,
			maximizable: false,
			x: 10,
			y: 10,
			fileDropEnabled: false,
			alwaysOnTop: false,
		});

		ytmusic_window.once('tauri://created', () => {
			console.log("Opened YouTube Music");
		});
	} catch (error) {
		ytmusic_window.once('tauri://error', (error) => {
			console.error("Failed to open YouTube Music:", error);
		});

		throw error;
	}
}


// function to play media
async function playMedia() {
	try {
		await window.__TAURI__.invoke('play_media');
		botResponse.textContent = "Resumed playback...";
	} catch (error) {
		console.error('Failed to play media:', error);
		botResponse.textContent = "Failed to play media. Please try again later.";
	}
}

// function to pause media
async function pauseMedia() {
	try {
		await window.__TAURI__.invoke('pause_media');
		botResponse.textContent = "Paused playback...";
	} catch (error) {
		console.error('Failed to pause media:', error);
		botResponse.textContent = "Failed to pause media. Please try again later.";
	}
}

// function to play previous media
async function previousMedia() {
	try {
		await window.__TAURI__.invoke('previous_media');
		botResponse.textContent = "Playing previous track...";
	} catch (error) {
		console.error('Failed to play previous media:', error);
		botResponse.textContent = "Failed to play previous track. Please try again later.";
	}
}

// function to play next media
async function nextMedia() {
	try {
		await window.__TAURI__.invoke('next_media');
		botResponse.textContent = "Playing next track...";
	} catch (error) {
		console.error('Failed to play next media:', error);
		botResponse.textContent = "Failed to skip to the next track. Please try again later.";
	}
}

// function to increase volume
async function increaseVolume() {
	try {
		await window.__TAURI__.invoke('increase_volume');
		botResponse.textContent = "Volume increased...";
	} catch (error) {
		console.error('Failed to increase volume:', error);
		botResponse.textContent = "Failed to increase volume. Please try again later.";
	}
}

// function to decrease volume
async function decreaseVolume() {
	try {
		await window.__TAURI__.invoke('decrease_volume');
		botResponse.textContent = "Volume decreased...";
	} catch (error) {
		console.error('Failed to decrease volume:', error);
		botResponse.textContent = "Failed to decrease volume. Please try again later.";
	}
}

// function to toggle mute
async function muteVolume() {
	try {
		await window.__TAURI__.invoke('toggle_mute');
		botResponse.textContent = "Volume muted...";
	} catch (error) {
		console.error('Failed to mute volume:', error);
		botResponse.textContent = "Failed to mute volume. Please try again later.";
	}
}

// function to toggle unmute
async function unmuteVolume() {
	try {
		await window.__TAURI__.invoke('toggle_mute');
		botResponse.textContent = "Volume unmuted...";
	} catch (error) {
		console.error('Failed to unmute volume:', error);
		botResponse.textContent = "Failed to unmute volume. Please try again later.";
	}
}



// function to turn on wifi
async function turnOnWiFi() {
	try {
		await window.__TAURI__.invoke('turn_on_wifi');
		botResponse.textContent = "WiFi turned on...";
	} catch (error) {
		console.error('Failed to turn on WiFi:', error);
		botResponse.textContent = "Failed to turn on WiFi. Please try again later.";
	}
}

// function to turn off wifi
async function turnOffWiFi() {
	try {
		await window.__TAURI__.invoke('turn_off_wifi');
		botResponse.textContent = "WiFi turned off...";
	} catch (error) {
		console.error('Failed to turn off WiFi:', error);
		botResponse.textContent = "Failed to turn off WiFi. Please try again later.";
	}
}



// function to get natural disaster alerts
async function getDisasterAlerts() {
	try {
		const { country } = await getIPAddress();
		let countryCode = country;
		switch (country) {
			case 'AF': countryCode = 'AFG'; break; case 'AX': countryCode = 'ALA'; break; case 'AL': countryCode = 'ALB'; break;
			case 'DZ': countryCode = 'DZA'; break; case 'AS': countryCode = 'ASM'; break; case 'AD': countryCode = 'AND'; break;
			case 'AO': countryCode = 'AGO'; break; case 'AI': countryCode = 'AIA'; break; case 'AQ': countryCode = 'ATA'; break;
			case 'AG': countryCode = 'ATG'; break; case 'AR': countryCode = 'ARG'; break; case 'AM': countryCode = 'ARM'; break;
			case 'AW': countryCode = 'ABW'; break; case 'AU': countryCode = 'AUS'; break; case 'AT': countryCode = 'AUT'; break;
			case 'AZ': countryCode = 'AZE'; break; case 'BS': countryCode = 'BHS'; break; case 'BH': countryCode = 'BHR'; break;
			case 'BD': countryCode = 'BGD'; break; case 'BB': countryCode = 'BRB'; break; case 'BY': countryCode = 'BLR'; break;
			case 'BE': countryCode = 'BEL'; break; case 'BZ': countryCode = 'BLZ'; break; case 'BJ': countryCode = 'BEN'; break;
			case 'BM': countryCode = 'BMU'; break; case 'BT': countryCode = 'BTN'; break; case 'BO': countryCode = 'BOL'; break;
			case 'BA': countryCode = 'BIH'; break; case 'BW': countryCode = 'BWA'; break; case 'BV': countryCode = 'BVT'; break;
			case 'BR': countryCode = 'BRA'; break; case 'VG': countryCode = 'VGB'; break; case 'IO': countryCode = 'IOT'; break;
			case 'BN': countryCode = 'BRN'; break; case 'BG': countryCode = 'BGR'; break; case 'BF': countryCode = 'BFA'; break;
			case 'BI': countryCode = 'BDI'; break; case 'KH': countryCode = 'KHM'; break; case 'CM': countryCode = 'CMR'; break;
			case 'CA': countryCode = 'CAN'; break; case 'CV': countryCode = 'CPV'; break; case 'KY': countryCode = 'CYM'; break;
			case 'CF': countryCode = 'CAF'; break; case 'TD': countryCode = 'TCD'; break; case 'CL': countryCode = 'CHL'; break;
			case 'CN': countryCode = 'CHN'; break; case 'HK': countryCode = 'HKG'; break; case 'MO': countryCode = 'MAC'; break;
			case 'CX': countryCode = 'CXR'; break; case 'CC': countryCode = 'CCK'; break; case 'CO': countryCode = 'COL'; break;
			case 'KM': countryCode = 'COM'; break; case 'CG': countryCode = 'COG'; break; case 'CD': countryCode = 'COD'; break;
			case 'CK': countryCode = 'COK'; break; case 'CR': countryCode = 'CRI'; break; case 'CI': countryCode = 'CIV'; break;
			case 'HR': countryCode = 'HRV'; break; case 'CU': countryCode = 'CUB'; break; case 'CY': countryCode = 'CYP'; break;
			case 'CZ': countryCode = 'CZE'; break; case 'DK': countryCode = 'DNK'; break; case 'DJ': countryCode = 'DJI'; break;
			case 'DM': countryCode = 'DMA'; break; case 'DO': countryCode = 'DOM'; break; case 'EC': countryCode = 'ECU'; break;
			case 'EG': countryCode = 'EGY'; break; case 'SV': countryCode = 'SLV'; break; case 'GQ': countryCode = 'GNQ'; break;
			case 'ER': countryCode = 'ERI'; break; case 'EE': countryCode = 'EST'; break; case 'ET': countryCode = 'ETH'; break;
			case 'FK': countryCode = 'FLK'; break; case 'FO': countryCode = 'FRO'; break; case 'FJ': countryCode = 'FJI'; break;
			case 'FI': countryCode = 'FIN'; break; case 'FR': countryCode = 'FRA'; break; case 'GF': countryCode = 'GUF'; break;
			case 'PF': countryCode = 'PYF'; break; case 'TF': countryCode = 'ATF'; break; case 'GA': countryCode = 'GAB'; break;
			case 'GM': countryCode = 'GMB'; break; case 'GE': countryCode = 'GEO'; break; case 'DE': countryCode = 'DEU'; break;
			case 'GH': countryCode = 'GHA'; break; case 'GI': countryCode = 'GIB'; break; case 'GR': countryCode = 'GRC'; break;
			case 'GL': countryCode = 'GRL'; break; case 'GD': countryCode = 'GRD'; break; case 'GP': countryCode = 'GLP'; break;
			case 'GU': countryCode = 'GUM'; break; case 'GT': countryCode = 'GTM'; break; case 'GG': countryCode = 'GGY'; break;
			case 'GN': countryCode = 'GIN'; break; case 'GW': countryCode = 'GNB'; break; case 'GY': countryCode = 'GUY'; break;
			case 'HT': countryCode = 'HTI'; break; case 'HM': countryCode = 'HMD'; break; case 'VA': countryCode = 'VAT'; break;
			case 'HN': countryCode = 'HND'; break; case 'HU': countryCode = 'HUN'; break; case 'IS': countryCode = 'ISL'; break;
			case 'IN': countryCode = 'IND'; break; case 'ID': countryCode = 'IDN'; break; case 'IR': countryCode = 'IRN'; break;
			case 'IQ': countryCode = 'IRQ'; break; case 'IE': countryCode = 'IRL'; break; case 'IM': countryCode = 'IMN'; break;
			case 'IL': countryCode = 'ISR'; break; case 'IT': countryCode = 'ITA'; break; case 'JM': countryCode = 'JAM'; break;
			case 'JP': countryCode = 'JPN'; break; case 'JE': countryCode = 'JEY'; break; case 'JO': countryCode = 'JOR'; break;
			case 'KZ': countryCode = 'KAZ'; break; case 'KE': countryCode = 'KEN'; break; case 'KI': countryCode = 'KIR'; break;
			case 'KP': countryCode = 'PRK'; break; case 'KR': countryCode = 'KOR'; break; case 'KW': countryCode = 'KWT'; break;
			case 'KG': countryCode = 'KGZ'; break; case 'LA': countryCode = 'LAO'; break; case 'LV': countryCode = 'LVA'; break;
			case 'LB': countryCode = 'LBN'; break; case 'LS': countryCode = 'LSO'; break; case 'LR': countryCode = 'LBR'; break;
			case 'LY': countryCode = 'LBY'; break; case 'LI': countryCode = 'LIE'; break; case 'LT': countryCode = 'LTU'; break;
			case 'LU': countryCode = 'LUX'; break; case 'MK': countryCode = 'MKD'; break; case 'MG': countryCode = 'MDG'; break;
			case 'MW': countryCode = 'MWI'; break; case 'MY': countryCode = 'MYS'; break; case 'MV': countryCode = 'MDV'; break;
			case 'ML': countryCode = 'MLI'; break; case 'MT': countryCode = 'MLT'; break; case 'MH': countryCode = 'MHL'; break;
			case 'MQ': countryCode = 'MTQ'; break; case 'MR': countryCode = 'MRT'; break; case 'MU': countryCode = 'MUS'; break;
			case 'YT': countryCode = 'MYT'; break; case 'MX': countryCode = 'MEX'; break; case 'FM': countryCode = 'FSM'; break;
			case 'MD': countryCode = 'MDA'; break; case 'MC': countryCode = 'MCO'; break; case 'MN': countryCode = 'MNG'; break;
			case 'ME': countryCode = 'MNE'; break; case 'MS': countryCode = 'MSR'; break; case 'MA': countryCode = 'MAR'; break;
			case 'MZ': countryCode = 'MOZ'; break; case 'MM': countryCode = 'MMR'; break; case 'NA': countryCode = 'NAM'; break;
			case 'NR': countryCode = 'NRU'; break; case 'NP': countryCode = 'NPL'; break; case 'NL': countryCode = 'NLD'; break;
			case 'AN': countryCode = 'ANT'; break; case 'NC': countryCode = 'NCL'; break; case 'NZ': countryCode = 'NZL'; break;
			case 'NI': countryCode = 'NIC'; break; case 'NE': countryCode = 'NER'; break; case 'NG': countryCode = 'NGA'; break;
			case 'NU': countryCode = 'NIU'; break; case 'NF': countryCode = 'NFK'; break; case 'MP': countryCode = 'MNP'; break;
			case 'NO': countryCode = 'NOR'; break; case 'OM': countryCode = 'OMN'; break; case 'PK': countryCode = 'PAK'; break;
			case 'PW': countryCode = 'PLW'; break; case 'PS': countryCode = 'PSE'; break; case 'PA': countryCode = 'PAN'; break;
			case 'PG': countryCode = 'PNG'; break; case 'PY': countryCode = 'PRY'; break; case 'PE': countryCode = 'PER'; break;
			case 'PH': countryCode = 'PHL'; break; case 'PN': countryCode = 'PCN'; break; case 'PL': countryCode = 'POL'; break;
			case 'PT': countryCode = 'PRT'; break; case 'PR': countryCode = 'PRI'; break; case 'QA': countryCode = 'QAT'; break;
			case 'RE': countryCode = 'REU'; break; case 'RO': countryCode = 'ROU'; break; case 'RU': countryCode = 'RUS'; break;
			case 'RW': countryCode = 'RWA'; break; case 'BL': countryCode = 'BLM'; break; case 'SH': countryCode = 'SHN'; break;
			case 'KN': countryCode = 'KNA'; break; case 'LC': countryCode = 'LCA'; break; case 'MF': countryCode = 'MAF'; break;
			case 'PM': countryCode = 'SPM'; break; case 'VC': countryCode = 'VCT'; break; case 'WS': countryCode = 'WSM'; break;
			case 'SM': countryCode = 'SMR'; break; case 'ST': countryCode = 'STP'; break; case 'SA': countryCode = 'SAU'; break;
			case 'SN': countryCode = 'SEN'; break; case 'RS': countryCode = 'SRB'; break; case 'SC': countryCode = 'SYC'; break;
			case 'SL': countryCode = 'SLE'; break; case 'SG': countryCode = 'SGP'; break; case 'SK': countryCode = 'SVK'; break;
			case 'SI': countryCode = 'SVN'; break; case 'SB': countryCode = 'SLB'; break; case 'SO': countryCode = 'SOM'; break;
			case 'ZA': countryCode = 'ZAF'; break; case 'GS': countryCode = 'SGS'; break; case 'SS': countryCode = 'SSD'; break;
			case 'ES': countryCode = 'ESP'; break; case 'LK': countryCode = 'LKA'; break; case 'SD': countryCode = 'SDN'; break;
			case 'SR': countryCode = 'SUR'; break; case 'SJ': countryCode = 'SJM'; break; case 'SZ': countryCode = 'SWZ'; break;
			case 'SE': countryCode = 'SWE'; break; case 'CH': countryCode = 'CHE'; break; case 'SY': countryCode = 'SYR'; break;
			case 'TW': countryCode = 'TWN'; break; case 'TJ': countryCode = 'TJK'; break; case 'TZ': countryCode = 'TZA'; break;
			case 'TH': countryCode = 'THA'; break; case 'TL': countryCode = 'TLS'; break; case 'TG': countryCode = 'TGO'; break;
			case 'TK': countryCode = 'TKL'; break; case 'TO': countryCode = 'TON'; break; case 'TT': countryCode = 'TTO'; break;
			case 'TN': countryCode = 'TUN'; break; case 'TR': countryCode = 'TUR'; break; case 'TM': countryCode = 'TKM'; break;
			case 'TC': countryCode = 'TCA'; break; case 'TV': countryCode = 'TUV'; break; case 'UG': countryCode = 'UGA'; break;
			case 'UA': countryCode = 'UKR'; break; case 'AE': countryCode = 'ARE'; break; case 'GB': countryCode = 'GBR'; break;
			case 'US': countryCode = 'USA'; break; case 'UM': countryCode = 'UMI'; break; case 'UY': countryCode = 'URY'; break;
			case 'UZ': countryCode = 'UZB'; break; case 'VU': countryCode = 'VUT'; break; case 'VE': countryCode = 'VEN'; break;
			case 'VN': countryCode = 'VNM'; break; case 'VI': countryCode = 'VIR'; break; case 'WF': countryCode = 'WLF'; break;
			case 'EH': countryCode = 'ESH'; break; case 'YE': countryCode = 'YEM'; break; case 'ZM': countryCode = 'ZMB'; break;
			case 'ZW': countryCode = 'ZWE'; break; case 'XK': countryCode = 'XKX'; break;
		}
		const proxyUrl = 'https://proxy.cors.sh/';
		const targetUrl = `https://api.ambeedata.com/disasters/latest/by-country-code?countryCode=${countryCode}&limit=10&page=1`;
		const response = await fetch(`${proxyUrl}${targetUrl}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'x-cors-api-key': 'temp_926ec718593f306b641bb1f09a4a203b',
				'x-api-key': '44a116d525bd4f6d1e8fb69870e74616e3006cb3e9cabfbf12b78e5c29db1a49'
			},
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();

		if (data.message === 'Data not available!' || !data.result || data.result.length === 0) {
			return `There are no currently reported alerts for your location (${countryCode})`;
		}

		const alerts = data.result;
		const alertDetails = alerts.map(alert => {
			let alertType = alert.event_type;
			switch (alertType) {
				case 'EQ': alertType = 'Earthquake'; break;
				case 'TC': alertType = 'Tropical Cyclone'; break;
				case 'WF': alertType = 'Wildfire'; break;
				case 'FL': alertType = 'Flood'; break;
				case 'ET': alertType = 'Extreme Temperature'; break;
				case 'DR': alertType = 'Drought'; break;
				case 'SW': alertType = 'Severe Weather'; break;
				case 'SI': alertType = 'Sea ice'; break;
				case 'VO': alertType = 'Volcano'; break;
				case 'LS': alertType = 'Landslide'; break;
				case 'TN': alertType = 'Tsunami'; break;
				case 'Misc': alertType = 'Miscellaneous'; break;
			}

			let alertLocation = alert.event_name;
			alertLocation = alertLocation.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

			let alertDate = alert.date;
			let alertLatitude = alert.lat;
			let alertLongitude = alert.lng;

			return `
				Location: ${alertLocation}<br>
				Alert Type: ${alertType}<br>
				Date: ${alertDate}<br>
				Latitude: ${alertLatitude}<br>
				Longitude: ${alertLongitude}<br>
				Map:<br>
				<iframe src="https://maps.google.com/maps?q=${alertLatitude},${alertLongitude}&hl=en;z=5&amp;output=embed" width="300" height="200" frameborder="0" style="border:0;" allowfullscreen="" loading="lazy" aria-hidden="false" tabindex="0"></iframe><br>
			`;
		}).join('<br>');

		return `Here are the currently reported alerts for your location (Showing only up to 10 results in your location - ${countryCode}):<br><br>${alertDetails}`;
	} catch (error) {
		console.error('Error in getDisasterAlerts:', error);
		throw error;
	}
}



// function to convert currencies
async function convertCurrency(amount, fromCurrency, toCurrency) {
	try {
		const proxyUrl = 'https://api.allorigins.win/get?url=';
		const targetUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${fromCurrency.toLowerCase()}.json`;
		const response = await fetch(`${proxyUrl}${encodeURIComponent(targetUrl)}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		});
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		const data = await response.json();
		const jsonData = JSON.parse(data.contents);
		const exchangeRate = jsonData[fromCurrency.toLowerCase()][toCurrency.toLowerCase()];
		if (!exchangeRate) {
			throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
		}
		let convertedAmount = (amount * exchangeRate).toFixed(2);
		// format the amount to have commas
		amount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		convertedAmount = convertedAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		return `${amount} ${fromCurrency} = ${convertedAmount} ${toCurrency}`;
	} catch (error) {
		console.error('Error in convertCurrency:', error);
		throw error;
	}
}



// Function to get and display system information
async function getSystemInfo() {
	const botResponse = document.getElementById('botResponse');
	try {
		console.log('Invoking get_system_info');
		const systemInfo = await invoke('get_system_info');
		console.log('System info received:', systemInfo);
		return systemInfo;
	} catch (error) {
		console.error('Error getting system information:', error);
		botResponse.textContent = 'Failed to get system information. Please try again later.';
	}
}



// function to find the bug code details
function findBugCodeDetails(bugCode) {
	bugCode = bugCode.toUpperCase();
	bugCode = "0x" + bugCode;
	const bugCodeDetails = bugcodesData.find(bugcode => bugcode.code === bugCode);
	if (bugCodeDetails) {
		console.log('Bug Code Details:\n\n' + 'Code: ' + bugCodeDetails.code + '\n\n' + 'Code Name: ' + bugCodeDetails.code_name + '\n\n' + 'Description: ' + bugCodeDetails.description + '\n\n' + 'Solutions: \n' + bugCodeDetails.solutions.map(solution => `- ${solution}`).join('\n'));
		return bugCodeDetails;
	} else {
		console.log('Bug Code not found:', bugCode);
		return null;
	}
}



// function to send email
async function sendEmail() {
	try {
		chatMessage.setAttribute('disabled', true);
		chatFormSubmitBtn.disabled = true;
		botResponse.innerHTML = "Enter the email details here:<br><br>";

		const emailForm = document.createElement('form');
		emailForm.id = 'emailForm';
		emailForm.innerHTML = `
			<label for="emailTo">To:</label><br>
			<input type="email" id="emailTo" name="emailTo" required><br>
			<label for="emailSubject">Subject:</label><br>
			<input type="text" id="emailSubject" name="emailSubject" required><br>
			<label for="emailBody">Body:</label><br>
			<input type="text" id="emailBody" name="emailBody" required><br><br>
			<input type="submit" value="Send Email">
			<button type="button" onclick="document.getElementById('emailForm').remove(); chatFormSubmitBtn.disabled = false; botResponse.textContent = ''; chatMessage.removeAttribute('disabled', false); chatMessage.focus();">Close Form</button><br><br>
		`;

		botResponse.appendChild(emailForm);

		document.getElementById('emailTo').focus();

		emailForm.addEventListener('submit', async (event) => {
			event.preventDefault();

			const emailTo = emailForm.emailTo.value;
			const emailSubject = emailForm.emailSubject.value;
			const emailBody = emailForm.emailBody.value;

			const mailtolink = `mailto:${emailTo}?subject=${emailSubject}&body=${emailBody}`;

			try {
				await window.__TAURI__.invoke('open_url', { url: mailtolink });
				botResponse.textContent = "Opened email client. Please click send to send the email.";
				alert('Opened email client. Please click send to send the email.');
				chatFormSubmitBtn.disabled = false;
				chatMessage.disabled = false;
			} catch (error) {
				console.error('Failed to send email:', error);
				botResponse.textContent = "Failed to send email. Please try again later.";
				alert('Failed to send email. Please try again later.');
				chatFormSubmitBtn.disabled = false;
				chatMessage.disabled = false;
			}
		});
	} catch (error) {
		console.error('Error in sendEmail:', error);
		botResponse.textContent = "Failed to send email. Please try again later.";
		alert('Failed to send email. Please try again later.');
		chatFormSubmitBtn.disabled = false;
		userMessage.disabled = false;

		throw error;
	}
}



// function to search files
async function searchFile(searchTerms) {
	try {
		const searchDisplay = `"${searchTerms}"`;

		botResponse.textContent = `Searching for files matching ${searchDisplay} across all drives... This may take a while.`;

		let startTime = new Date().getTime();

		new Notification('File Search in Progress', {
			body: `Searching for files matching ${searchDisplay} across all drives... This may take a while. Do not close the app.`,
			icon: 'assets/images/icon.png'
		});

		const results = await window.__TAURI__.invoke('search_file', {
			searchTerms: searchTerms
		});

		let endTime = new Date().getTime();
		let searchTime = (endTime - startTime) / 1000;
		searchTime = searchTime.toFixed(0);

		if (searchTime > 60) {
			let minutes = Math.floor(searchTime / 60);
			let seconds = searchTime % 60;
			searchTime = `${minutes} minutes and ${seconds} seconds`;
		} else {
			searchTime = `${searchTime} seconds`;
		}

		if (results.length > 0) {
			console.log('File(s) found:', results);

			const formattedResults = results.map(result => {
				const folderPath = result.path.substring(0, result.path.lastIndexOf('\\')).replace(/\\/g, '\\\\');
				return `- ${result.path} <button onclick="window.__TAURI__.invoke('open_folder', { filePath: '${folderPath}' })">Open Folder</button>`;
			}).join('<br>');

			botResponse.innerHTML = `Found ${results.length} file(s) matching ${searchDisplay}:<br><br>${formattedResults}<br><br>Search took ${searchTime}.`;

			new Notification('File Search Finished', {
				body: `Found ${results.length} file(s) matching ${searchDisplay}. Search took ${searchTime}.`,
				icon: 'assets/images/icon.png'
			});
		} else {
			console.log('No matching files found');
			botResponse.textContent = `No files found matching ${searchDisplay}`;

			new Notification('File Search Finished', {
				body: `No files found matching ${searchDisplay}.`,
				icon: 'assets/images/icon.png'
			});
		}
	} catch (error) {
		console.error('Error searching for files:', error);
		botResponse.textContent = `Error: ${error}`;
	}
}



// function to switch to light mode
async function switchToLight() {
	try {
		await invoke('set_light_mode');
		console.log('Switched to light mode');
	} catch (error) {
		console.error('Failed to switch to light mode:', error);
	}
}

// function to switch to dark mode
async function switchToDark() {
	try {
		await invoke('set_dark_mode');
		console.log('Switched to dark mode');
	} catch (error) {
		console.error('Failed to switch to dark mode:', error);
	}
}



// function to take a screenshot
async function takeScreenshot() {
	try {
		const screenshot = await invoke('take_screenshot');
		console.log('Screenshot taken:', screenshot);
		return screenshot;
	} catch (error) {
		console.error('Failed to take screenshot:', error);
	}
}



// function to change wallpaper
async function changeWallpaper(category) {
	try {
		const response = await fetch(`https://api.unsplash.com/photos/random?query=${category}&count=1&orientation=landscape&client_id=aXEHFMJhuEQoof-Sm66CGSaq41BYMrH_LwBTL1XRiwY`);
		const data = await response.json();
		const wallpaper = data[0].urls.raw + '&dpr=2';
		const imagePath = wallpaper;

		new Notification('Downloading Wallpaper', {
			body: 'Please wait while the wallpaper is downloaded and set as your desktop background...',
			icon: 'assets/images/icon.png'
		});

		await invoke('change_wallpaper', { imagePath: imagePath });
		console.log('Wallpaper changed', wallpaper);

		new Notification('Wallpaper Changed', {
			body: 'Wallpaper changed successfully. Enjoy your new wallpaper ;)',
			icon: 'assets/images/icon.png'
		});
	} catch (error) {
		console.error('Failed to change wallpaper:', error);

		new Notification('Failed to Change Wallpaper', {
			body: 'Failed to change wallpaper. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}



// function to shutdown the system
async function shutdown_pc() {
	try {
		await invoke('shutdown_pc');

		new Notification('System Shutdown Initiated', {
			body: 'Your system will be shutting down in 10 seconds...',
			icon: 'assets/images/icon.png'
		});

		console.log('System shutdown initiated');
	} catch (error) {
		console.error('Failed to shutdown system:', error);

		new Notification('Failed to Shutdown System', {
			body: 'Failed to shutdown system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}

// function to restart the system
async function restart_pc() {
	try {
		await invoke('restart_pc');

		new Notification('System Restart Initiated', {
			body: 'Your system will be restarting in 10 seconds...',
			icon: 'assets/images/icon.png'
		});

		console.log('System restart initiated');
	} catch (error) {
		console.error('Failed to restart system:', error);

		new Notification('Failed to Restart System', {
			body: 'Failed to restart system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}

// function to log off the system
async function lock_pc() {
	try {
		await invoke('lock_pc');

		new Notification('System Lock Initiated', {
			body: 'Your system is locked!',
			icon: 'assets/images/icon.png'
		});

		console.log('System lock initiated');
	}
	catch (error) {
		console.error('Failed to lock system:', error);

		new Notification('Failed to Lock System', {
			body: 'Failed to lock system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}

// function to sleep the system
async function sleep_pc() {
	try {
		await invoke('sleep_pc');

		new Notification('System Sleep Initiated', {
			body: 'Your system will be going to sleep in moments...',
			icon: 'assets/images/icon.png'
		});

		console.log('System sleep initiated');
	} catch (error) {
		console.error('Failed to sleep system:', error);

		new Notification('Failed to Sleep System', {
			body: 'Failed to sleep system. Please try again later.',
			icon: 'assets/images/icon.png'
		});
	}
}