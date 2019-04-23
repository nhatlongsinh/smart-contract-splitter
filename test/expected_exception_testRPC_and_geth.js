"use strict";

/**
 * @param {!Function.<!Promise>} action.
 * @param {!Number | !string | !BigNumber} gasToUse.
 * @returns {!Promise} which throws unless it hit a valid error.
 * https://gist.github.com/xavierlepretre/d5583222fde52ddfbc58b7cfa0d2d0a9#file-expected_exception_testrpc_and_geth-js
 */
module.exports = function expectedExceptionPromise(action, gasToUse) {
  return new Promise(function(resolve, reject) {
    try {
      resolve(action());
    } catch (e) {
      reject(e);
    }
  })
    .then(function(txObj) {
      return typeof txObj === "string"
        ? web3.eth.getTransactionReceiptMined(txObj) // regular tx hash
        : typeof txObj.receipt !== "undefined"
        ? txObj.receipt // truffle-contract function call
        : typeof txObj.transactionHash === "string"
        ? web3.eth.getTransactionReceiptMined(txObj.transactionHash) // deployment
        : txObj; // Unknown last case
    })
    .then(
      function(receipt) {
        // We are in Geth
        if (typeof receipt.status !== "undefined") {
          // Byzantium
          assert.strictEqual(
            parseInt(receipt.status),
            0,
            "should have reverted"
          );
        } else {
          // Pre Byzantium
          assert.equal(
            receipt.gasUsed,
            gasToUse,
            "should have used all the gas"
          );
        }
      },
      function(e) {
        if (
          (e + "").indexOf("invalid JUMP") > -1 ||
          (e + "").indexOf("out of gas") > -1 ||
          (e + "").indexOf("invalid opcode") > -1 ||
          (e + "").indexOf("revert") > -1
        ) {
          // We are in TestRPC
        } else if ((e + "").indexOf("please check your gas amount") > -1) {
          // We are in Geth for a deployment
        } else {
          throw e;
        }
      }
    );
};
