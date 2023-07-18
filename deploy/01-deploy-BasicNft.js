const { getNamedAccounts, deployments, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhatConfig");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    let deployer = (await getNamedAccounts()).deployer;
    const { deploy, log} = deployments;

    log("---------------------------------------------");
    const args = [];
    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations : network.config.blockConfirmations || 1
    })

    log("deployed contract!!!.. ");

    if (
      !developmentChains.includes(network.name) &&
      process.env.Etherscan_API_KEY
    ) {
        log("Verifying the contract....");
        await verify(basicNft.address, args);
        log("---------------------------------------------");
    }
}

module.exports.tags = ["Basicnft", "main", "all"];