import { chainId, useNetwork } from "wagmi";

export const useChainId = () => {
  const { chain } = useNetwork();
  if (!chain) {
    return chainId.goerli;
  }

  return chain.unsupported ? chainId.goerli : chain.id;
};
