pragma solidity ^0.8.20;

import "@fhenixprotocol/contracts/access/Permissioned.sol";
import "@fhenixprotocol/contracts/FHE.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import {ICERC20} from "./ICERC20.sol";

contract Faucet is Ownable2Step {
  uint256 public waitTime = 24 hours;

  address[] public tokenAddresses;

  mapping(address => uint256) public nextAccessTime;
  mapping(address => uint64) public maxReceivableTokenAmount;

  constructor(address[] memory _tokenAdresses) Ownable(msg.sender) {
    require(_tokenAdresses.length > 0, "Faucet: No tokens provided");
    tokenAddresses = _tokenAdresses;
  }

  function setWaitTime(uint256 _waitTime) public onlyOwner {
    require(_waitTime > 0);
    waitTime = _waitTime;
  }

  function setMaxReceivableTokenAmount(
    address _tokenAddress,
    uint64 _amount
  ) public onlyOwner {
    require(_tokenAddress != address(0));
    maxReceivableTokenAmount[_tokenAddress] = _amount;
  }

  function addToken(address _tokenAddress) public onlyOwner {
    require(_tokenAddress != address(0));
    tokenAddresses.push(_tokenAddress);
  }

  function removeToken(address _tokenAddress) public onlyOwner {
    require(_tokenAddress != address(0));
    for (uint256 i = 0; i < tokenAddresses.length; i++) {
      if (tokenAddresses[i] == _tokenAddress) {
        tokenAddresses[i] = tokenAddresses[tokenAddresses.length - 1];
        tokenAddresses.pop();
        break;
      }
    }
  }

  function requestTokens() public {
    require(allowedToWithdraw(msg.sender));
    nextAccessTime[msg.sender] = block.timestamp + waitTime;
    for (uint256 i = 0; i < tokenAddresses.length; i++) {
      address tokenAddress = tokenAddresses[i];
      ICERC20 token = ICERC20(tokenAddress);
      euint32 r32 = FHE.rem(
        FHE.randomEuint32(),
        FHE.asEuint32(maxReceivableTokenAmount[tokenAddress])
      );
      token.transferEncrypted(msg.sender, r32.toU64());
    }
  }

  function allowedToWithdraw(address _address) public view returns (bool) {
    if (block.timestamp < nextAccessTime[_address]) {
      return false;
    }
    return true;
  }
}
