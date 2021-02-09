const Voting = artifacts.require("./Voting.sol");
//const { expect } = require('chai');

contract("Voting", async accounts => {
 
    const owner = accounts[0];
    const nonvoter = accounts[1];

    beforeEach(async function () {
        //this.votingInstance = await Voting.new({from: owner});
        this.votingInstance = await Voting.deployed();
    });
  
    it("Only the admin should be able to start the proposal registration session", async () => {
   
        try {
            //try starting the registrering Proposal using non-admin addresss
            await this.votingInstance.methods.startRegisteringProposal().send({from: nonvoter});
            assert.isTrue(false);
       }
       catch(e) {
            assert.isTrue(owner != nonvoter);
            assert.equal(e, "Error: VM Exception while processing transaction: revert - the caller of this function must be the administrator");
       }
    });
  });