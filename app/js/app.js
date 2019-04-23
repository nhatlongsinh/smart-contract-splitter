const $ = require("jquery");
const Web3 = require("web3");
const splitterArtifact = require("../../build/contracts/Splitter.json");
const truffleContract = require("truffle-contract");

// gas max
const maxGas = 3000000;

const App = {
  web3: null,
  splitter: null,
  account: null,
  currentProvider: null,
  startApp: async function() {
    try {
      const { web3 } = this;
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const SplitterContract = truffleContract(splitterArtifact);
      SplitterContract.setProvider(this.currentProvider);

      this.splitter = await SplitterContract.deployed();
      console.log(networkId, this.splitter);
      // console.log(networkId, SplitterContract);
      // const deployedNetwork = splitterArtifact.networks[networkId];
      // console.log(networkId, deployedNetwork);
      // this.splitter = new web3.eth.Contract(
      //   splitterArtifact.abi,
      //   deployedNetwork.address
      // );
      const accounts = await web3.eth.getAccounts();
      //check if metamask locked
      if (accounts.length > 0) {
        this.account = accounts[0];
      }
      // check metamask
      this.checkMetamaskAccount();
      // init app events
      this.addAppEvent();
    } catch (error) {
      console.error("Could not connect to contract or chain. " + error);
    }
  },
  submitSplit: function() {
    const { web3, displayAlert, hideAlert, enableApp } = this;
    hideAlert();
    // get data
    const amount = $("#txtAmount").val();
    const receiver1 = $("#txtReceiver1").val();
    const receiver2 = $("#txtReceiver2").val();
    // validate form
    const validateErrors = [];
    if (amount <= 0) {
      validateErrors.push("amount must be greater than zero");
    }
    if (!web3.utils.isAddress(receiver1)) {
      validateErrors.push("receiver 1 invalid");
    }
    if (!web3.utils.isAddress(receiver2)) {
      validateErrors.push("receiver 2 invalid");
    }
    // check
    if (validateErrors.length > 0) {
      displayAlert(validateErrors.join(". "), "alert-danger");
      enableApp(true);
    } else {
      const amountWei = web3.utils.toWei(amount);
      const { split } = this.splitter;
      // test call first
      split
        .call(receiver1, receiver2, {
          from: this.account,
          value: amountWei
        })
        .then(() => {
          // Ok, we move onto the real action.
          return (
            split(receiver1, receiver2, {
              from: this.account,
              value: amountWei,
              gas: maxGas
            })
              // .split takes time in real life, so we get the txHash immediately while it
              // is mined.
              .on("transactionHash", txHash =>
                $("#splitStatus").html("Transaction on the way " + txHash)
              )
              .on("confirmation", (confirmationNumber, receipt) => {
                $("#splitStatus").html(confirmationNumber + " confirmation(s)");
              })
          );
        })
        // tx mined
        .then(txObj => {
          const receipt = txObj.receipt;
          console.log("got receipt", receipt);
          if (!receipt.status) {
            console.error("Wrong status");
            console.error(receipt);
            $("#splitStatus").html(
              "There was an error in the tx execution, status not 1"
            );
          } else if (receipt.logs.length == 0) {
            console.error("Empty events");
            console.error(receipt);
            $("#splitStatus").html(
              "There was an error in the tx execution, missing expected event"
            );
          } else {
            console.log(receipt.logs[0]);
            $("#splitStatus").html("Transfer executed");
          }
        })
        .catch(e => {
          displayAlert(e.toString(), "alert-danger");
        });
    }
  },
  withdrawFund: function() {
    const { web3, displayAlert, hideAlert } = this;
    hideAlert();
    const { withdraw } = this.splitter;
    // test call first
    withdraw
      .call({
        from: this.account
      })
      .then(() => {
        // Ok, we move onto the real action.
        return (
          withdraw({
            from: this.account,
            gas: maxGas
          })
            // .withdraw takes time in real life, so we get the txHash immediately while it
            // is mined.
            .on("transactionHash", txHash => {
              $("#withdrawStatus").html("Transaction on the way " + txHash);
              $("#txtBalance").val(0);
            })
            .on("confirmation", (confirmationNumber, receipt) => {
              $("#withdrawStatus").html(
                confirmationNumber + " confirmation(s)"
              );
            })
        );
      })
      // tx mined
      .then(txObj => {
        const receipt = txObj.receipt;
        console.log("got receipt", receipt);
        if (!receipt.status) {
          console.error("Wrong status");
          console.error(receipt);
          $("#withdrawStatus").html(
            "There was an error in the tx execution, status not 1"
          );
        } else if (receipt.logs.length == 0) {
          console.error("Empty events");
          console.error(receipt);
          $("#withdrawStatus").html(
            "There was an error in the tx execution, missing expected event"
          );
        } else {
          console.log(receipt.logs[0]);
          $("#withdrawStatus").html("Transfer executed");
        }
      })
      .catch(e => {
        displayAlert(e.toString(), "alert-danger");
      });
  },
  displayAlert: function(message, className) {
    $("#alertContainer")
      .removeClass()
      .html(message)
      .show()
      .addClass(["alert", className]);
  },
  hideAlert: function() {
    $("#alertContainer").hide();
  },
  enableApp: function(enabled) {
    $("#btnSplit").prop("disabled", !enabled);
    $("#btnWithdraw").prop("disabled", !enabled);
  },
  isMetamaskLogin: function() {
    return this.web3.utils.isAddress(this.account);
  },
  checkMetamaskAccount: function() {
    $("#txtAddress").val(this.account || "");
    // hide/show UI base on metamask account
    if (this.isMetamaskLogin()) {
      this.hideAlert();
      this.enableApp(true);
      // get account splitter fund
      const { balanceOf } = this.splitter;
      // get balance and update
      balanceOf.call(this.account).then(balance => {
        $("#txtBalance").val(this.web3.utils.fromWei(balance.toString()));
        // hide/show btn
        if (balance > 0) {
          $("#btnWithdraw").prop("disabled", false);
        } else {
          $("#btnWithdraw").prop("disabled", true);
        }
      });
    } else {
      this.enableApp(false);
      this.displayAlert(
        "Please login to metamask to start using",
        "alert-warning"
      );
    }
  },
  addAppEvent: function() {
    // split submit event
    $("#btnSplit").on("click", function() {
      App.submitSplit();
    });

    // withdraw submit event
    $("#btnWithdraw").on("click", function() {
      App.withdrawFund();
    });

    // metamask account change event
    window.ethereum.on("accountsChanged", function(accounts) {
      App.account = accounts[0];
      App.checkMetamaskAccount();
    });
  }
};
window.App = App;

// load event
window.addEventListener("load", () => {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof window.web3 !== "undefined") {
    // Use Mist/MetaMask's provider
    App.web3 = new Web3(window.web3.currentProvider);
  } else {
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    App.web3 = new Web3(
      new Web3.providers.HttpProvider("http://localhost:7545")
    );
  }
  App.currentProvider = web3.currentProvider;

  // const SplitterContract = truffleContract(splitterArtifact);
  // SplitterContract.setProvider(web3.currentProvider);
  // SplitterContract.deployed()
  //   .then(deployed => console.log(deployed))
  //   .catch(console.error);
  // Now you can start your app & access web3 freely:
  App.startApp();
});
