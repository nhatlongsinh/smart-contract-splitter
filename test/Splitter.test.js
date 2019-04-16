const MyContract = artifacts.require("./Splitter.sol");

contract("Splitter", accounts => {
  let instance;
  beforeEach(async () => {
    instance = await MyContract.deployed();
  });

  //Owned
  it("should allow owner to change owner address", async () => {
    const owner = accounts[0];
    const newOwner = accounts[3];
    try {
      await instance.changeOwner.call(newOwner, {
        from: owner
      });
    } catch (error) {
      assert.isTrue(false, "should allow owner to change owner address");
    }
  });
  it("should not allow unauthorized address to change owner address", async () => {
    const owner = accounts[0];
    const newOwner = accounts[3];
    const unauthorized = accounts[4];
    try {
      await instance.changeOwner.call(newOwner, {
        from: unauthorized
      });
    } catch (error) {
      assert.isTrue(true);
      return;
    }
    assert.isTrue(
      false,
      "should not allow unauthorized address to change ownership"
    );
  });

  //Pausable
  it("should allow to switch pausable", async () => {
    const owner = accounts[0];
    try {
      await instance.switchRunning.call(false, {
        from: owner
      });
    } catch (error) {
      assert.isTrue(false, "should allow owner to switch pausable");
    }
  });
  it("should not allow unauthorized address to switch pausable", async () => {
    const owner = accounts[0];
    const unauthorized = accounts[4];
    try {
      await instance.switchRunning.call(false, {
        from: unauthorized
      });
    } catch (error) {
      assert.isTrue(true);
      return;
    }
    assert.isTrue(
      false,
      "should not allow unauthorized address to switch pausable"
    );
  });

  //Splitter

  it("should allow owner to split", async () => {
    const owner = accounts[0];
    try {
      await instance.split.call({
        from: owner,
        value: 2
      });
    } catch (error) {
      assert.isTrue(false, "should allow owner to split");
    }
  });
  it("should not allow unauthorized address to split", async () => {
    const unauthorized = accounts[1];
    try {
      await instance.split.call({
        from: unauthorized,
        value: 2
      });
    } catch (error) {
      assert.isTrue(true);
      return;
    }
    assert.isTrue(false, "should not allow unauthorized address to split");
  });
  it("should not allow zero transaction to split", async () => {
    const unauthorized = accounts[0];
    try {
      await instance.split.call({
        from: unauthorized,
        value: 0
      });
    } catch (error) {
      assert.isTrue(true);
      return;
    }
    assert.isTrue(false, "should not allow zero transaction to split");
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
    const amount = 1300000000;
    const amountBob = parseInt(amount / 2);
    const amountCarol = amount - amountBob;
    try {
      const txObj = await instance.split({
        from: owner,
        value: amount
      });
      console.log(txObj);
    } catch (error) {
      assert.isTrue(false, "error: " + error.message);
      return;
    }
    //new balance
    const bobBalanceNew = await web3.eth.getBalance(bob);
    const carolBalanceNew = await web3.eth.getBalance(carol);
    //test
    const bobReceived = bobBalanceNew - bobBalance;
    const carolReceived = carolBalanceNew - carolBalance;
    assert.equal(amountBob, bobReceived, "bob should received " + amountBob);
    assert.equal(
      amountCarol,
      carolReceived,
      "carol should received " + amountCarol
    );
    assert.equal(bobReceived + carolReceived, amount),
      "amount received should be " + amount;
  });
});
