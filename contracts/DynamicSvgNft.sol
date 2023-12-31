// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

error DynamicSvgNft__InvalidTokenURI();

contract DynamicSvgNft is ERC721 {
    /**
     * Basic Overview:
     * Mint function 
     * STore our SVG data 
     * Some logic to show X image : Show Y Image
     */

    uint256 private s_tokenCounter;
    string private  i_lowImageURI;
    string private  i_highImageURI;
    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";
    AggregatorV3Interface internal immutable i_pricefeedAddress;
    mapping(uint256 => int256) public s_tokenIdtoHighValue;

    event CreatedNft(uint256 indexed tokenId, int256 indexed HighValue);

    constructor(address priceFeed,string memory lowSVG, string memory highSVG) ERC721("Dynamic SVG Nft", "DSN") {
        i_pricefeedAddress = AggregatorV3Interface(priceFeed);
        i_lowImageURI = SVGtoImageURI(lowSVG);
        i_highImageURI = SVGtoImageURI(highSVG);
        s_tokenCounter = 0;
    }

    // Since SVG is basicaly in code form it cant be of much use directly 
    // Therefore we can convert it into Base64 form (the image data) and then use it 
    function SVGtoImageURI(string memory svg) public pure returns (string memory) {
        string memory svgBase64Encoded = Base64.encode((abi.encodePacked(svg)));
        return string(abi.encodePacked(base64EncodedSvgPrefix,svgBase64Encoded));
    }

    // Here we are giving the user the value they are willing to pay for the nft(not actually pay)
    function mintNft(int256 highValue) public {
        s_tokenIdtoHighValue[s_tokenCounter] = highValue;
        _safeMint(msg.sender, s_tokenCounter);
        emit CreatedNft(s_tokenCounter, highValue);
        unchecked {
            s_tokenCounter = s_tokenCounter + 1;
        }
    }

    function _baseURI() internal pure override returns(string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)){
            revert DynamicSvgNft__InvalidTokenURI();
        }
        (, int256 price, , , ) = i_pricefeedAddress.latestRoundData();
        string memory imageURI = i_lowImageURI;
        if (price >= s_tokenIdtoHighValue[tokenId]) {
            imageURI = i_highImageURI;
        }
        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                '", "description":"An NFT that changes based on the Chainlink Feed", ',
                                '"attributes": [{"trait_type": "coolness", "value": 100}], "image":"',
                                imageURI,
                                '"}'
                        )
                    )
                )
            );
    }

    function getPrice() public view returns (int256) {
        (, int256 price, , , ) = i_pricefeedAddress.latestRoundData();
        return price;
    }

    function getTokenCounter() public view returns(uint256) {
        return s_tokenCounter;
    }

    function getLowImageURI() public view returns(string memory) {
        return i_lowImageURI;
    }

    function getHighImageURI() public view returns(string memory) {
        return i_highImageURI;
    }

    function getPriceFeed() public view returns(AggregatorV3Interface) {
        return i_pricefeedAddress;
    }
}

