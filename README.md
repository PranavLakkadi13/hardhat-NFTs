This project has 3 contracts deployed :-

1. Basic NFT -> It is just a implementation of the openzepplin ERC-721 code

2. Random IPFS NFT -> Random at creation time making them rare and be hosted on IPFS 
--> Pros: It is cheap
--> Cons: Someone at all times have to pin the ipfs file 

3. Dynamic SVG NFT -> Hosted completely onchain, But when somechanges are made to the parameters it alter the image onChain 
--> Pros: Hosted completely onchain
--> Cons: Much more Expensive
:- here in the dynamic nfts if the price of ETH is above a certain number ? Happy face : sad face The certain number is user Input


Try running some of the following tasks:

```shell
yarn hardhat help
yarn hardhat test
yarn hardhat coverage
yarn hardhat deploy 
```


Note: In 02-deploy-RandomIpfsNft.js, in your .env file add UPLOAD_TO_PINATA == "true", before deploying the code on hardhat 
