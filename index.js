const path = require('path'); // Add this at the top with other requires
const express = require('express');
const app = express();
const fs = require('fs');

app.use(express.urlencoded({ extended: true }));

// Set EJS as the template engine
app.set('view engine', 'ejs');
// Optional: specify the views folder (default is "./views")
app.set('views', './views');

const cardsPath = path.join(__dirname, 'database.json');
console.log('Looking for cards at:', cardsPath);

// Load and parse the card data at startup
const data = fs.readFileSync(cardsPath, 'utf8');
const cards = JSON.parse(data);

// Helper: find the best card for a given name
function findBestCard(name) {
    var candidates = cardsByName.get(name);
    if (!candidates) return null;

    // Filter cards with full_art = true
    const fullArtCards = candidates.filter(card => card.full_art === true);

    if (fullArtCards.length > 0) {
    candidates = fullArtCards
    }

    // Find the card with the highest 'usd' price
    let bestCard = null;
    let highestusd = -1;

    candidates.forEach(card => {
        // usd price may be a string or null; convert to number
        let usd = card.prices.usd_foil ? parseFloat(card.prices.usd_foil) : null;
        if (!usd){
            usd = card.prices.usd ? parseFloat(card.prices.usd) : null;
        }

        if (usd) {
            if (usd > highestusd){
                highestusd = usd;
                bestCard = card;
            }
        }
    });

    // If none of the full art cards have a valid usd price, return null (or could return the first full art card)
    return bestCard;
}

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    inputText: '',
    landSet: 'Basic Land Set',
    outputText: ''
  });
});

app.post('/convert', (req, res) => {
  const { inputText = '', landSet = 'Basic Land Set' } = req.body;

  // Split input into lines, process each line
  const lines = inputText.split(/\r?\n/);
  const outputLines = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed === '') {
      outputLines.push(''); // preserve empty lines
      return;
    }

    var splitLine = line.split(" ")

    const number  = splitLine.shift()

    const carName = splitLine.join(" ").split("(")[0].trim()

    const bestCard = cards[carName];
    if (bestCard){
        outputLines.push(`${number} ${carName} (${bestCard.set}) ${bestCard.collector_number} ${bestCard.is_foil?"*F*":""}`);
    }else{
        console.log("missed",carName)
    }
  });

  const outputText = outputLines.join('\n');

  res.render('index', {
    inputText,
    landSet,
    outputText
  });
});


// Start the server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});