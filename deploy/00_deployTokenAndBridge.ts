import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * Deploys Token and Bridge contracts using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployTokenAndBridge: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network goerli`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  if (hre.network.name === "hardhat" && process.argv.includes("deploy")) {
    console.warn(
      "Warning: you are deploying to the in-process Hardhat network, but this network gets destroyed right after the deployment task ends.",
    );
  }
  // Fund the account before deploying.
  if (hre.network.name === "localfhenix") {
    if ((await hre.ethers.provider.getBalance(deployer)) === 0n) {
      await hre.fhenixjs.getFunds(deployer);
      console.log("Received tokens from the local faucet. Ready to deploy...");
    }
  }

  const weerc20 = await deploy("FhenixWEERC20", {
    from: deployer,
    args: ["Fhenix Wrapped Ether", "FWE"],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  const bridge = await deploy("FhenixBridge", {
    from: deployer,
    args: [weerc20.address],
    log: true,
    skipIfAlreadyDeployed: false,
  });

  console.log("Signer address: ", deployer);
  console.log(`Token contract: `, weerc20.address);
  console.log(`Bridge contract: `, bridge.address);
};

export default deployTokenAndBridge;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Counter
deployTokenAndBridge.tags = ["TokenAndBridge"];