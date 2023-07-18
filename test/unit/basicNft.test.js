const { expect, assert } = require("chai");
const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhatConfig");


if (developmentChains.includes(network.name)) {
    describe("BasicNft contract", () => {
        let basicnft;
        let deployer;
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["Basicnft"]);
            basicnft = await ethers.getContract("BasicNft");
        });
        describe("Constructor test", () => {
            it("It checks the name and symbol", async () => {
                const tokenCounter = await basicnft.getTokenCounter();
                const name = await basicnft.name();
                const symbol = await basicnft.symbol();
                assert.equal(name, "Dogie");
                assert.equal(symbol.toString(), "DOG");
                assert.equal(tokenCounter.toString(), "0");
            });
        });
        describe("function tests", () => {
            it("checks the token URI function function", async () => {
                const tokenURI = await basicnft.tokenURI("0x0");
                const token = "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json";
                assert.equal(tokenURI.toString(), token);
            });
            it("checks the mint function", async () => {
                await basicnft.mintNft();
                const tokenCounter = await basicnft.getTokenCounter();
                const OwnersMapping = await basicnft.ownerOf("0");
                const BalancesMapping = await basicnft.balanceOf(deployer);
                assert.equal(tokenCounter.toString(), "1");
                assert.equal(OwnersMapping.toString(), deployer);
                assert.equal(BalancesMapping.toString(), "1");
            });
            it("mints the nfts for different users", async () => {
                accounts = await ethers.getSigners();
                let acc1 = await basicnft.connect(accounts[1]);
                let acc2 = await basicnft.connect(accounts[2]);
                let acc3 = await basicnft.connect(accounts[3]);
                await acc1.mintNft();
                await acc2.mintNft();
                await acc3.mintNft();
                await acc1.mintNft();
                const tokenCounter = await basicnft.getTokenCounter();
                const OwnersMapping = await basicnft.ownerOf("2");  
                const BalancesMapping = await basicnft.balanceOf(accounts[1].address);
                assert.equal(tokenCounter.toString(), "4");
                assert.equal(OwnersMapping.toString(), accounts[3].address);
                assert.equal(BalancesMapping.toString(), "2");
            });
        })
  
    });
}
