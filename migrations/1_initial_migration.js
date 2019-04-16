const Splitter = artifacts.require("./Splitter.sol");
var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network, accounts) {
  const bob = accounts[1];
  const carol = accounts[2];
  deployer.deploy(Migrations);
  deployer.deploy(Splitter, bob, carol);
};
