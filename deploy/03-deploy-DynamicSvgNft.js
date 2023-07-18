const { developmentChains, networkConfig } = require("../helper-hardhatConfig");
const { verify } = require("../utils/verify");
const { ethers, network } = require("hardhat");
const fs = require("fs");


module.exports = async ({ getNamedAccounts, deployments }) => {
  let deployer = (await getNamedAccounts()).deployer;
  const { deploy, log } = deployments;
  const chainId = network.config.chainId;

  let ethUsdpriceFeedAddress;

  if (developmentChains.includes(network.name)) {
    const ETHUSDAGGREGATOR = await ethers.getContract("MockV3Aggregator");
    ethUsdpriceFeedAddress = ETHUSDAGGREGATOR.address;
  }
  else {
    ethUsdpriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }

  log("------------------------------------------------");

  const lowSVG = fs.readFileSync("./images/Dynamic/frown.svg", { encoding: "utf8" });
  const highSVG = fs.readFileSync("./images/Dynamic/happy.svg", { encoding: "utf8" });

  const args = [ethUsdpriceFeedAddress, lowSVG, highSVG];

  const dynamicNFT = await deploy("DynamicSvgNft", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.Etherscan_API_KEY
  ) {
    log("Verifying......");
    await verify(dynamicNFT.address, args);
  }
  log("--------------------------------------------------------");

};

module.exports.tags = ["Dynamic","all","main"];
