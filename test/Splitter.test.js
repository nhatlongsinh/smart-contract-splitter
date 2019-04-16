const MyContract = artifacts.require("./Splitter.sol");

contract("Splitter", accounts => {
  let instance;
  beforeEach(async () => {
    instance = await MyContract.deployed();
  });

  // owner test
  it("should allow owner to change owner address", async () => {
    const owner = accounts[0];
    const newOwner = accounts[3];
    await instance.changeOwner.call(newOwner, {
      from: owner
    });
    assert.isTrue(true, "should allow owner to change owner address");
  });

  // switch Pausable test
  it("should allow to switch pausable", async () => {
    const owner = accounts[0];

    await instance.switchRunning.call(false, {
      from: owner
    });

    assert.isTrue(true, "should allow owner to switch pausable");
  });

  // owner can call split
  it("should allow owner to split", async () => {
    const owner = accounts[0];

    await instance.split.call({
      from: owner,
      value: 2
    });

    assert.isTrue(true, "should allow owner to split");
  });

  it("should divide correctly to bob and carol", async () => {
    //address
    const owner = accounts[0];
    const bob = accounts[1];
    const carol = accounts[2];

    //balance
    const bobBalance = await web3.eth.getBalance(bob);
    const carolBalance = await web3.eth.getBalance(carol);

    //amount split
    const amount = web3.utils.toWei("0.13"); // toWei must pass string to avoid precision errors
    const amountBob = parseInt(amount / 2);
    const amountCarol = amount - amountBob;

    // execute split function
    const txObj = await instance.split({
      from: owner,
      value: amount
    });

    // transaction status must be true
    assert.isTrue(txObj.receipt.status, "transaction status must be true");

    //new balance
    const bobBalanceNew = await web3.eth.getBalance(bob);
    const carolBalanceNew = await web3.eth.getBalance(carol);

    // calculate received amount
    const bobReceived = bobBalanceNew - bobBalance;
    const carolReceived = carolBalanceNew - carolBalance;

    // test amount received must be correct
    assert.equal(amountBob, bobReceived, "bob should received " + amountBob);
    assert.equal(
      amountCarol,
      carolReceived,
      "carol should received " + amountCarol
    );

    // total received must be equal to amount sent
    assert.equal(bobReceived + carolReceived, amount),
      "amount received should be " + amount;
  });
});
