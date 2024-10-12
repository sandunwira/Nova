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
		getIPAddress().then(ipaddress => botResponse.textContent = "Your IP Address is: " + ipaddress).catch(error => botResponse.textContent = "Sorry, I couldn't fetch your IP Address.");
	} else if (userMessage.toLowerCase().includes("weather")) {
		botResponse.textContent = "Fetching the weather...";
		getWeather().then(weatherDetails => botResponse.textContent = weatherDetails).catch(error => botResponse.textContent = "Sorry, I couldn't fetch the weather data.");
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
	} else if (userMessage.toLowerCase().startsWith("create qr for")) {
		const text = userMessage.replace("create qr for", "").trim();
		const qrCodeElement = createQRCode(text);
		botResponse.innerHTML = `Here's the QR Code for "${text}":<br><br>`;
		botResponse.appendChild(qrCodeElement);
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
		const response = await fetch('https://api.allorigins.win/get?url=https://abcnews.go.com/abcnews/internationalheadlines');
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