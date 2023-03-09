export type IChains = 'ethereum' | 'polygon' | 'binance';

export type IRPCs = {
  ethereum: string;
  polygon: string;
  binance: string;
};

export type IConstructorParams = {
  RPCs: {
    [chain in IChains]?: string;
  };
};

export type IToken = {
  blockchain: string;
  address: string;
  name: string;
  decimals: number;
  symbol: string;
  thumbnail: string;
};

export type ITokens = {
  [address: string]: IToken;
};

export type IAllTokens = {
  ethereum: ITokens;
  polygon: ITokens;
  binance: ITokens;
};

export type IPrices = {
  [address: string]: string;
};

export type IAllPrices = {
  ethereum: IPrices;
  polygon: IPrices;
  binance: IPrices;
};

export interface ITokenBalance extends IToken {
  balance: number;
  tokenPriceUsd?: number;
  balanceUsd?: number;
}

export type IBalance = {
  chain: IChains;
  walletAddress: string;
  tokens: ITokenBalance[];
};
