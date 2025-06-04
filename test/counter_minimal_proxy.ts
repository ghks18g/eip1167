import { ethers, config } from "hardhat";

import { BigNumber, providers, Wallet, ContractReceipt } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Counter,
  Counter__factory,
  CounterFactory,
  CounterFactory__factory,
  ICounter,
  ICounter__factory,
} from "../typechain-types";

describe("EIP-1167 Minimal Proxy (Factory Pattern ) Test", async () => {
  let owner: SignerWithAddress;
  let eoa1: Wallet;
  let eoa2: Wallet;

  let counter: Counter;
  let counterFactory: CounterFactory;
  let counterInstance1: Counter;
  let counterInstance2: Counter;

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
      const createCounterInstance1Tx = await counterFactory
        .connect(eoa1)
        .createClone(initialValue);
      const createCounterInstance1Receipt =
        await createCounterInstance1Tx.wait();
      for (const log of createCounterInstance1Receipt.logs) {
        const parsedLog = counterFactory.interface.parseLog(log);
        if (parsedLog.name === "CounterCreated") {
          instanceAddress = await ethers.utils.getAddress(parsedLog.args[0]);
          counterInstance1 = Counter__factory.connect(instanceAddress, eoa1);
        }
      }

      expect(counterInstance1.address).to.equals(instanceAddress);
    });

    it("4. get instance info 1", async () => {
      const initCount = await counterInstance1.getCount();
      expect(initCount).to.equal(BigNumber.from(0));
    });

    it("5. Create instance 2", async () => {
      const createCounterInstance1Tx = await counterFactory
        .connect(eoa2)
        .createClone(initialValue);
      const createCounterInstance1Receipt =
        await createCounterInstance1Tx.wait();
      for (const log of createCounterInstance1Receipt.logs) {
        const parsedLog = counterFactory.interface.parseLog(log);
        if (parsedLog.name === "CounterCreated") {
          instance2Address = await ethers.utils.getAddress(parsedLog.args[0]);
          counterInstance2 = Counter__factory.connect(instance2Address, eoa2);
        }
      }

      expect(counterInstance2.address).to.equals(instance2Address);
    });

    it("6. get instance info 2", async () => {
      const initCount = await counterInstance2.getCount();
      expect(initCount).to.equal(BigNumber.from(0));
    });

    it("7. increment for instance 1", async () => {
      const incrementTx = await counterInstance1.increment();
      const incrementReceipt = await incrementTx.wait();

      const afterValue = await counterInstance1.getCount();

      expect(afterValue).to.equal(BigNumber.from(1));
    });

    it("8. increment twice for instance 2", async () => {
      const incrementTx1 = await counterInstance2.increment();
      const incrementReceipt1 = await incrementTx1.wait();

      const incrementTx2 = await counterInstance2.increment();
      const incrementReceipt2 = await incrementTx2.wait();

      const afterValue = await counterInstance2.getCount();

      expect(afterValue).to.equal(BigNumber.from(2));
    });
  });

  after(async () => {
    const [counterOwner, counterValue] = await Promise.all([
      counter.owner(),
      counter.getCount(),
    ]);
    const [counter1Owner, counter1Value] = await Promise.all([
      counterInstance1.owner(),
      counterInstance1.getCount(),
    ]);
    const [counter2Owner, counter2Value] = await Promise.all([
      counterInstance2.owner(),
      counterInstance2.getCount(),
    ]);

    const [original, clonedInstances] = await Promise.all([
      counterFactory.implementation(),
      counterFactory.getCounters(),
    ]);

    console.log("-------------- Accounts --------------");
    console.log("eoa1: \n", eoa1.address);
    console.log("eoa2: \n", eoa2.address);
    console.log("\n");
    console.log("-------------- Counter Factory --------------");
    console.log("original (implementation): \n", original);
    console.log("clonedInstances: \n", clonedInstances);
    console.log("\n");
    console.log("-------------- Counter Original --------------");
    console.log("counter1: \n", counter.address);
    console.log("counterOwner: \n", counterOwner);
    console.log("counterValue: \n", counterValue);
    console.log("\n");
    console.log("-------------- Counter 1 --------------");
    console.log("counter1: \n", counterInstance1.address);
    console.log("counter1Owner: \n", counter1Owner);
    console.log("counter1Value: \n", counter1Value);
    console.log("\n");
    console.log("-------------- Counter 2 --------------");
    console.log("counter2: \n", counterInstance2.address);
    console.log("counter2Owner: \n", counter2Owner);
    console.log("counter2Value: \n", counter2Value);
  });
});
