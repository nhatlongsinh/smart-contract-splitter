const $ = require("jquery");
const Web3 = require("web3");
const Promise = require("bluebird");
const splitterArtifact = require("../../build/contracts/Splitter.json");

const App = {
  web3: null,
  splitter: null,
  account: null,
  startApp: async function() {
    try {
      const { web3 } = this;
      // get contract instance
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = splitterArtifact.networks[networkId];
      console.log(networkId, deployedNetwork);
      this.splitter = new web3.eth.Contract(
        splitterArtifact.abi,
        deployedNetwork.address
      );
      const accounts = await web3.eth.getAccounts();
      //check if metamask locked
      if (accounts.length) {
        this.account = accounts[0];
      }
      // check metamask
      this.checkMetamaskAccount();
      // init app events
      this.addAppEvent();
    } catch (error) {
      console.error("Could not connect to contract or chain.");
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
      const { split } = this.splitter.methods;
      // test call first
      this.splitter.methods
        .split(receiver1, receiver2)
        .call({
          from: this.account,
          value: amountWei
        })
        .then(() => {
          // Ok, we move onto the real action.
          return (
            split(receiver1, receiver2)
              .send({
                from: this.account,
                value: amountWei
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
        .then(receipt => {
          console.log("got receipt", receipt);
          if (!receipt.status) {
            console.error("Wrong status");
            console.error(receipt);
            $("#splitStatus").html(
              "There was an error in the tx execution, status not 1"
            );
          } else if (receipt.events.length == 0) {
            console.error("Empty events");
            console.error(receipt);
            $("#splitStatus").html(
              "There was an error in the tx execution, missing expected event"
            );
          } else {
            console.log(receipt.events[0]);
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
    const { withdraw } = this.splitter.methods;
    // test call first
    withdraw()
      .call({
        from: this.account
      })
      .then(() => {
        // Ok, we move onto the real action.
        return (
          withdraw()
            .send({
              from: this.account
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
      .then(receipt => {
        console.log("got receipt", receipt);
        if (!receipt.status) {
          console.error("Wrong status");
          console.error(receipt);
          $("#withdrawStatus").html(
            "There was an error in the tx execution, status not 1"
          );
        } else if (receipt.events.length == 0) {
          console.error("Empty events");
          console.error(receipt);
          $("#withdrawStatus").html(
            "There was an error in the tx execution, missing expected event"
          );
        } else {
          console.log(receipt.events[0]);
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
    // hide/show UI base on metamask account
    if (this.isMetamaskLogin(this.account)) {
      this.hideAlert();
      this.enableApp(true);
      // get account splitter fund
      const { balanceOf } = this.splitter.methods;
      // get balance and update
      balanceOf(this.account)
        .call()
        .then(balance => {
          $("#txtBalance").val(this.web3.utils.fromWei(balance.toString()));
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
      console.log("YES");
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

  // Now you can start your app & access web3 freely:
  App.startApp();
});
