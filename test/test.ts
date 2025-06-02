import { ethers, config } from "hardhat";

import { BigNumber, providers, Wallet, ContractReceipt } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Counter,
  CounterFactory,
  ICounter,
  ICounter__factory,
} from "../typechain-types";

describe("EIP-1167 Minimal Proxy (Factory Pattern ) Test", async () => {
  let owner: SignerWithAddress;
  let eoa1: Wallet;
  let eoa2: Wallet;

  let counter: Counter;
  let counterFactory: CounterFactory;
  let counterInstance1: ICounter;
  let counterInstance2: ICounter;

  before(async () => {
    const [operator] = await ethers.getSigners();

    if (!operator.provider) {
      throw new Error("provider is undefined");
    }
    owner = operator;
    eoa1 = ethers.Wallet.createRandom().connect(operator.provider);
    eoa2 = ethers.Wallet.createRandom().connect(operator.provider);

    // #region - Native Token 분배 (owner, relayWorker)
    const sendNativeToOwner = await operator.sendTransaction({
      to: eoa1.address,
      value: ethers.utils.parseEther("1000"),
    });

    await sendNativeToOwner.wait();

    const sendNativeToRelayWorker = await operator.sendTransaction({
      to: eoa2.address,
      value: ethers.utils.parseEther("1000"),
    });

    await sendNativeToRelayWorker.wait();
    // #endregion
  });

  describe("Deploy Contract", async () => {
    it("1. Counter Deploy", async () => {
      const Counter_factory = (
        await ethers.getContractFactory("Counter")
      ).connect(owner);
      counter = await Counter_factory.deploy();
      await counter.deployed();

      expect(!!counter).to.equals(true);
    });

    it("2. CounterFactory Deploy", async () => {
      const CounterFactory_factory = (
        await ethers.getContractFactory("CounterFactory")
      ).connect(owner);

      counterFactory = await CounterFactory_factory.deploy(counter.address);
      counterFactory.deployed();

      expect(!!counterFactory).to.equals(true);
    });
  });

  describe("Create Clone ", async () => {
    const initialValue = 0;
    let instanceAddress: string;
    let instance2Address: string;

    it("3. Create instance 1", async () => {
      const createCounterInstance1Tx =
        await counterFactory.createClone(initialValue);
      const createCounterInstance1Receipt =
        await createCounterInstance1Tx.wait();
      for (const log of createCounterInstance1Receipt.logs) {
        const parsedLog = counterFactory.interface.parseLog(log);
        if (parsedLog.name === "CounterCreated") {
          instanceAddress = await ethers.utils.getAddress(parsedLog.args[0]);
          counterInstance1 = ICounter__factory.connect(instanceAddress, owner);
        }
      }

      expect(counterInstance1.address).to.equals(instanceAddress);
    });

    it("4. Create instance 2", async () => {
      const createCounterInstance1Tx =
        await counterFactory.createClone(initialValue);
      const createCounterInstance1Receipt =
        await createCounterInstance1Tx.wait();
      for (const log of createCounterInstance1Receipt.logs) {
        const parsedLog = counterFactory.interface.parseLog(log);
        if (parsedLog.name === "CounterCreated") {
          instance2Address = await ethers.utils.getAddress(parsedLog.args[0]);
          counterInstance2 = ICounter__factory.connect(instance2Address, owner);
        }
      }

      expect(counterInstance2.address).to.equals(instance2Address);
    });
  });

  after(async () => {
    console.log("eoa1: \n", eoa1.address);
    console.log("eoa2: \n", eoa2.address);
  });
});
