const MyContract = artifacts.require("./Splitter.sol");

contract("Splitter", accounts => {
  // prepare mock data
  // contract
  let instance;
  // addresses
  const owner = accounts[0];
  const bob = accounts[1];
  const carol = accounts[2];
  const newAddress = accounts[3];
  //const carolBalance = await web3.eth.getBalance(carol);
  // split amount
  const amountEther = "0.2";
  const amountWei = web3.utils.toWei(amountEther);
  const amount1 = amountWei / 2;
  const amount2 = amountWei - amount1;

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
    instance = await MyContract.new({ from: owner });
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
    assert.notEqual(event, undefined, "it should emit ChangeOwnerEvent");
    // owner changed
    assert.equal(event.newOwner, newAddress, "it should change owner");
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
    assert.notEqual(event, undefined, "it should emit SwitchRunningEvent");
    // running changed
    assert.equal(event.newValue, false, "it should change pausable to false");
  });

  // owner can call split
  it("should allow owner to split", async () => {
    const txObj = await instance.split(bob, carol, {
      from: owner,
      value: amountWei
    });
    // status
    assert.isTrue(txObj.receipt.status, "transaction status must be true");
    // check event
    const event = getEventResult(txObj, "SplitEvent");
    assert.notEqual(event, undefined, "it should emit SplitEvent");
    // owner changed
    assert.equal(event.from, owner);
    assert.equal(event.receiver1, bob);
    assert.equal(event.receiver2, carol);
  });

  it("should allow bob to withdraw", async () => {
    // initial balance
    const bobBalance = await web3.eth.getBalance(bob);
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
    // transaction status must be true
    assert.isTrue(txObj.receipt.status, "transaction status must be true");

    //new balance
    const bobBalanceNew = await web3.eth.getBalance(bob);

    // calculate received amount
    const bobReceived = bobBalanceNew - bobBalance;

    // test amount received must be correct
    assert.equal(amount1, bobReceived, "bob should received " + amount1);

    // check event
    const event = getEventResult(txObj, "WithdrawEvent");
    assert.notEqual(event, undefined, "it should emit WithdrawEvent");
    // owner changed
    assert.equal(event.receiver, bob);
    assert.equal(event.amount, amount1);
  });
});
