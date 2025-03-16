import addresses from "./addresses";

const tokenMapping: { [key: `0x${string}`]: `0x${string}` } = {
  [addresses[8008148].cUSDC as `0x${string}`]: addresses[11155111]
    .cUSDC as `0x${string}`,
  [addresses[11155111].cUSDC as `0x${string}`]: addresses[8008148]
    .cUSDC as `0x${string}`,
};

export default tokenMapping;
