const Splitter = artifacts.require("./Splitter.sol");

contract("Splitter", accounts => {
  // big number
  const toBN = web3.utils.toBN;
  // prepare mock data
  // contract
  let instance;
  // addresses
  const [owner, bob, carol, newAddress] = accounts;
  // split amount
  const amountEther = "0.2";
  const amountWei = toBN(web3.utils.toWei(amountEther));
  const amount1 = amountWei.div(toBN(2));
  // gas price
  const gasPrice = 1000;

  // test helper
  // get event result
  const getEventResult = (txObj, eventName) => {
    const event = txObj.logs.find(log => log.event === eventName);
    if (event) {
      return event.args;
    } else {
      return undefined;
    }
  };

  beforeEach(async () => {
    instance = await Splitter.new(true, { from: owner });
  });

  // owner test
  it("should allow owner to change owner address", async () => {
    const txObj = await instance.changeOwner(newAddress, {
      from: owner
    });
    // status
    assert.isTrue(txObj.receipt.status, "transaction status must be true");
    // check event
    const event = getEventResult(txObj, "ChangeOwnerEvent");
    assert.isDefined(event, "it should emit ChangeOwnerEvent");
    // owner changed
    assert.strictEqual(event.oldOwner, owner, "it should change owner");
    assert.strictEqual(event.newOwner, newAddress, "it should change owner");
  });

  // switch Pausable test
  it("should allow to switch pausable", async () => {
    const txObj = await instance.switchRunning(false, {
      from: owner
    });
    // status
    assert.isTrue(txObj.receipt.status, "transaction status must be true");
    // check event
    const event = getEventResult(txObj, "SwitchRunningEvent");
    assert.isDefined(event, "it should emit SwitchRunningEvent");
    // running changed
    assert.strictEqual(
      event.newValue,
      false,
      "it should change pausable to false"
    );
  });

  // owner can call split
  it("should allow owner to split", async () => {
    const txObj = await instance.split(bob, carol, {
      from: owner,
      value: amountWei
    });
    // status
    assert.isTrue(txObj.receipt.status, "transaction status must be true");

    // get stored balances
    const bobBalance = await instance.balanceOf.call(bob);
    const carolBalance = await instance.balanceOf.call(carol);

    // test stored balances
    // amount is bignumber, convert it to string to compare
    assert.strictEqual(bobBalance.toString(), amount1.toString());
    assert.strictEqual(carolBalance.toString(), amount1.toString());

    // check event
    const event = getEventResult(txObj, "SplitEvent");
    assert.isDefined(event, "it should emit SplitEvent");
    // owner changed

    assert.strictEqual(event.from, owner);
    // amount is bignumber, convert it to string to compare
    assert.strictEqual(event.amount.toString(), amountWei.toString());
    assert.strictEqual(event.receiver1, bob);
    assert.strictEqual(event.receiver2, carol);
  });

  it("should allow bob to withdraw", async () => {
    // initial balance
    const bobBalance = toBN(await web3.eth.getBalance(bob));
    // execute split function
    const txSplit = await instance.split(bob, carol, {
      from: owner,
      value: amountWei
    });
    // transaction status must be true
    assert.isTrue(txSplit.receipt.status, "transaction status must be true");
    // execute withdraw function
    const txObj = await instance.withdraw({
      from: bob
    });
    // get transaction gas price
    const tx = await web3.eth.getTransaction(txObj.tx);
    const gasPrice = toBN(tx.gasPrice);
    // transaction cost
    const txCost = toBN(txObj.receipt.gasUsed).mul(gasPrice);
    // transaction status must be true
    assert.isTrue(txObj.receipt.status, "transaction status must be true");

    //new balance
    const bobBalanceNew = toBN(await web3.eth.getBalance(bob));

    // calculate received amount
    const bobReceived = bobBalanceNew.add(txCost).sub(bobBalance);

    // test amount received must be correct
    assert.strictEqual(
      amount1.toString(),
      bobReceived.toString(),
      "bob should received " + amount1
    );

    // check event
    const event = getEventResult(txObj, "WithdrawEvent");
    assert.isDefined(event, "it should emit WithdrawEvent");
    // owner changed
    assert.strictEqual(event.receiver, bob);
    assert.strictEqual(event.amount.toString(), amount1.toString());
  });
});
