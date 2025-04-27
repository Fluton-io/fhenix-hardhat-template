// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@fhenixprotocol/contracts/FHE.sol";
import "hardhat/console.sol";

interface IFhenixCERC20 {
  function transferEncrypted(
    address recipient,
    inEuint64 calldata encryptedAmount
  ) external;

  function transferFromEncrypted(
    address sender,
    address recipient,
    inEuint64 calldata encryptedAmount
  ) external;

  function transferEncrypted(
    address recipient,
    euint64 encryptedAmount
  ) external;

  function transferFromEncrypted(
    address sender,
    address recipient,
    euint64 encryptedAmount
  ) external;
}

error MsgValueDoesNotMatchInputAmount();
error UnauthorizedRelayer();

contract FHEBridge is Ownable2Step {
  enum FilledStatus {
    NOT_FILLED,
    FILLED
  }

  struct Intent {
    address sender;
    address receiver;
    address relayer;
    address inputToken;
    address outputToken;
    euint64 inputAmount;
    euint64 outputAmount;
    uint256 id;
    uint32 originChainId;
    uint32 destinationChainId;
    FilledStatus filledStatus;
  }

  mapping(uint256 intentId => bool exists) public doesIntentExist;

  event IntentFulfilled(Intent intent);
  event IntentCreated(
    Intent intent,
    string inputAmountSealed,
    string outputAmountSealed
  );
  event IntentRepaid(Intent intent);

  constructor() Ownable(msg.sender) {}

  function bridge(
    address _sender,
    address _receiver,
    address _relayer,
    address _inputToken,
    address _outputToken,
    inEuint64 calldata _encInputAmount,
    inEuint64 calldata _encOutputAmount,
    uint32 _destinationChainId,
    bytes32 _relayerSeal
  ) public {
    euint64 encInputAmount = FHE.asEuint64(_encInputAmount);
    euint64 encOutputAmount = FHE.asEuint64(_encOutputAmount);

    string memory inputAmountSealed = FHE.sealoutput(
      encInputAmount,
      _relayerSeal
    );
    string memory outputAmountSealed = FHE.sealoutput(
      encOutputAmount,
      _relayerSeal
    );

    uint256 id = uint256(
      keccak256(
        abi.encodePacked(
          _sender,
          _receiver,
          _relayer,
          _inputToken,
          _outputToken,
          encInputAmount,
          encOutputAmount,
          _destinationChainId,
          block.timestamp
        )
      )
    );

    Intent memory intent = Intent({
      sender: _sender,
      receiver: _receiver,
      relayer: _relayer,
      inputToken: _inputToken,
      outputToken: _outputToken,
      inputAmount: encInputAmount,
      outputAmount: encOutputAmount,
      id: id,
      originChainId: uint32(block.chainid),
      destinationChainId: _destinationChainId,
      filledStatus: FilledStatus.NOT_FILLED
    });

    IFhenixCERC20(_inputToken).transferFromEncrypted(
      msg.sender,
      address(this),
      encInputAmount
    );

    emit IntentCreated(intent, inputAmountSealed, outputAmountSealed);
  }

  function fulfill(Intent memory intent) public {
    if (intent.relayer != msg.sender) {
      revert UnauthorizedRelayer();
    }

    // euint32 amount = FHE.asEuint32(_encryptedAmount);

    IFhenixCERC20(intent.outputToken).transferFromEncrypted(
      intent.relayer,
      intent.receiver,
      intent.outputAmount
    );

    doesIntentExist[intent.id] = true;

    emit IntentFulfilled(intent);
  }

  function fulfill(
    Intent calldata intent,
    inEuint64 calldata _outputAmount
  ) external {
    euint64 outputAmount = FHE.asEuint64(_outputAmount);

    Intent memory modifiedIntent = Intent({
      sender: intent.sender,
      receiver: intent.receiver,
      relayer: intent.relayer,
      inputToken: intent.inputToken,
      outputToken: intent.outputToken,
      inputAmount: intent.inputAmount,
      outputAmount: outputAmount,
      id: intent.id,
      originChainId: intent.originChainId,
      destinationChainId: intent.destinationChainId,
      filledStatus: intent.filledStatus
    });

    fulfill(modifiedIntent);
  }

  function withdraw(
    address tokenAddress,
    inEuint64 calldata _encryptedAmount
  ) public onlyOwner {
    euint64 encryptedAmount = FHE.asEuint64(_encryptedAmount);
    IFhenixCERC20(tokenAddress).transferEncrypted(msg.sender, encryptedAmount);
  }
}
