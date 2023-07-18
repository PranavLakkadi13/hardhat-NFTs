const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

// IT will store all the images in the images folder 
async function storeImages(ImagesFilePath) {
    // This will give the full output of the path
    const fullImagesPath = path.resolve(ImagesFilePath);
    
    // This will read the full file ouput to the path
    const files = fs.readdirSync(fullImagesPath);
    
    // This is to keep track of the responses from the pinata server 
    let responses = []
    console.log("Uploading to IPFS!!!!!!!");
    for (let fileIndex in files) {
        console.log(`Working on ${fileIndex}.....`);
        // Here it basically reads all the data of the particular image 
        // and reads the full details by taking the file path and then the file name and
        // in each iteration it goes through each file in the folder/directory
        // it then pins each particular file to ipfs and pushes the responses into the reponses array
        const readableStreamFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`);
        const options = {
            pinataMetadata: {
            name: files[fileIndex],
          },
        };
        try {
            const response = await pinata.pinFileToIPFS(readableStreamFile,options);
            responses.push(response);
        }
        catch (error) {
            console.log(error);
        }
    }

    return {responses , files }
}

async function storeTokenUriMetaData(metadata) {
    try {
        const options = {
          pinataMetadata: {
            name: metadata.name,
          },
        };
        const response = await pinata.pinJSONToIPFS(metadata, options);
        return response;
    }
    catch (error) {
        console.log(error)
    }
    return null;
}

module.exports = { storeImages, storeTokenUriMetaData };