const { assert, expect } = require("chai");
const { developmentChains, networkConfig } = require("../../helper-hardhatConfig");
const { getNamedAccounts, deployments, network, ethers } = require("hardhat");

!developmentChains.includes(network.name) ? describe.skip
    : describe("Random ipfs contract", () => {
        let randomIpfsNft;
        let VRFCoordinatorV2Mock;
        let vrfCoordinatorV2address;
        let deployer;
        let mintfee;
        let chainId;
        let tokenURIs = [
            "ipfs://QmabbNPMsGs5psHHcRAd7aMq8GofcKqifJotmdAjY3jgV8",
            "ipfs://QmWMEsaRunhaw6gC4KV25y4J8qc5rXMELVomhjAVLwDkdd",
            "ipfs://QmYhUYzTfki42EWEjCSFJBvH1H6xNEGmukn6rNVbpK7B1Q",
        ];
        beforeEach(async () => {
            chainId = network.config.chainId;
            await deployments.fixture(["all"]);
            deployer = (await getNamedAccounts()).deployer;
            randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
            VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            vrfCoordinatorV2address = VRFCoordinatorV2Mock.address;
            mintfee = networkConfig[chainId]["mintFee"];
        });
        describe("Constructor", () => {
            it("Check the VRF address", async () => {
                expect((await randomIpfsNft.getVRFCoordinatorAddress()).toString()).equal(vrfCoordinatorV2address);
            });
            it("check the ipfs hashes", async () => {
                assert.equal(await randomIpfsNft.getDogTokenUris(1), tokenURIs[1]);
            })
        });
        describe("It checks the request nft function ", () => {
            it("Checks if the nfts are minted only if the mint fee is payed", async () => {
                await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                    "RandomIpfsNft__NotEnoughEthSent"
                );
            });
            it("allows the user to mint the nft since mint amount reached", async () => {
                let value = ethers.utils.parseEther("0.1");
                assert(await randomIpfsNft.requestNft({ value: value }));
            });
            it("it checks the emmited event and a requestId", async () => {
                let value = ethers.utils.parseEther("0.1");
                let tx = await randomIpfsNft.requestNft({ value: value });
                const txReceipt = await tx.wait(1);
                const requestId = await txReceipt.events[1].args.requestId;
                assert(requestId == 1);
                await expect(randomIpfsNft.requestNft({ value: value })).to.emit(
                    randomIpfsNft,
                    "NftRequested"
                );
            });
            it("checks the requestId mapping whic sets the address to the particular requestId", async () => {
                let value = ethers.utils.parseEther("0.1");
                let tx = await randomIpfsNft.requestNft({ value: value });
                const txReceipt = await tx.wait(1);
                const requestId = await txReceipt.events[1].args.requestId;
                assert.equal((await randomIpfsNft.s_requestIdToSender(requestId)).toString(), deployer);
            });
        });
        describe("It checks the fullfillrandomwords function", () => {
            it("It tests the code for the fullfillRandomWords", async () => {
                let value = ethers.utils.parseEther("0.1");
                let tx = await randomIpfsNft.requestNft({ value: value });
                const txReceipt = await tx.wait(1);
                const requestId = await txReceipt.events[1].args.requestId;
                assert(VRFCoordinatorV2Mock.fulfillRandomWords(
                    requestId,
                    randomIpfsNft.address
                ));
            });
            it("updates the tokenId", async () => {
                let value = ethers.utils.parseEther("0.1");
                let tx = await randomIpfsNft.requestNft({ value: value });
                const txReceipt = await tx.wait(1);
                const requestId = await txReceipt.events[1].args.requestId;
                await VRFCoordinatorV2Mock.fulfillRandomWords(
                    requestId,
                    randomIpfsNft.address
                );
                assert.equal((await randomIpfsNft.getTokenCounter()).toString(), "1");
                assert.equal((await randomIpfsNft.balanceOf(deployer)).toString(), "1");
            });
            it("mints NFT after random number is returned", async function () {
                await new Promise(async (resolve, reject) => {
                    randomIpfsNft.once("NftMinted", async () => {
                        try {
                            const tokenUri = await randomIpfsNft.getDogTokenUris(0);
                            const tokenCounter = await randomIpfsNft.getTokenCounter();
                            assert.equal(tokenUri.toString().includes("ipfs://"), true);
                            assert.equal(tokenCounter.toString(), "1");
                            resolve();
                        } catch (e) {
                            console.log(e);
                            reject(e);
                        }
                    });
                    try {
                        const fee = await randomIpfsNft.getMintFee();
                        const requestNftResponse = await randomIpfsNft.requestNft({
                            value: fee.toString(),
                        });
                        const requestNftReceipt = await requestNftResponse.wait(1);
                        await VRFCoordinatorV2Mock.fulfillRandomWords(
                            requestNftReceipt.events[1].args.requestId,
                            randomIpfsNft.address
                        );
                    } catch (e) {
                        console.log(e);
                        reject(e);
                    }
                });
            });
        });
        describe("Test the withdraw function", () => {
            it("Makes sure only the owner can withdraw", async () => {
                const accounts = await ethers.getSigners();
                let x = randomIpfsNft.connect(accounts[1]);
                let value = ethers.utils.parseEther("0.1");
                let tx = await x.requestNft({ value: value });
                const txReceipt = await tx.wait(1);
                const requestId = await txReceipt.events[1].args.requestId;
                await VRFCoordinatorV2Mock.fulfillRandomWords(
                    requestId,
                    randomIpfsNft.address
                );
                await expect(x.withdraw()).to.be.reverted;
            });
            it("transfer will pass even if no one minted an NFT", async () => {
                assert(await randomIpfsNft.withdraw());
            });
            it("successfull transfer", async () => {
                const accounts = await ethers.getSigners();
                let x = randomIpfsNft.connect(accounts[1]);
                let value = ethers.utils.parseEther("0.1");
                let tx = await x.requestNft({ value: value });
                const txReceipt = await tx.wait(1);
                const requestId = await txReceipt.events[1].args.requestId;
                await VRFCoordinatorV2Mock.fulfillRandomWords(
                    requestId,
                    randomIpfsNft.address
                );
                assert(await randomIpfsNft.withdraw());
            });
        });
        describe("It is to test the getModdedValue function", () => {
            it("Check the breed minted", async () => {
                let x = await randomIpfsNft.getBreedFromModdedValue(11);
                assert(x, 1);
            });
            it("reverts when the value entered is out of Bounds ", async () => {
                await expect(
                    randomIpfsNft.getBreedFromModdedValue(100)
                ).to.be.revertedWith("");
            });
        });
    });