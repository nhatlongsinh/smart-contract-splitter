const Splitter = artifacts.require("./Splitter.sol");
var Migrations = artifacts.require("./Migrations.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Migrations);
  deployer.deploy(Splitter);
};
