var Summarizer = {
	config: {
		maxIter: 100,
		dampingFactor: 0.85,
		delta: 0.5
	},

	Utility: {
		getSentences: function (text) {
			var sentences = text.split(/\. |\.|\?|!|\n/g);
			sentences = sentences.map(function (sentence) {
				console.log(sentence);
				return sentence.trim();
			});
			sentences = sentences.filter(function (sentence) {
				console.log(sentence);
				return sentence.length > 0;
			});
			console.log(sentences);
			return sentences;
		},

		calculateSimilarity: function (sentence1, sentence2) {
			var words1 = sentence1.split(" ");
			var words2 = sentence2.split(" ");
			var intersection = words1.filter(function (word) {
				return words2.includes(word);
			});
			var sumOfLengths = Math.log(words1.length) + Math.log(words2.length);
			if (sumOfLengths == 0) {
				return 0;
			} else {
				return intersection.length / sumOfLengths;
			}
		},

		makeGraph: function (sentences) {
			var graph = [];
			var sentenceIdLookup = {};
			for (var i = 0; i < sentences.length; i++) {
				graph[i] = [];
				sentenceIdLookup[i] = sentences[i];
			}
			for (var i = 0; i < sentences.length; i++) {
				for (var j = 0; j < sentences.length; j++) {
					if (i !== j) {
						var similarity = Summarizer.Utility.calculateSimilarity(sentences[i], sentences[j]);
						if (similarity > 0) {
							graph[i].push({ index: j, weight: similarity });
						}
					}
				}
			}
			graph.sentenceIdLookup = sentenceIdLookup;
			return graph;
		},

		runPageRankOnce: function (graph, pageRankStruct, totalWeight, totalNumNodes, dampingFactor) {
			var sinkContrib = 0.0;
			for (var idx = 0; idx < totalNumNodes; ++idx) {
				if (graph[idx].length === 0) {
					sinkContrib += pageRankStruct[idx]["oldPR"];
				}
			}
			for (var idx = 0; idx < totalNumNodes; ++idx) {
				var wt = 0.0;
				graph[idx].forEach(function (item) {
					wt += (pageRankStruct[item.index]["oldPR"] / totalWeight[item.index]) * item.weight;
				});
				pageRankStruct[idx]["newPR"] = (1 - dampingFactor) / totalNumNodes + dampingFactor * wt;
			}
			sinkContrib /= totalNumNodes;
			var max_pr_change = 0.0;
			for (var idx = 0; idx < totalNumNodes; ++idx) {
				pageRankStruct[idx]["newPR"] += sinkContrib;
				var change = Math.abs(pageRankStruct[idx]["newPR"] - pageRankStruct[idx]["oldPR"]);
				if (change > max_pr_change) {
					max_pr_change = change;
				}
				pageRankStruct[idx]["oldPR"] = pageRankStruct[idx]["newPR"];
				pageRankStruct[idx]["newPR"] = 0.0;
			}
			return max_pr_change;
		},

		pageRank: function (graph, maxIterations, dampingFactor, delta) {
			var totalNumNodes = graph.length;
			var pageRankStruct = [];
			var totalWeight = [];

			for (var idx = 0; idx < totalNumNodes; ++idx) {
				pageRankStruct[idx] = { "oldPR": 1.0 / totalNumNodes, "newPR": 0.0 };
				totalWeight[idx] = 0.0;
			}

			for (var idx = 0; idx < totalNumNodes; ++idx) {
				var adjacencyList = graph[idx];
				if (adjacencyList == undefined) {
					continue;
				}
				adjacencyList.forEach(function (item) {
					totalWeight[idx] += item["weight"];
				});
			}

			var converged = false;
			for (var iter = 0; iter < maxIterations; ++iter) {
				var maxPRChange = Summarizer.Utility.runPageRankOnce(graph, pageRankStruct, totalWeight, totalNumNodes, dampingFactor);
				if (maxPRChange <= (delta / totalNumNodes)) {
					converged = true;
					break;
				}
			}

			var pageRankResults = {};
			for (var idx = 0; idx < totalNumNodes; ++idx) {
				pageRankResults[idx] = {
					"PR": pageRankStruct[idx]["oldPR"] / totalNumNodes,
					"sentence": graph.sentenceIdLookup[idx]
				};
			}
			return pageRankResults;
		}
	},

	summarize: function (inputText) {
		var sentences = Summarizer.Utility.getSentences(inputText);
		var graph = Summarizer.Utility.makeGraph(sentences);
		var pageRankResults = Summarizer.Utility.pageRank(graph, Summarizer.config.maxIter, Summarizer.config.dampingFactor, Summarizer.config.delta);

		var rankedSentences = Object.values(pageRankResults).sort(function (a, b) {
			return b.PR - a.PR;
		});

		// Shuffle the ranked sentences to add variation
		for (let i = rankedSentences.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[rankedSentences[i], rankedSentences[j]] = [rankedSentences[j], rankedSentences[i]];
		}

		var halfNumLines = Math.floor(rankedSentences.length / 2);
		if (halfNumLines === 0) {
			halfNumLines = rankedSentences.length;
		}

		rankedSentences = rankedSentences.splice(0, halfNumLines);
		rankedSentences = rankedSentences.sort(function (a, b) {
			return a.idx - b.idx;
		});

		var finalResult = "";
		for (var idx = 0; idx < halfNumLines; ++idx) {
			if (typeof rankedSentences[idx].sentence === 'string') {
				finalResult += rankedSentences[idx].sentence + ". ";
			}
		}
		console.log(finalResult.trim());

		return finalResult.trim();
	}
};