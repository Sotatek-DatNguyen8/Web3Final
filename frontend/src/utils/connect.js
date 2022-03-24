import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";

// Connect wallet
export const injected = new InjectedConnector({ supportedChainIds: [4] });
export const walletConnect = new WalletConnectConnector({
  rpc: {
    4: "https://rinkeby.infura.io/v3/c9f9eba874a24d339db4c886f6964321",
  },
  qrcode: true,
});

// Address
export const SC_WETH = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
export const SC_MasterChef = "0x9da687e88b0A807e57f1913bCD31D56c49C872c2";
export const SC_DD2 = "0xb1745657CB84c370DD0Db200a626d06b28cc5872";
export const SC_MULTICALL = "0x42ad527de7d4e9d9d011ac45b31d8551f8fe9821";

// Chain
export const CHAIN_LIST = {
  1: "Ethereum",
  2: "Morden (disused), Expanse mainnet",
  3: "Ropsten",
  4: "Rinkeby",
  5: "Goerli",
};

// Subgraph
export const REACT_APP_GRAPHQL_URI =
  "https://api.thegraph.com/subgraphs/name/sotatek-datnguyen8/subgraph";
