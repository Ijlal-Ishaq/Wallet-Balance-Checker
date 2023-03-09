How to use

```javascript
import { WalletBalanceChecker } from 'wallet-balance-checker';

const wbc = new WalletBalanceChecker();

const balance = await wbc.getWalletBalance(
  'ethereum', // ethereum | binance | polygon
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045', // wallet address
  true, // usd price flag
);

console.log(balance);
```
