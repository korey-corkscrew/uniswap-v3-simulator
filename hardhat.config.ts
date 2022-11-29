import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    'node': {
      url: "http://192.168.0.187:8545",
    },
    'truffle-dashboard': {
      url: "http://localhost:24012/rpc"
    },
  }
};

export default config;
