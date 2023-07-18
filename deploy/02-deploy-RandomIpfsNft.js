const { getNamedAccounts, deployments, network, ethers } = require("hardhat");
const { developmentChains,networkConfig } = require("../helper-hardhatConfig");
const { verify } = require("../utils/verify");
const { storeImages, storeTokenUriMetaData } = require("../utils/UploadToPinata");

const imagesLocation = "./images/Random/";
const FUND_AMOUNT = ethers.utils.parseEther("2");

const metaDataTemplate = {
    name: "",
    description: "",
    image: "",
    // Here we can try to store the attributes on chain so that we can interact with them 
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100
        }
    ]
}

let tokenURIs = [
  "ipfs://QmabbNPMsGs5psHHcRAd7aMq8GofcKqifJotmdAjY3jgV8",
  "ipfs://QmWMEsaRunhaw6gC4KV25y4J8qc5rXMELVomhjAVLwDkdd",
  "ipfs://QmYhUYzTfki42EWEjCSFJBvH1H6xNEGmukn6rNVbpK7B1Q",
];

module.exports = async ({ getNamedAccounts, deployments }) => {
    let deployer = (await getNamedAccounts()).deployer;
    const { deploy, log } = deployments;
    const chainId = network.config.chainId;

    let vrfCoordinatorV2address, subscriptionId, VRFCoordinatorV2Mock;

    // Get the ipfs hashes of the images 
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenURIs = await handleTokenUris();
    }


    if (chainId == 31337) {
        VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2address = VRFCoordinatorV2Mock.address;
        const tx = await VRFCoordinatorV2Mock.createSubscription();
        const txReceipt = await tx.wait(1);
        subscriptionId = txReceipt.events[0].args.subId;
        await VRFCoordinatorV2Mock.fundSubscription(subscriptionId,FUND_AMOUNT);
    }
    else {
        vrfCoordinatorV2address = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    log("--------------------------------------------------------");
    
    const arg = [
      vrfCoordinatorV2address,
      subscriptionId,
      networkConfig[chainId]["gasLane"],
      networkConfig[chainId]["callbackGasLimit"],
      tokenURIs,
      networkConfig[chainId]["mintFee"],
    ];

    const randomIpfsNft = await deploy("RandomIpfsNft", {
      from: deployer,
      args: arg,
      log: true,
      waitConfirmations: network.config.blockConfirmations || 1,
    });
    log("--------------------------------------------------------");

    if (chainId == 31337) {
      await VRFCoordinatorV2Mock.addConsumer(
        subscriptionId,
        randomIpfsNft.address
      );
    }

    if (!developmentChains.includes(network.name) && process.env.Etherscan_API_KEY) {
        log("Verifying......");
        await verify(randomIpfsNft.address, arg);

    }
    log("--------------------------------------------------------");
}

// This is going return a array of token URIs that we can uploafd to the smart contract 
async function handleTokenUris() {
    tokenURIs = [];
    // Store the image in IPFS 
    // STore the metadata in IPFs 
    const { responses: ImageUploadResponses, files } = await storeImages(imagesLocation);
    
    
    // Now we have the image hashes now we will create the metadata 
    for (let ImageUploadResponsesIndex in ImageUploadResponses) {
        // create MetaData 
        // Upload the Metadata
        let tokenUriMetaData = { ...metaDataTemplate };
        tokenUriMetaData.name = files[ImageUploadResponsesIndex].replace(".png","");
        tokenUriMetaData.description = `an Adorable ${tokenUriMetaData.name} pup!!`;
        tokenUriMetaData.image = `ipfs://${ImageUploadResponses[ImageUploadResponsesIndex].IpfsHash}`;
        console.log(`Uploading the metaData of ${tokenUriMetaData.name}.....`);
        
        // store the JSON to IPFS 
        const metadataUploadResponse = await storeTokenUriMetaData(tokenUriMetaData);
        tokenURIs.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
    }
        console.log("TokenURIs uploaded, They Are ....");
        console.log(tokenURIs);
    
    return tokenURIs;
}

module.exports.tags = ["RandomIpfsNFT", "all", "main"];