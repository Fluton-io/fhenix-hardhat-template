import * as dotenv from "dotenv";
dotenv.config();
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "fhenix-hardhat-docker";
import "fhenix-hardhat-plugin";
import "fhenix-hardhat-network";

import "./tasks";

// If not set, it uses ours Alchemy's default API key.
// You can get your own at https://dashboard.alchemyapi.io
const providerApiKey =
  process.env.ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";
// If not set, it uses the hardhat account 0 private key.
const deployerPrivateKey =
  process.env.DEPLOYER_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
const userPrivateKey = process.env.USER_PRIVATE_KEY;
// If not set, it uses ours Etherscan default API key.
const etherscanApiKey =
  process.env.ETHERSCAN_API_KEY || "DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW";

const accounts = [deployerPrivateKey, userPrivateKey, relayerPrivateKey];

const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        // https://docs.soliditylang.org/en/latest/using-the-compiler.html#optimizer-options
        runs: 200,
      },
    },
  },
  defaultNetwork: "nitrogen",
  namedAccounts: {
    deployer: 0,
    user: 1,
    relayer: 2,
  },
  networks: {
    // View the networks that are pre-configured.
    // If the network you are looking for is not here you can add new network settings
    helium: {
      url: "https://api.testnet.fhenix.zone:7747",
      chainId: 42069,
      accounts,
    },
    nitrogen: {
      url: "https://api.nitrogen.fhenix.zone",
      chainId: 8008148,
      accounts,
    },
    localhost: {
      chainId: 31337,
    },
  },
  // configuration for harhdat-verify plugin
  etherscan: {
    apiKey: {
      nitrogen: "empty",
    },
    customChains: [
      {
        network: "nitrogen",
        chainId: 8008148,
        urls: {
          apiURL: "https://explorer.nitrogen.fhenix.zone/api",
          browserURL: "http://https://explorer.nitrogen.fhenix.zone",
        },
      },
    ],
  },
  // configuration for etherscan-verify from hardhat-deploy plugin
  verify: {
    etherscan: {
      apiKey: `${etherscanApiKey}`,
    },
  },
  sourcify: {
    enabled: false,
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
