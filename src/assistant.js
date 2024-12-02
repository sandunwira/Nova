class Assistant {
	constructor() {
		this.requestsData = [];
		this.responsesData = [];
		this.conversationHistory = [];
		this.lastMatchedIntent = null;
		this.lastMatchedResponse = null;

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

		// New method to extract keywords from a query
		extractKeywords(query) {
			// Remove punctuation and convert to lowercase
			const cleanQuery = query.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').toLowerCase();

			// Split into words and remove common stop words
			const stopWords = new Set([
				'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
				'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
				'to', 'was', 'were', 'will', 'with'
			]);

			return cleanQuery.split(/\s+/)
				.filter(word => word.length > 1 && !stopWords.has(word));
		},

		// Enhanced keyword matching with more sophisticated scoring
		calculateIntentScore(query, requestExamples) {
			// Remove punctuation and extra whitespace
			const cleanQuery = query.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();

			// Exact match check
			const exactMatches = requestExamples.filter(example =>
				example.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim() === cleanQuery
			);
			if (exactMatches.length > 0) return 1.0;

			// Partial match and word-based scoring
			const queryWords = cleanQuery.split(/\s+/);
			const scores = requestExamples.map(example => {
				const cleanExample = example.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();
				const exampleWords = cleanExample.split(/\s+/);

				// Calculate word overlap
				const matchedWords = queryWords.filter(qw =>
					exampleWords.some(ew => ew === qw || ew.includes(qw) || qw.includes(ew))
				);

				// Calculate scores based on word overlap and length
				const wordOverlapScore = matchedWords.length / Math.max(queryWords.length, exampleWords.length);

				// Levenshtein distance as a fallback
				const distanceScore = 1 - (this.levenshtein(cleanQuery, cleanExample) / Math.max(cleanQuery.length, cleanExample.length));

				// Combine scores with more weight to word overlap
				const combinedScore = (wordOverlapScore * 0.7) + (distanceScore * 0.3);
				return combinedScore;
			});

			// Return the highest score
			return Math.max(...scores);
		},

		levenshtein(a, b) {
			// Initialize matrix
			const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);

			// Fill the first row of the matrix
			for (let j = 0; j <= a.length; j++) {
				matrix[0][j] = j;
			}

			// Populate the rest of the matrix
			for (let i = 1; i <= b.length; i++) {
				for (let j = 1; j <= a.length; j++) {
					if (b[i - 1] === a[j - 1]) {
						matrix[i][j] = matrix[i - 1][j - 1];
					} else {
						matrix[i][j] = Math.min(
							matrix[i - 1][j] + 1, // Deletion
							matrix[i][j - 1] + 1, // Insertion
							matrix[i - 1][j - 1] + 1 // Substitution
						);
					}
				}
			}

			// Return the Levenshtein distance
			return matrix[b.length][a.length];
		},

		getTimestamp() {
			return new Date().toISOString();
		},

		// Check if query is a repeat request
		isRepeatRequest(query) {
			const repeatKeywords = ['repeat', 'again', 'another', 'once more', 'one more', 'more'];
			const cleanQuery = query.toLowerCase().trim();
			return repeatKeywords.some(keyword => cleanQuery.includes(keyword));
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
		// Check for repeat request first
		if (Assistant.Utility.isRepeatRequest(requestKeyword) && this.lastMatchedIntent) {
			console.log(`Repeating last matched intent: ${this.lastMatchedIntent}`);
			return this.getResponseForIntent(this.lastMatchedIntent);
		}

		let bestMatch = null;
		let highestScore = 0;

		// Iterate through all requests to find the best intent match
		for (const request of this.requestsData) {
			// Calculate intent score for this request
			const intentScore = Assistant.Utility.calculateIntentScore(
				requestKeyword,
				request.requests
			);

			// Update best match if this intent has a higher score
			if (intentScore > highestScore) {
				highestScore = intentScore;
				bestMatch = request;
			}
		}

		// Log matching details
		console.log(`Matched Intent: ${bestMatch?.intent || 'None'}, Score: ${highestScore}`);

		// Set last matched intent and response
		this.lastMatchedIntent = bestMatch?.intent;

		// Return response or default message
		if (bestMatch && highestScore > 0.5) {
			const response = this.getResponseForIntent(bestMatch.intent);
			this.lastMatchedResponse = response;
			return response;
		}

		return "Sorry, I couldn't understand the request.";
	}

	getResponseForIntent(intent) {
		// Find and return a random response for the matched intent
		const matchedResponses = this.responsesData.find(response => response.intent === intent);

		if (matchedResponses && matchedResponses.responses && matchedResponses.responses.length > 0) {
			return matchedResponses.responses[Math.floor(Math.random() * matchedResponses.responses.length)];
		}

		return "Sorry, I couldn't find a response for this intent.";
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

	async getIntent(query) {
		if (!query || typeof query !== 'string') {
			return {
				intent: null,
				confidence: 0,
				error: 'Invalid query'
			};
		}

		try {
			// Check for repeat request first
			if (Assistant.Utility.isRepeatRequest(query) && this.lastMatchedIntent) {
				return {
					intent: this.lastMatchedIntent,
					confidence: 1.0,
					isRepeat: true
				};
			}

			let bestMatch = null;
			let highestScore = 0;

			// Iterate through all requests to find the best intent match
			for (const request of this.requestsData) {
				const intentScore = Assistant.Utility.calculateIntentScore(
					query,
					request.requests
				);

				// Update best match if this intent has a higher score
				if (intentScore > highestScore) {
					highestScore = intentScore;
					bestMatch = request;
				}
			}

			// Only return intent if confidence is high enough
			if (bestMatch && highestScore > 0.5) {
				this.lastMatchedIntent = bestMatch.intent;
				return {
					intent: bestMatch.intent,
					confidence: highestScore
				};
			}

			return {
				intent: null,
				confidence: highestScore
			};
		} catch (error) {
			console.error('Error getting intent:', error);
			return {
				intent: null,
				confidence: 0,
				error: error.message
			};
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
			// this.saveConversation(query, response);

			// console.log(this.getConversationHistory());

			console.log("Response:", response);
			return response;
		} catch (error) {
			console.error('Error processing query:', error);
			return "Sorry, an error occurred while processing your request.";
		}
	}
}