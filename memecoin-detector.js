const axios = require('axios');

const WEBHOOK = 'https://discord.com/api/webhooks/1516699755466588220/GYLD0KIA_sn8aPuxQEj3MBAUtIWb2XCQOewaosRFl6clsZCWjEpD5FNu5DrKkQXlcliv';
const tracked = new Set();

function getRiskLevel(liquidity, marketCap) {
  const ratio = liquidity / marketCap;
  if (ratio > 0.15) return { emoji: '🟢', label: 'Liquidez sólida' };
  if (ratio > 0.05) return { emoji: '🟡', label: 'Liquidez media' };
  return { emoji: '🔴', label: 'Liquidez baja - cuidado' };
}

function getAge(createdAt) {
  if (!createdAt) return 'N/A';
  const minutes = Math.floor((Date.now() - createdAt) / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

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
      const buys = pair.txns?.h24?.buys || 0;
      const sells = pair.txns?.h24?.sells || 0;
      const age = getAge(pair.pairCreatedAt);
      const imageUrl = pair.info?.imageUrl || null;
      
      if (!tracked.has(mint) && liquidity > 1000 && liquidity < 500000 && marketCap > 5000) {
        tracked.add(mint);
        
        const risk = getRiskLevel(liquidity, marketCap);
        const buySellRatio = sells > 0 ? (buys / sells).toFixed(2) : buys > 0 ? '∞' : 'N/A';

        const embed = {
          title: `🔥 ${symbol}`,
          description: `**${name}**\n${risk.emoji} ${risk.label}`,
          color: 0xff6b00,
          thumbnail: imageUrl ? { url: imageUrl } : undefined,
          fields: [
            { name: '💰 Market Cap', value: `$${(marketCap / 1000).toFixed(2)}K`, inline: true },
            { name: '💧 Liquidity', value: `$${(liquidity / 1000).toFixed(2)}K`, inline: true },
            { name: '⏰ Edad', value: age, inline: true },
            { name: '💵 Price', value: priceUsd > 0 ? `$${priceUsd.toFixed(8)}` : 'N/A', inline: true },
            { name: '📊 Buys/Sells (24h)', value: `${buys}/${sells} (${buySellRatio})`, inline: true },
            { name: '\u200b', value: '\u200b', inline: true },
            { name: '🪙 CA', value: `\`${mint}\``, inline: false },
            { name: '🔗 View', value: `[DexScreener](https://dexscreener.com/solana/${mint}) • [Raydium](https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${mint}) • [Birdeye](https://birdeye.so/token/${mint}?chain=solana)`, inline: false }
          ],
          footer: { text: 'KELGECO Memecoin Detector' },
          timestamp: new Date().toISOString()
        };

        try {
          await axios.post(WEBHOOK, { embeds: [embed] });
          console.log(`✅ ${symbol} - $${(marketCap / 1000).toFixed(2)}K - ${risk.label}`);
        } catch (e) {}
      }
    }
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

console.log('🚀 KELGECO Memecoin Detector - Solana Edition v2');
console.log('Detectando tokens nuevos...\n');

setInterval(scanNewTokens, 20000);
scanNewTokens();
