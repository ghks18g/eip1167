// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Counter {
    uint256 public count;
    address public owner;

    bool private initialized;

    function initialize(uint256 _initialValue, address _owner) external {
        require(!initialized, "Already initialized");
        initialized = true;
        count = _initialValue;
        owner = _owner;
    }

    function increment() external {
        require(msg.sender == owner, "Not owner");
        count++;
    }

    function getCount() external view returns (uint256) {
        return count;
    }
}