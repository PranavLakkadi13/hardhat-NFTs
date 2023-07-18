// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.7;

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NotEnoughEthSent();
error RandomIpfsNft__TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable{
    /*
     * When we mint an nft, We will make a chainlink VRF call giving us a random number
     * Using that number we will get a random nft 
     * Pug, Shiba Inu, St.Bernard
     * Pug super rare
     * Shiba Inu kinda Rare 
     * St Bernard very common 
     
     * Users will have to pay to mint the NFT
     * The Owner of the contract can withdraw ETH 
    */

    // Type ENUM 
    enum Breed {
        PUG,
        Shiba_Inu,
        St_Bernard
    }    

    // Chainlink VRF variables  
    VRFCoordinatorV2Interface private immutable i_vrfCoordinatorV2;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gaslane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Contract Variables 
    mapping(uint256 => address) public s_requestIdToSender;
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenUris;
    uint256 internal immutable i_mintFee;

    // Events 
    event NftRequested(uint256 indexed requestId, address indexed requester);
    event NftMinted(Breed indexed dogBreed, address indexed minter);

   constructor(
    address vrfCoordinatorV2,
    uint64 subscriptionID,
    bytes32 gaslane,
    uint32 callbackgaslimit,
    string[3] memory dogTokenUris,
    uint256 mintfee) 
    VRFConsumerBaseV2(vrfCoordinatorV2)
    ERC721("Random IPFS NFT", "RIN") {
    i_vrfCoordinatorV2 = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_subscriptionId = subscriptionID;
    i_gaslane = gaslane;
    i_callbackGasLimit = callbackgaslimit;
    s_tokenCounter = 0;
    s_dogTokenUris = dogTokenUris;
    i_mintFee = mintfee;
   }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomIpfsNft__NotEnoughEthSent();
        }
        requestId = i_vrfCoordinatorV2.requestRandomWords(i_gaslane, i_subscriptionId, REQUEST_CONFIRMATIONS, i_callbackGasLimit, NUM_WORDS);
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId,msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address dogOwner = s_requestIdToSender[requestId];
        uint256 newtokenId = s_tokenCounter;
        
        // Get the random Value and assigning to the nft to be minted 
        uint256 moddedValue = randomWords[0] % MAX_CHANCE_VALUE;
        // Here we are using the maxchance value to get the probability of the type of nft 
        // Based on which we will get to know which nft will be minted 
        // Example look at the below function we have the array of the possiblilites of getting a nft
        // if the modded Value is between 1 - 10 --> PUG
        // if modded Value is between 10-30 --> Shiba INU 
        // if the modded value is > 30 the St.Bernard 

        Breed dogbreed = getBreedFromModdedValue(moddedValue);
        unchecked {
            s_tokenCounter = s_tokenCounter + 1;
        } 
        _safeMint(dogOwner, newtokenId);
        _setTokenURI(newtokenId, s_dogTokenUris[uint256(dogbreed)]);

        emit NftMinted(dogbreed, msg.sender);
    }

    function withdraw() public onlyOwner() {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomIpfsNft__TransferFailed();
        }
    }

    function getBreedFromModdedValue(uint256 moddedValue) public pure returns(Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        uint256 chanceArraylength = chanceArray.length; 
        for (uint i = 0; i < chanceArraylength; i++) {
            if (moddedValue >= cumulativeSum && moddedValue < cumulativeSum + chanceArray[i]) {
                return Breed(i);
            }
            unchecked {
                cumulativeSum = cumulativeSum + chanceArray[i];
            }
           }
        // if (moddedValue < 10) {
        //     return Breed(0);
        // }
        // else if (moddedValue >= 10 && moddedValue < 30) {
        //     return Breed(1);
        // }
        // else if (moddedValue >= 30 && moddedValue < 100) {
        //     return Breed(2);
        // }
        
        revert RandomIpfsNft__RangeOutOfBounds();
    }

    function getChanceArray() public pure returns(uint256[3] memory) {
        return [10,30,MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns(uint256){
        return i_mintFee;
    }

    function getDogTokenUris(uint256 index) public view returns(string memory) {
        return s_dogTokenUris[index];
    }

    function getTokenCounter() public view returns(uint256) {
        return s_tokenCounter;
    }

    function getVRFCoordinatorAddress() public view returns(VRFCoordinatorV2Interface) {
        return i_vrfCoordinatorV2;
    }
}