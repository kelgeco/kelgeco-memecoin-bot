const axios = require('axios');

const WEBHOOK = 'https://discord.com/api/webhooks/1516699755466588220/GYLD0KIA_sn8aPuxQEj3MBAUtIWb2XCQOewaosRFl6clsZCWjEpD5FNu5DrKkQXlcliv';
const tracked = new Set();

async function scanNewTokens() {
  try {
    const res = await axios.get('https://api.dexscreener.com/latest/dex/search?q=solana&order=createdAt', {
      timeout: 10000
    });
    
    if (!res.data || !res.data.pairs) {
      console.log('No data');
      return;
    }

    for (const pair of res.data.pairs.slice(0, 20)) {
      if (!pair.baseToken) continue;
      if (pair.chainId !== 'solana') continue;

      const mint = pair.baseToken.address;
      const symbol = pair.baseToken.symbol;
      const name = pair.baseToken.name;
      const marketCap = pair.marketCap || 0;
      const liquidity = pair.liquidity?.usd || 0;
      const priceUsd = pair.priceUsd ? parseFloat(pair.priceUsd) : 0;
      
      if (!tracked.has(mint) && liquidity > 1000 && liquidity < 500000 && marketCap > 5000) {
        tracked.add(mint);
        
        const embed = {
          title: `🔥 ${symbol}`,
          description: `**${name}**`,
          color: 0xff6b00,
          fields: [
            { name: '💰 Market Cap', value: `$${(marketCap / 1000).toFixed(2)}K`, inline: true },
            { name: '💧 Liquidity', value: `$${(liquidity / 1000).toFixed(2)}K`, inline: true },
            { name: '💵 Price', value: priceUsd > 0 ? `$${priceUsd.toFixed(8)}` : 'N/A', inline: true },
            { name: '🪙 CA', value: `\`${mint}\``, inline: false },
            { name: '🔗 View', value: `[DexScreener](https://dexscreener.com/solana/${mint}) • [Raydium](https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${mint})`, inline: false }
          ],
          footer: { text: 'KELGECO Memecoin Detector' },
          timestamp: new Date().toISOString()
        };

        try {
          await axios.post(WEBHOOK, { embeds: [embed] });
          console.log(`✅ ${symbol} - $${(marketCap / 1000).toFixed(2)}K`);
        } catch (e) {}
      }
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

console.log('🚀 KELGECO Memecoin Detector - Solana Edition');
console.log('Detectando tokens nuevos...\n');

setInterval(scanNewTokens, 20000);
scanNewTokens();
