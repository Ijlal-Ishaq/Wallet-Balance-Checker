import Web3 from 'web3';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

import tokens from './utils/tokens.json';
import pricesToday from './utils/pricesToday.json';

import { IAllTokens, ITokens, IAllPrices, IPrices, IBalance, ITokenBalance, IChains } from './types';
import { BalanceCheckerAbi } from './utils/abis';
import { BALANCE_CHECKER_ADDRESSES, SPOCK_API_URL } from './utils/constants';

export async function getTokens(): Promise<IAllTokens> {
  const lastWeekTimeStamp = Date.now() - 6.048e8;

  if (tokens?.lastUpdated > lastWeekTimeStamp) {
    return {
      ethereum: tokens.ethereum,
      polygon: tokens.polygon,
      binance: tokens.binance,
    };
  } else {
    const newTokens = await axios.get(SPOCK_API_URL + 'assets/getTokens');
    const newTokensObj = {
      ethereum: newTokens.data.data.ethereum,
      polygon: newTokens.data.data.polygon,
      binance: newTokens.data.data.binance,
    };
    updateTokens({ ...newTokensObj, lastUpdated: Date.now() });
    return newTokensObj;
  }
}

function updateTokens(tokensObj: any) {
  fs.writeFileSync(path.join(__dirname, './utils/tokens.json'), JSON.stringify(tokensObj));
}

export async function getPrices(timestamp: number): Promise<IAllPrices> {
  let prices;
  let res;

  const date = new Date(timestamp).toDateString();

  if (pricesToday.date === date) {
    res = {
      ethereum: pricesToday.ethereum,
      polygon: pricesToday.polygon,
      binance: pricesToday.binance,
    };
  } else {
    prices = await axios.get(SPOCK_API_URL + 'assets/getPrices/' + timestamp);

    res = {
      ethereum: prices.data.data.ethereum,
      polygon: prices.data.data.polygon,
      binance: prices.data.data.binance,
    };

    if (date === new Date(Date.now()).toDateString()) {
      updatePriceToday({ ...res, date: date });
    }
  }

  return res;
}

function updatePriceToday(pricesObj: any) {
  fs.writeFileSync(path.join(__dirname, './utils/pricesToday.json'), JSON.stringify(pricesObj));
}

export async function getBalance(
  chain: IChains,
  walletAddress: string,
  rpc: string,
  tokens: ITokens,
  block?: number,
): Promise<IBalance> {
  const web3 = new Web3(rpc);

  const contract = new web3.eth.Contract(
    JSON.parse(JSON.stringify(BalanceCheckerAbi)),
    BALANCE_CHECKER_ADDRESSES[chain],
  );

  const tokenAddresses = Object.keys(tokens);
  const promises: Promise<any>[] = [];

  const batchSize = 500;

  for (let i = 0; i < tokenAddresses.length; i += batchSize) {
    promises.push(
      contract.methods.balances([walletAddress], tokenAddresses.slice(i, i + batchSize)).call(undefined, block),
    );
  }

  const resolvedPromises = await Promise.all(promises);

  let balances: string[] = [];
  let balanceTokens: ITokenBalance[] = [];

  resolvedPromises.forEach((e) => {
    balances = balances.concat(e);
  });

  balances.forEach((e, i) => {
    const balance = Number(e);

    if (balance > 0) {
      const tokenDecimals = tokens[tokenAddresses[i]]?.decimals;
      const tokenBalance = balance / 10 ** (tokenDecimals > 0 ? tokenDecimals : 18);

      balanceTokens.push({
        ...tokens[tokenAddresses[i]],
        balance: tokenBalance,
      });
    }
  });

  return {
    chain: chain,
    walletAddress: walletAddress,
    tokens: balanceTokens,
  };
}

export function bindPriceToBalance(balance: IBalance, prices: IPrices): IBalance {
  balance.tokens.forEach((e, i) => {
    balance.tokens[i].tokenPriceUsd = Number(prices[e.address.toLowerCase()]) || 0;
    balance.tokens[i].balanceUsd = e.balance * (Number(prices[e.address.toLowerCase()]) || 0);
  });

  return {
    chain: balance.chain,
    walletAddress: balance.walletAddress,
    tokens: balance.tokens,
  };
}

export async function getBlockTimestamp(blockNumber: number, rpc: string): Promise<number> {
  const web3 = new Web3(rpc);
  const block = await web3.eth.getBlock(blockNumber);

  return Number(block.timestamp);
}
