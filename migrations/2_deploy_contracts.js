const Marketplace = artifacts.require("Marketplace");
const AgToken = artifacts.require("ERC20Basic");

module.exports = function(deployer) {
  deployer.deploy(Marketplace);
  deployer.deploy(AgToken, 10000);
};
