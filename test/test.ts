import { ethers, config } from "hardhat";

import { BigNumber, providers, Wallet, ContractReceipt } from "ethers";
import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Test", async () => {
  let owner: SignerWithAddress;
  let eoa1: Wallet;
  let eoa2: Wallet;
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

  after(async () => {
    console.log("eoa1: \n", eoa1.address);
    console.log("eoa2: \n", eoa2.address);
  });
});
