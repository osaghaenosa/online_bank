const https = require('https');

// Simple in-memory cache
const cache = {
  crypto: {},
  stocks: {},
  lastFetched: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status code: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Fetch crypto prices from CoinGecko
 * @param {string[]} ids e.g., ['bitcoin', 'ethereum']
 */
async function getCryptoPrices(ids) {
  if (!ids || ids.length === 0) return {};
  
  const now = Date.now();
  // Return cached if valid
  const needsFetch = ids.filter(id => !cache.crypto[id] || (now - cache.crypto[id].timestamp > CACHE_TTL));
  
  if (needsFetch.length > 0) {
    try {
      const idsStr = needsFetch.join(',');
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${idsStr}&vs_currencies=usd`;
      const data = await fetchJSON(url);
      
      for (const [id, value] of Object.entries(data)) {
        cache.crypto[id] = {
          price: value.usd,
          timestamp: now
        };
      }
    } catch (err) {
      console.error('Failed to fetch crypto prices from CoinGecko:', err.message);
    }
  }

  const result = {};
  for (const id of ids) {
    if (cache.crypto[id]) {
      result[id] = cache.crypto[id].price;
    }
  }
  return result;
}

/**
 * Fetch stock prices from Yahoo Finance
 * @param {string[]} tickers e.g., ['AAPL', 'MSFT']
 */
async function getStockPrices(tickers) {
  if (!tickers || tickers.length === 0) return {};

  const now = Date.now();
  const result = {};

  for (const ticker of tickers) {
    if (cache.stocks[ticker] && (now - cache.stocks[ticker].timestamp <= CACHE_TTL)) {
      result[ticker] = cache.stocks[ticker].price;
      continue;
    }

    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
      const data = await fetchJSON(url);
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (price) {
        cache.stocks[ticker] = {
          price,
          timestamp: now
        };
        result[ticker] = price;
      }
    } catch (err) {
      console.error(`Failed to fetch stock price for ${ticker}:`, err.message);
    }
  }

  return result;
}

/**
 * Periodically update all user assets in the background
 */
async function startPriceUpdater() {
  const User = require('../models/User');
  setInterval(async () => {
    try {
      const users = await User.find({ role: 'user' });
      const cryptoIds = new Set();
      const stockTickers = new Set();

      // Gather all unique symbols
      for (const user of users) {
        if (user.cryptoAssets) {
          user.cryptoAssets.forEach(c => { if (c.coin) cryptoIds.add(c.coin.toLowerCase()); });
        }
        if (user.investments) {
          user.investments.forEach(i => { if (i.ticker) stockTickers.add(i.ticker.toUpperCase()); });
        }
      }

      const cryptoPrices = await getCryptoPrices(Array.from(cryptoIds));
      const stockPrices = await getStockPrices(Array.from(stockTickers));

      // Update users
      for (const user of users) {
        let changed = false;
        
        if (user.cryptoAssets) {
          user.cryptoAssets.forEach(c => {
            const pid = c.coin?.toLowerCase();
            if (pid && cryptoPrices[pid]) {
              const newPrice = cryptoPrices[pid];
              if (c.currentPrice !== newPrice) {
                c.currentPrice = newPrice;
                c.valueUSD = parseFloat((c.quantity * newPrice).toFixed(2));
                changed = true;
              }
            }
          });
        }

        if (user.investments) {
          user.investments.forEach(i => {
            const tk = i.ticker?.toUpperCase();
            if (tk && stockPrices[tk]) {
              const newPrice = stockPrices[tk];
              if (i.currentPrice !== newPrice) {
                i.currentPrice = newPrice;
                if (i.quantity && i.quantity > 0) {
                  i.currentValue = parseFloat((i.quantity * newPrice).toFixed(2));
                } else if (i.currentValue > 0 && !i.quantity) {
                  // If we didn't have a quantity but have a currentValue, deduce it once
                  // This handles legacy data that was seeded before we had 'quantity' field
                  // But we only want to do this once. Actually, if they don't have quantity,
                  // we can set quantity = currentValue / newPrice (assuming currentPrice was approx newPrice)
                  // Let's just leave it if they don't have quantity, or we can just update currentPrice
                }
                changed = true;
              }
            }
          });
        }

        if (changed) {
          await user.save({ validateBeforeSave: false });
        }
      }
    } catch (e) {
      console.error('Error in price updater job:', e.message);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

module.exports = {
  getCryptoPrices,
  getStockPrices,
  startPriceUpdater
};
