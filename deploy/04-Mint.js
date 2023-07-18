// This file makes sure we mint a nft from each of the above contract 

const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhatConfig");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts();
    const { log } = deployments;

    // Mint Basic Nft
    const BasicNFT = await ethers.getContract("BasicNft", deployer);
    const basicMintTx = await BasicNFT.mintNft();
    await basicMintTx.wait(1);
    console.log(
        `Basic Nft at inex 0 has token URI ${await BasicNFT.tokenURI(0)}`
    );
    log("----------------------------------------");
    log("----------------------------------------");

    // Random ipfs NFT
    const randomipfsNFT = await ethers.getContract("RandomIpfsNft", deployer);
    const mintfee = await randomipfsNFT.getMintFee();
    const RandomIpfsNftMintTx = await randomipfsNFT.requestNft({
        value: mintfee.toString(),
    });
    const RandomIpfsNftMintTxReceipt = await RandomIpfsNftMintTx.wait(1);

    await new Promise(async (resolve, reject) => {
        setTimeout(() => reject("Timeout: 'NFTMinted' event did not fire"), 300000); // 5 minutes
        randomipfsNFT.once("NftMinted", async () => {
            console.log(
                `Random IPFS NFT index 0 tokenURI ${await randomipfsNFT.tokenURI(0)}`
            );
            log("----------------------------------------");
            log("----------------------------------------");
            resolve();
        });
        if (developmentChains.includes(network.name)) {
            const requestId =
                await RandomIpfsNftMintTxReceipt.events[1].args.requestId.toString();
            const vrfcoordinatorV2mock = await ethers.getContract(
                "VRFCoordinatorV2Mock",
                deployer
            );
            await vrfcoordinatorV2mock.fulfillRandomWords(
                requestId,
                randomipfsNFT.address
            );
        }
        log("----------------------------------------");
        log("----------------------------------------");
    });

    // Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("6000");
    const DynamicSVGNFT = await ethers.getContract("DynamicSvgNft", deployer);
    const dynamicSVGNFTMinttx = await DynamicSVGNFT.mintNft(highValue);
    await dynamicSVGNFTMinttx.wait(1);
    console.log(
        `Dynamic SVG NFT token URI index 0: ${await DynamicSVGNFT.tokenURI(0)}`
    );
    log("----------------------------------------");
        log("----------------------------------------");
};

module.exports.tags = ["all", "mint"];
