# Eliza Pattern Matching Visualizer

This demo app shows exactly what happens when you input a phrase into the original Eliza chatbot from 1964-1966. You can see the step-by-step process of how Eliza transforms your input into a response.

## Features

- **Word Substitution**: See how words like "my" become "your" and "I" becomes "you"
- **Keyword Ranking**: Watch how Eliza identifies and ranks keywords by importance
- **Pattern Matching**: Observe the regex pattern matching using Weizenbaum notation
- **Response Generation**: See how the final response is constructed from captured groups

## Try These Example Inputs

1. **"My mother is always criticizing me"** - Shows family keyword matching
2. **"I feel sad all the time"** - Demonstrates emotion pattern matching  
3. **"You don't understand me"** - Shows pronoun and belief patterns
4. **"I remember my father"** - Memory-related keyword processing
5. **"Everyone seems to hate me"** - Universal quantifier patterns

## How to Use

1. Open `index.html` in a web browser
2. Enter a phrase in the input field (or use the default example)
3. Click "Process Message" to see the step-by-step analysis
4. Watch as each step is revealed with animations

## The Four Steps Visualized

### Step 1: Word Substitution
- Shows original input vs. substituted input
- Lists all substitutions applied (like "my" → "your")

### Step 2: Keyword Ranking  
- Displays all keywords found in the input
- Shows their importance rank (higher = more important)
- Highlights which keyword/sentence was selected for processing

### Step 3: Pattern Matching
- Shows all pattern attempts using Weizenbaum notation
- Demonstrates regex conversion and matching
- Highlights successful matches with captured groups

### Step 4: Response Generation
- Shows the reassembly rule selection
- Demonstrates how numbered groups are replaced
- Reveals the final Eliza response

## Technical Details

The visualization uses the same pattern matching logic as the original Python implementation:

- **Weizenbaum Notation**: `(0 YOUR @FAMILY 0 YOU)` means "any words, then 'YOUR', then a family word, then any words, then 'YOU'"
- **Regex Conversion**: Converts to proper regex patterns for matching
- **Group Capture**: Extracts parts of the input for use in responses
- **Reassembly Rules**: Templates that use captured groups to form responses

## Color Scheme

The app uses a purple theme throughout to maintain visual consistency:
- Primary Purple: #6B46C1
- Light Purple: #A78BFA  
- Dark Purple: #4C1D95
- Purple gradients and accents throughout the interface
