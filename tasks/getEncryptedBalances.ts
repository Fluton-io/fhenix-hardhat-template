import { task } from "hardhat/config";
import { Deployment } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { FhenixWEERC20 } from "../typechain-types";

task("task:getEncryptedBalances").setAction(async function (
  _taskArguments: TaskArguments,
  hre: HardhatRuntimeEnvironment,
) {
  const { fhenixjs, ethers, deployments } = hre;
  const [deployer, user, relayer] = await ethers.getSigners();

  const FhenixWEERC20: Deployment = await deployments.get("FhenixWEERC20");

  let contract = await ethers.getContractAt(
    "FhenixWEERC20",
    FhenixWEERC20.address,
  );

  console.log(
    `Running encryptedBalanceOf, targeting contract at: ${FhenixWEERC20.address}`,
  );

  contract = contract.connect(deployer) as unknown as FhenixWEERC20;

  let permit = await fhenixjs.generatePermit(
    FhenixWEERC20.address,
    undefined, // use the internal provider
    deployer,
  );

  const permission = fhenixjs.extractPermitPermission(permit);
  const result = await contract.encryptedBalanceOf(permission);
  console.log(`deployer balance: ${result.toString()}`);

  contract = contract.connect(user) as unknown as FhenixWEERC20;

  permit = await fhenixjs.generatePermit(
    FhenixWEERC20.address,
    undefined, // use the internal provider
    user,
  );

  const userPermission = fhenixjs.extractPermitPermission(permit);
  const userResult = await contract.encryptedBalanceOf(userPermission);
  console.log(`user balance: ${userResult.toString()}`);

  contract = contract.connect(relayer) as unknown as FhenixWEERC20;

  permit = await fhenixjs.generatePermit(
    FhenixWEERC20.address,
    undefined, // use the internal provider
    relayer,
  );

  const relayerPermission = fhenixjs.extractPermitPermission(permit);
  const relayerResult = await contract.encryptedBalanceOf(relayerPermission);
  console.log(`relayer balance: ${relayerResult.toString()}`);
});
