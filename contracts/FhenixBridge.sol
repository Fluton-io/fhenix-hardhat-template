// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@fhenixprotocol/contracts/FHE.sol";

interface IFhenixWEERC20 {
  function transferEncrypted(
    address recipient,
    inEuint32 calldata encryptedAmount
  ) external;

  function transferFromEncrypted(
    address sender,
    address recipient,
    inEuint32 calldata encryptedAmount
  ) external;
}

contract FhenixBridge is Ownable2Step {
  struct Intent {
    address tokenAddress;
    address from;
    address to;
    euint32 amount;
  }

  uint64 public nextIntentId = 0;

  mapping(uint64 => Intent) public intents;

  event Packet(
    address tokenAddress,
    eaddress encryptedTo,
    euint32 encryptedAmount,
    string toPermit,
    string amountPermit,
    address relayerAddress
  );
  event IntentProcessed(uint64 indexed intentId);

  constructor() Ownable(msg.sender) {}

  function bridgeWEERC20(
    address tokenAddress,
    inEaddress calldata _encryptedTo,
    inEuint32 calldata _encryptedAmount,
    address _relayerAddress,
    bytes32 _relayerSeal
  ) public {
    IFhenixWEERC20(tokenAddress).transferFromEncrypted(
      msg.sender,
      address(this),
      _encryptedAmount
    );

    eaddress to = FHE.asEaddress(_encryptedTo);
    euint32 amount = FHE.asEuint32(_encryptedAmount);

    string memory toPermit = FHE.sealoutput(to, _relayerSeal);
    string memory amountPermit = FHE.sealoutput(amount, _relayerSeal);

    emit Packet(
      tokenAddress,
      to,
      amount,
      toPermit,
      amountPermit,
      _relayerAddress
    );
  }

  function onRecvIntent(
    address tokenAddress,
    address _to,
    inEuint32 calldata _encryptedAmount
  ) public {
    IFhenixWEERC20(tokenAddress).transferFromEncrypted(
      msg.sender,
      _to,
      _encryptedAmount
    );

    euint32 amount = FHE.asEuint32(_encryptedAmount);

    nextIntentId++;
    Intent memory intent = Intent({
      tokenAddress: tokenAddress,
      from: msg.sender,
      to: _to,
      amount: amount
    });
    intents[nextIntentId] = intent;

    emit IntentProcessed(nextIntentId);
  }

  function withdraw(
    address tokenAddress,
    inEuint32 calldata _encryptedAmount
  ) public onlyOwner {
    IFhenixWEERC20(tokenAddress).transferEncrypted(
      msg.sender,
      _encryptedAmount
    );
  }
}
