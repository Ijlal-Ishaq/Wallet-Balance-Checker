import { DefaultRPCs } from './utils/constants';
import { IConstructorParams, IChains, IRPCs, IAllTokens, IAllPrices, IBalance } from './types';
import { getTokens, getPrices, getBlockTimestamp, getBalance, bindPriceToBalance } from './service';

export class WalletBalanceChecker {
  private static RPCs: IRPCs = DefaultRPCs;
  private static Tokens: IAllTokens;
  private static Prices: { [date: string]: IAllPrices };

  constructor(params?: IConstructorParams) {
    if (params)
      (Object.keys(params.RPCs) as IChains[])?.forEach((chain) => {
        if (params.RPCs[chain]) WalletBalanceChecker.RPCs[chain] = params.RPCs[chain]!;
      });
  }

  async getWalletBalance(
    chain: IChains,
    walletAddress: string,
    includePrice: boolean,
    block?: number,
  ): Promise<IBalance> {
    try {
      if (!WalletBalanceChecker?.Tokens) {
        WalletBalanceChecker.Tokens = await getTokens();
      }

      let balancePromise = getBalance(
        chain,
        walletAddress,
        WalletBalanceChecker.RPCs[chain],
        WalletBalanceChecker.Tokens[chain],
        block,
      );

      let pricePromise, timestamp, date;

      if (includePrice) {
        timestamp = !block ? new Date().getTime() : await getBlockTimestamp(block, WalletBalanceChecker.RPCs[chain]);
        date = new Date(timestamp).toDateString();

        if (WalletBalanceChecker?.Prices?.[date]) {
          pricePromise = WalletBalanceChecker.Prices[date];
        } else {
          pricePromise = getPrices(timestamp);
        }
      }

      let [balance, prices] = await Promise.all([balancePromise, pricePromise]);

      if (includePrice && prices && date) {
        WalletBalanceChecker.Prices = { ...WalletBalanceChecker.Prices, [date]: prices };
        balance = bindPriceToBalance(balance, WalletBalanceChecker.Prices[date][chain]);
      }

      return balance;
    } catch (e: any) {
      throw new Error(e?.message);
    }
  }
}
