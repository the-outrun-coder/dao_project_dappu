const { ethers } = require('hardhat');
const { expect } = require('chai');

const tokensToWei = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether');
}

const etherToWei = tokensToWei;

describe('DAO', () => {
  // - CONFIG
  const tokenContractName = 'Dapp University';
  let tokenTotalSupply = '1000000';
  // let tokenTotalSupplyInWei = tokensToWei(tokenTotalSupply);
  const quromThreshold = '500000000000000000000001'; // = over 50%
  const initialFunding = etherToWei(100);
  // - CONTRACTS
  let tokenContract;
  let daoContract;
  // - ACCOUNTS
  let accounts;
  let deployer;
  let funder;
  // - ACTORS
  let investor_1;
  let investor_2;
  let investor_3;
  let investor_4;
  let investor_5;
  let recipient_1;
  let randomUser;
  // - ADDRESSES
  // let deployerAddress;
  // let funderAddress;
  let investor_1Address;
  let investor_2Address;
  let investor_3Address;
  let investor_4Address;
  let investor_5Address;
  let recipient_1Address;
  // let randomUserAddress;
  // - CONTRACT ADDRESSES
  let tknContractAddress;
  let daoContractAddress;
  //
  
  beforeEach(async() => {
    let distTrx;
    // Collect Accounts
    accounts = await ethers.getSigners();
    // ACTORS
    [
      deployer,
      funder,
      //
      investor_1,
      investor_2,
      investor_3,
      investor_4,
      investor_5,
      //
      recipient_1,
      randomUser
    ] = accounts;
    // deployerAddress = deployer.address;
    // funderAddress = funder.address;
    //
    investor_1Address = investor_1.address;
    investor_2Address = investor_2.address;
    investor_3Address = investor_3.address;
    investor_4Address = investor_4.address;
    investor_5Address = investor_5.address;
    //
    recipient_1Address = recipient_1.address;
    // randomUserAddress = randomUser.address; // non DAO member;

    // Load contracts
    const tknContractFactory = await ethers.getContractFactory('Token');
    const daoContractFactory = await ethers.getContractFactory('DAO');

    // DEPLOY TOKEN !
    tokenContract = await tknContractFactory.deploy(tokenContractName, 'DAPP', tokenTotalSupply);
    tknContractAddress = tokenContract.address;

    // DEPLOY DAO !
    daoContract = await daoContractFactory.deploy({
      _tokenContractAddress: tknContractAddress,
      _quorum: quromThreshold // = over 50%
    });
    daoContractAddress = daoContract.address;

    // TODO - BRING IN ASYNC AWAIT LIB SERIES MANAGEMENT
    // DIST DAO TOKENS TO INVESTORS
    // [].forEach((investor) => {});
    // REFACTOR into async series >>>
    const distDAO_tokenAmount = tokensToWei(200000); // = 20%
    distTrx = await tokenContract.connect(deployer).transfer(investor_1Address, distDAO_tokenAmount);
    await distTrx.wait();
    distTrx = await tokenContract.connect(deployer).transfer(investor_2Address, distDAO_tokenAmount);
    await distTrx.wait();
    distTrx = await tokenContract.connect(deployer).transfer(investor_3Address, distDAO_tokenAmount);
    await distTrx.wait();
    distTrx = await tokenContract.connect(deployer).transfer(investor_4Address, distDAO_tokenAmount);
    await distTrx.wait();
    distTrx = await tokenContract.connect(deployer).transfer(investor_5Address, distDAO_tokenAmount);
    await distTrx.wait();
    // REFACTOR <<<


    // FUND THE DAO !
    await funder.sendTransaction({ to: daoContractAddress, value: initialFunding});
  });

  describe('Deployment', () => {
    it('token contract has correct name', async() => {
      expect(await tokenContract.name()).to.equal(tokenContractName);
    });

    it('returns the Token address', async () => {
      expect(await daoContract.tokenContract()).to.equal(tknContractAddress);
    });

    it('returns quorum', async() => {
      expect(await daoContract.quorum()).to.equal(quromThreshold);
    });

    it('sends ether to the DAO treasury', async() => {
      expect(await ethers.provider.getBalance(daoContractAddress)).to.equal(initialFunding);
    });
  });

  describe('Proposal Creation', () => {
    let proposalTrx; //, propResult;
    const propName = 'Proposal_test_1';
    const propDistributionAmount = etherToWei(80);
    const overPricedPropDistributionAmount = etherToWei(1000);
    let propRecipient;
    
    
    describe('Success', () => {
      beforeEach(async () => {
        propRecipient = recipient_1Address;

        // Create first proposal
        proposalTrx = await daoContract.connect(investor_1).createProposal(propName, propDistributionAmount, propRecipient);
        // propResult =
        await proposalTrx.wait();
      });

      it('updates proposal count', async () => {
        expect(await daoContract.proposalCount()).to.equal(1);
      });

      it('updates proposal mapping', async () => {
        // const proposal = await daoContract.proposals(1);
        // console.log('>> PROP_1:', proposal);
        const { id, amount, recipient } = await daoContract.proposals(1);

        expect(id).to.equal(1);
        expect(amount).to.equal(propDistributionAmount);
        expect(recipient).to.equal(propRecipient);
      });

      it('emits a propose event', async () => {
        await expect(proposalTrx).to.emit(daoContract, 'Propose')
          .withArgs(1, propDistributionAmount, propRecipient, investor_1Address)
      });
    });
    
    describe('Failure', () => {
      it('rejects underfunded proposal', async () => {
        const underFundedProposal = daoContract.connect(investor_1).createProposal(propName, overPricedPropDistributionAmount, propRecipient);
        await expect(underFundedProposal).to.be.reverted;
      });

      // it('', async () => {});
    });
  });
})