const Voting = artifacts.require("Voting");
//const { BN, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers'); // BN: Big Number

const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
  } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


// // The solution below does not work I don't get why
// contract("Voting", function (accounts) {

//     let votingInstance;
//     const owner = accounts[0];
//     const nonvoter = accounts[1];

//     beforeEach('setup contract for each test case', async () => {
//         votingInstance = await Voting.new({from: owner});
//     });

//     it("Only the admin should be able to start the proposal registration session", async () => {

//        try {
//             try starting the registrering Proposal using non-admin addresss
//             await votingInstance.startRegisteringProposal({from: nonvoter});
//             assert.isTrue(false);
//        }
//        catch(e) {
//             assert.isTrue(owner != nonvoter);
//             assert.equal(e, "Error: VM Exception while processing transaction: revert - the caller of this function must be the administrator");
//        }
//     });
//   })


  contract("Voting", async accounts => {

    var votingInstance;
 
    const owner = accounts[0];
    const nonvoter = accounts[1];
    const voter1 = accounts[1];
    const nonadmin = accounts[1];

    beforeEach('setup contract for each test case', async () => {
        votingInstance = await Voting.new({from: owner});
    });

    it("Only the admin should be able register voters", async () => {
        //try starting the registrering Proposal using non-admin addresss
        await expectRevert.unspecified(votingInstance.addVoterToList(owner, {from: nonadmin}));
    });

    it("An account is added by admin ", async function(){
        let res = await votingInstance.addVoterToList(voter1, {from: owner});
        let list = await votingInstance.getAddresses();

        expect(list[0]).to.equal(voter1);
        await expectEvent(res, "VoterRegistrered", {voterAddress: voter1}, "VoterRegistered event incorrect");
        });

    it("Only the admin should be able to start the proposal registration session", async () => {
        //try starting the registrering Proposal using non-admin addresss
        await expectRevert.unspecified(votingInstance.startRegisteringProposal({from: nonvoter}));
    });
    
    
  })