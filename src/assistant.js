class Assistant {
	constructor() {
		this.requestsData = [];
		this.responsesData = [];
		this.conversationHistory = [];

		// Dynamic Variables
		this.customData = {
			name: "Adam",
			feedback_url: "https://forms.gle/77MP5rjGaXWLjhmcA",
		};
	}

	// Static utility methods
	static Utility = {
		async fetchData(url) {
			const response = await fetch(url);
			return response.json();
		},

		levenshtein(a, b) {
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
		},

		getTimestamp() {
			return new Date().toISOString();
		}
	};

	async initialize() {
		try {
			this.requestsData = await Assistant.Utility.fetchData('data/requests.json');
			this.responsesData = await Assistant.Utility.fetchData('data/responses.json');

			if (typeof localStorage !== 'undefined') {
				const savedHistory = localStorage.getItem('conversationHistory');
				if (savedHistory) {
					this.conversationHistory = JSON.parse(savedHistory);
				}
			}
		} catch (error) {
			console.error('Error initializing Assistant:', error);
			throw error;
		}
	}

	// Add the replaceDynamicVariables method
	replaceDynamicVariables(response) {
		return response.replace(/\[([^\]]+)\]/g, (match, variable) => {
			return this.customData[variable] || match;
		});
	}

	findResponse(requestKeyword) {
		let intent = null;
		let minDistance = Infinity;
		let closestRequest = null;

		for (const request of this.requestsData) {
			for (const req of request.requests) {
				const distance = Assistant.Utility.levenshtein(req.toLowerCase(), requestKeyword.toLowerCase());
				if (distance < minDistance) {
					minDistance = distance;
					closestRequest = req;
					intent = request.intent;
				}
			}
		}

		console.log(`Matched Intent: ${intent}`);
		this.lastMatchedIntent = intent;

		if (intent) {
			for (const response of this.responsesData) {
				if (response.intent === intent) {
					return response.responses[Math.floor(Math.random() * response.responses.length)];
				}
			}
		}
		return "Sorry, I couldn't understand the request.";
	}

	// Add methods for conversation history management
	saveConversation(query, response) {
		const conversation = {
			timestamp: Assistant.Utility.getTimestamp(),
			query,
			response,
			intent: this.lastMatchedIntent || 'unknown'
		};

		this.conversationHistory.push(conversation);

		// Save to localStorage if available
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('conversationHistory', JSON.stringify(this.conversationHistory));
		}
	}

	getConversationHistory() {
		return this.conversationHistory;
	}

	clearConversationHistory() {
		this.conversationHistory = [];
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('conversationHistory');
		}
	}

	async processQuery(query) {
		try {
			console.log("Query:", query);
			let response;
			response = this.findResponse(query);
			// Replace dynamic variables in all responses
			response = this.replaceDynamicVariables(response);

			// Save the conversation
			this.saveConversation(query, response);

			console.log(this.getConversationHistory());

			console.log("Response:", response);
			return response;
		} catch (error) {
			console.error('Error processing query:', error);
			return "Sorry, an error occurred while processing your request.";
		}
	}
}