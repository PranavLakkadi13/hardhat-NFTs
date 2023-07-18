const { network } = require("hardhat");
const {
  developmentChains,
  BASE_FEE,
  GAS_PRICE_LINK,
  DECIMALS,
  INITIAL_PRICE
} = require("../helper-hardhatConfig");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [BASE_FEE, GAS_PRICE_LINK];
  const arg = [DECIMALS,INITIAL_PRICE];

  if (developmentChains.includes(network.name)) {
    log("local network detected!!!!!!!!!");
    log("deploying mocks!!!");

    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      args: args,
      log: true,
    });

    await deploy("MockV3Aggregator", {
      from: deployer,
      log: true,
      args: arg,
    })

    log("Mocks deployed!!!!!");
    log("----------------------------------------");
    };
};

module.exports.tags = ["all", "mocks"];
