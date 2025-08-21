class ElizaVisualizer {
    constructor() {
        this.processBtn = document.getElementById('process-btn');
        this.userInput = document.getElementById('user-input');
        this.steps = document.querySelectorAll('.step');
        
        // Load the JSON data from the original files
        this.generalData = null;
        this.doctorData = null;
        this.isLoaded = false;
        
        this.loadData().then(() => {
            this.isLoaded = true;
            this.processBtn.disabled = false;
            this.processBtn.textContent = 'Process Message';
        });
        
        this.processBtn.addEventListener('click', () => this.processMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.processMessage();
        });
        
        // Disable button until data is loaded
        this.processBtn.disabled = true;
        this.processBtn.textContent = 'Loading...';
    }

    async loadData() {
        try {
            console.log('Starting to load data...');
            // Load general.json and doctor.json from the parent scripts directory
            const [generalResponse, doctorResponse] = await Promise.all([
                fetch('../scripts/general.json'),
                fetch('../scripts/doctor.json')
            ]);
            
            console.log('Fetch responses:', generalResponse.status, doctorResponse.status);
            
            this.generalData = await generalResponse.json();
            this.doctorData = await doctorResponse.json();
            
            console.log('Loaded general data:', this.generalData);
            console.log('Loaded doctor data length:', this.doctorData.length);
            
            // Process decomposition rules from Weizenbaum notation to regex (like Python does)
            this.processDecompRules();
            
            console.log('Loaded data:', {
                substitutions: Object.keys(this.generalData.substitutions).length,
                doctorRules: this.doctorData.length
            });
        } catch (error) {
            console.error('Error loading data:', error);
            this.processBtn.textContent = 'Error Loading Data';
        }
    }

    processDecompRules() {
        // Convert all decomposition rules from Weizenbaum notation to regex (matching Python logic)
        this.doctorData.forEach(keyword => {
            keyword.rules.forEach(rule => {
                // Store the original decomposition pattern before converting
                rule.original_decomp = rule.decomp;
                // Convert to regex for matching
                rule.decomp = this.decompToRegex(rule.decomp);
            });
        });
    }

    decompToRegex(decompRule) {
        // Convert from Weizenbaum notation like "(0 @AM 0 LIKE 0)" to regex
        // Strip parentheses and split
        let components = decompRule.replace(/[()]/g, '').split(/\s+/);
        let regexStr = '';

        components.forEach(comp => {
            let regexComp = this.regexify(comp);
            // Add parentheses for proper component capture
            regexStr += '(' + regexComp + ')\\s*';
        });

        return regexStr;
    }

    regexify(component) {
        // Convert single component to regex (matching Python logic)
        if (component === '0') {
            return '.*';
        } else if (component.match(/^\d+$/) && parseInt(component) > 0) {
            return `(?:\\b\\w+\\b[\\s\\r\\n]*){${component}}`;
        } else if (component.startsWith('@')) {
            let tagName = component.substring(1).toLowerCase();
            return this.tagToRegex(tagName);
        } else {
            return '\\b' + component + '\\b';
        }
    }

    tagToRegex(tagName) {
        // Convert tag to regex using actual tags from general.json
        if (this.generalData.tags && this.generalData.tags[tagName]) {
            return '\\b(' + this.generalData.tags[tagName].join('|') + ')\\b';
        }
        return '';
    }

    processMessage() {
        const input = this.userInput.value.trim();
        if (!input || !this.isLoaded) return;

        // Reset visualization
        this.resetVisualization();

        // Process the message step by step
        setTimeout(() => this.step1WordSubstitution(input), 300);
    }

    resetVisualization() {
        this.steps.forEach(step => {
            step.classList.remove('active');
            step.style.display = 'none';
        });
    }

    showStep(stepNumber) {
        const step = document.getElementById(`step${stepNumber}`);
        step.style.display = 'block';
        setTimeout(() => step.classList.add('active'), 100);
    }

    step1WordSubstitution(originalInput) {
        this.showStep(1);
        
        const originalText = document.getElementById('original-text');
        const substitutedText = document.getElementById('substituted-text');
        const substitutionsApplied = document.getElementById('substitutions-applied');

        originalText.textContent = originalInput;

        // Debug: Check if data is loaded
        console.log('General data loaded:', !!this.generalData);
        console.log('Substitutions available:', this.generalData ? Object.keys(this.generalData.substitutions).length : 0);
        console.log('Input words:', originalInput.split(' '));

        // Apply word substitutions exactly like Python does
        let substitutedInput = '';
        const appliedSubs = [];

        for (let word of originalInput.split(' ')) {
            console.log(`Checking word: "${word.toLowerCase()}"`, this.generalData.substitutions[word.toLowerCase()]);
            if (this.generalData.substitutions[word.toLowerCase()]) {
                appliedSubs.push(`"${word.toLowerCase()}" → "${this.generalData.substitutions[word.toLowerCase()]}"`);
                substitutedInput += this.generalData.substitutions[word.toLowerCase()] + ' ';
            } else {
                substitutedInput += word + ' ';
            }
        }
        
        // Remove trailing space
        substitutedInput = substitutedInput.slice(0, -1);
        substitutedText.textContent = substitutedInput;

        // Show applied substitutions
        if (appliedSubs.length > 0) {
            substitutionsApplied.innerHTML = `
                <h4>Substitutions Applied:</h4>
                ${appliedSubs.map(sub => `<span class="substitution-item">${sub}</span>`).join('')}
            `;
        } else {
            substitutionsApplied.innerHTML = '<h4>No substitutions needed</h4>';
        }

        setTimeout(() => this.step2KeywordRanking(substitutedInput), 1500);
    }

    step2KeywordRanking(substitutedInput) {
        this.showStep(2);
        
        const keywordsFound = document.getElementById('keywords-found');
        const selectedSentence = document.getElementById('selected-sentence');

        // Apply the exact ranking logic from Python's rank.py
        // Remove punctuation and get keywords
        let cleanInput = substitutedInput.replace(/[#$%&()*+,-./:;<=>?@[\]^_{|}~]/g, '');
        const words = cleanInput.toLowerCase().split(/\s+/);
        
        // Get ranks for all words (matching Python's get_ranks function)
        const ranks = [];
        const foundKeywords = [];
        
        words.forEach(word => {
            let rank = 0; // Default rank for words not in script
            
            // Find rank in doctor data
            for (let rule of this.doctorData) {
                if (rule.keyword === word) {
                    rank = rule.rank;
                    foundKeywords.push({ keyword: word, rank: rank });
                    break;
                }
            }
            ranks.push(rank);
        });

        // Get maximum rank (matching Python's max(ranks) logic)
        const maxRank = Math.max(...ranks);
        const maxIndex = ranks.indexOf(maxRank);
        const selectedKeyword = words[maxIndex];

        // Sort keywords by rank for display
        foundKeywords.sort((a, b) => b.rank - a.rank);

        // Display found keywords
        if (foundKeywords.length > 0) {
            keywordsFound.innerHTML = `
                <h4>Keywords Found (ranked by importance):</h4>
                ${foundKeywords.map((kw) => `
                    <div class="keyword-item ${kw.keyword === selectedKeyword ? 'highest-rank' : ''}">
                        <span class="keyword-name">${kw.keyword}</span>
                        <span class="keyword-rank">Rank: ${kw.rank}</span>
                    </div>
                `).join('')}
            `;

            selectedSentence.innerHTML = `
                <strong>Selected for processing:</strong> Keyword "${selectedKeyword}" (rank ${maxRank})
                <br><em>Sentence: "${substitutedInput}"</em>
            `;

            setTimeout(() => this.step3PatternMatching(substitutedInput, selectedKeyword), 1500);
        } else {
            keywordsFound.innerHTML = '<h4>No keywords found - would use generic response</h4>';
            setTimeout(() => this.step4ResponseGeneration(null, null, substitutedInput), 1500);
        }
    }

    step3PatternMatching(input, keyword) {
        this.showStep(3);
        
        const patternAttempts = document.getElementById('pattern-attempts');
        const patternMatch = document.getElementById('pattern-match');

        // Find the rules for this keyword
        const keywordRule = this.doctorData.find(rule => rule.keyword === keyword);
        
        if (!keywordRule) {
            patternAttempts.innerHTML = '<h4>No rules found for this keyword</h4>';
            return;
        }

        // Display the original pattern structure from JSON
        const originalPatternJson = {
            keyword: keywordRule.keyword,
            rank: keywordRule.rank,
            rules: keywordRule.rules.map(rule => ({
                decomp: rule.original_decomp || rule.decomp, // Use original if available
                reassembly: rule.reassembly
            }))
        };

        // Get the original decomp patterns (before regex conversion)
        const originalRules = keywordRule.rules.map(rule => {
            // We need to reconstruct the original Weizenbaum notation
            // since we converted it to regex. Let's get it from the original data
            return rule.original_decomp || rule.decomp;
        });

        let matchFound = null;
        let attempts = [];

        // Try each decomposition rule (which are now converted to regex)
        for (let i = 0; i < keywordRule.rules.length; i++) {
            const rule = keywordRule.rules[i];
            const regex = new RegExp('^\\s*' + rule.decomp + '\\s*$', 'i');
            const match = input.match(regex);
            
            attempts.push({
                pattern: rule.decomp,
                originalPattern: rule.original_decomp || rule.decomp,
                success: !!match,
                match: match,
                rule: rule
            });

            if (match && !matchFound) {
                matchFound = {
                    rule: rule,
                    match: match,
                    groups: match.slice(1), // Remove the full match, keep only groups
                    originalPattern: rule.original_decomp || rule.decomp
                };
            }
        }

        // Display the original keyword structure
        patternAttempts.innerHTML = `
            <div class="original-pattern-box">
                <h4>📋 Original Keyword Definition:</h4>
                <pre class="json-display">{
    "keyword": "${keywordRule.keyword}",
    "rank": ${keywordRule.rank},
    "rules": [
        {
            "decomp": "${keywordRule.rules[0].original_decomp || '(0 @AM 0 LIKE 0)'}",
            "reassembly": [
                "${keywordRule.rules[0].reassembly.slice(0, 2).join('",\n                "')}",
                ${keywordRule.rules[0].reassembly.length > 2 ? '// ... more responses' : ''}
            ]
        }${keywordRule.rules.length > 1 ? ',\n        // ... more rules' : ''}
    ]
}</pre>
            </div>
            <h4>🔄 Pattern Matching Attempts:</h4>
            ${attempts.map((attempt, index) => `
                <div class="pattern-attempt ${attempt.success ? 'success' : 'failed'}">
                    <div class="pattern-info">
                        <div class="original-pattern"><strong>Original Pattern:</strong> ${attempt.originalPattern}</div>
                        <div class="regex-pattern"><strong>Converted Regex:</strong> ${attempt.pattern}</div>
                    </div>
                    <div class="pattern-result">
                        ${attempt.success ? '✅ Match found!' : '❌ No match'}
                    </div>
                </div>
            `).join('')}
        `;

        if (matchFound) {
            patternMatch.innerHTML = `
                <h4>✅ Successful Pattern Match:</h4>
                <div><strong>Original Weizenbaum Pattern:</strong> ${matchFound.originalPattern}</div>
                <div><strong>Converted Regex Pattern:</strong> ${matchFound.rule.decomp}</div>
                <div class="match-details">
                    <strong>Captured Groups:</strong><br>
                    ${matchFound.groups.map((group, index) => 
                        `<span class="captured-group">Group ${index + 1}: "${group}"</span>`
                    ).join('')}
                </div>
            `;

            setTimeout(() => this.step4ResponseGeneration(matchFound.rule, matchFound.groups, input), 1500);
        } else {
            patternMatch.innerHTML = '<h4>❌ No pattern matched - would use generic response</h4>';
            setTimeout(() => this.step4ResponseGeneration(null, null, input), 1500);
        }
    }

    step4ResponseGeneration(rule, groups, input) {
        this.showStep(4);
        
        const responseConstruction = document.getElementById('response-construction');
        const finalResponse = document.getElementById('final-response');

        if (rule && groups) {
            // Select reassembly rule using the exact Python logic
            const reassemblyRule = rule.reassembly[rule.last_used_reassembly_rule || 0];
            
            // Show how the response is constructed (matching Python reassemble function)
            let constructedResponse = 'Eliza: ';
            let constructionSteps = [`<strong>Original reassembly rule:</strong><br>"${reassemblyRule}"`];

            // Split reassembly rule and process each component
            const components = reassemblyRule.split(' ');
            let responseWords = [];
            
            components.forEach(comp => {
                if (comp.match(/^\d+$/)) {
                    // Numeric component - replace with captured group (1-indexed like Python)
                    const groupIndex = parseInt(comp) - 1;
                    if (groupIndex >= 0 && groupIndex < groups.length) {
                        responseWords.push(groups[groupIndex]);
                    }
                } else {
                    // Regular word
                    responseWords.push(comp);
                }
            });
            
            constructedResponse += responseWords.join(' ');

            responseConstruction.innerHTML = `
                <h4>Response Construction (Python logic):</h4>
                <div class="reassembly-rule"><strong>Reassembly rule:</strong> "${reassemblyRule}"</div>
                <div class="reassembly-rule"><strong>Groups:</strong> ${groups.map((g, i) => `${i+1}="${g}"`).join(', ')}</div>
                <div class="reassembly-rule"><strong>Final:</strong> "${constructedResponse}"</div>
            `;

            finalResponse.innerHTML = `
                <div class="response-label">Eliza's Response:</div>
                <div>"${constructedResponse}"</div>
            `;
        } else {
            // Generic response
            const genericResponses = [
                "Please go on.",
                "I am not sure I understand you fully.",
                "What does that suggest to you?",
                "That is interesting. Please continue."
            ];
            const response = "Eliza: " + genericResponses[0];

            responseConstruction.innerHTML = `
                <h4>Generic Response Selected:</h4>
                <div class="reassembly-rule">No pattern matched, using generic response</div>
            `;

            finalResponse.innerHTML = `
                <div class="response-label">Eliza's Response:</div>
                <div>"${response}"</div>
            `;
        }
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ElizaVisualizer();
});
