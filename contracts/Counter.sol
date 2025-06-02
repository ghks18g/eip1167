// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Counter {
    uint256 public count;
    address public owner;

    bool private initialized;

    function initialize(uint256 _initialValue) external {
        require(!initialized, "Already initialized");
        initialized = true;
        count = _initialValue;
        owner = msg.sender;
    }

    function increment() external {
        require(msg.sender == owner, "Not owner");
        count++;
    }

    function getCount() external view returns (uint256) {
        return count;
    }
}