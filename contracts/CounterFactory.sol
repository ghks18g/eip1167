// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/proxy/Clones.sol";

interface ICounter {
    function initialize(uint256 _initialValue) external;
}

contract CounterFactory {
    address public implementation;
    address[] public allCounters;

    event CounterCreated(address indexed counter);

    constructor(address _implementation) {
        implementation = _implementation;
    }

    function createClone(uint256 initialValue) external returns (address counter) {
        counter = Clones.clone(implementation);
        ICounter(counter).initialize(initialValue);
        allCounters.push(counter);

        emit CounterCreated(counter);
    }

    function getCounters() external view returns (address[] memory) {
        return allCounters;
    }
}