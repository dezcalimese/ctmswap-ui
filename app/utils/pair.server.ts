import type {
  GetSwapPairQuery,
  Pair_Filter,
} from "~/graphql/exchange.generated";
import type { Optional, Pair } from "~/types";
import { exchangeSdk } from "./api.server";
import { getEthUsd, normalizeAdvancedToken } from "./tokens.server";

type RawPair = GetSwapPairQuery["pairs"][0];

const normalizePair = (
  {
    id,
    token0: rawToken0,
    token1: rawToken1,
    token0Price,
    token1Price,
    reserve0,
    reserve1,
    reserveUSD,
    totalSupply: rawTotalSupply,
    hourData,
    dayData,
  }: RawPair,
  ethUsd = 0
): Pair => {
  const token0 = {
    ...normalizeAdvancedToken(rawToken0, ethUsd),
    price: parseFloat(token0Price),
    reserve: parseFloat(reserve0),
  };
  const token1 = {
    ...normalizeAdvancedToken(rawToken1, ethUsd),
    price: parseFloat(token1Price),
    reserve: parseFloat(reserve1),
  };
  const liquidityUsd = parseFloat(reserveUSD);
  const totalSupply = parseFloat(rawTotalSupply);
  return {
    id,
    name: `${token0.symbol}-${token1.symbol}`,
    token0,
    token1,
    totalSupply,
    liquidityUsd,
    lpPriceUsd: liquidityUsd / totalSupply,
    liquidity1dUsdIntervals: hourData.map(({ date, reserveUSD }) => ({
      date,
      value: parseFloat(reserveUSD),
    })),
    liquidity1wUsdIntervals: dayData.map(({ date, reserveUSD }) => ({
      date,
      value: parseFloat(reserveUSD),
    })),
    volume1dUsdIntervals: hourData.map(({ date, volumeUSD }) => ({
      date,
      value: parseFloat(volumeUSD),
    })),
    volume1wUsdIntervals: dayData.map(({ date, volumeUSD }) => ({
      date,
      value: parseFloat(volumeUSD),
    })),
    volume1dUsd: hourData.reduce(
      (total, { volumeUSD }) => total + parseFloat(volumeUSD),
      0
    ),
    volume1wUsd: dayData.reduce(
      (total, { volumeUSD }) => total + parseFloat(volumeUSD),
      0
    ),
  };
};

export const getPair = async (
  tokenA: string,
  tokenB: string,
  url: string
): Promise<Optional<Pair>> => {
  const sdk = exchangeSdk(url);
  const [token0, token1] = [tokenA, tokenB].sort();
  const [
    ethUsd,
    {
      pairs: [pair],
    },
  ] = await Promise.all([
    getEthUsd(url),
    sdk.getSwapPair({
      token0,
      token1,
    }),
  ]);

  if (!pair) {
    return undefined;
  }

  return normalizePair(pair, ethUsd);
};

export const getPairById = async (
  id: string,
  url: string
): Promise<Optional<Pair>> => {
  const sdk = exchangeSdk(url);
  const [ethUsd, { pair }] = await Promise.all([
    getEthUsd(url),
    sdk.getPair({ id }),
  ]);

  if (!pair) {
    return undefined;
  }

  return normalizePair(pair, ethUsd);
};

export const getPairs = async (
  url: string,
  where?: Pair_Filter
): Promise<Pair[]> => {
  const sdk = exchangeSdk(url);

  const [ethUsd, { pairs }] = await Promise.all([
    getEthUsd(url),
    sdk.getPairs({
      where: {
        ...where,
        reserveETH_gt: 0,
      },
    }),
  ]);
  return pairs.map((pair) => normalizePair(pair as RawPair, ethUsd));
};
