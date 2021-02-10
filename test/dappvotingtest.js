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
    const nonvoter = accounts[3];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
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

    // a voter can be registered only once
    it("An account can be registered only once by admin ", async function(){
        await votingInstance.addVoterToList(voter1, {from: owner});
        await expectRevert.unspecified(votingInstance.addVoterToList(voter1, {from: owner}));
        });

    it("Only the admin should be able to start the proposal registration session", async () => {
        await expectRevert.unspecified(votingInstance.startRegisteringProposal({from: nonvoter}));
    });

      it("Only the admin should be able to end the proposal registration session", async () => {
        await expectRevert.unspecified(votingInstance.endOfRegisteringProposal({from: voter1}));
    });
    
    // only the admin can start and end the voting session
    it("Only the admin should be able to start the voting session", async () => {
        await expectRevert.unspecified(votingInstance.startVote({from: voter1}));
    });

    it("Only the admin should be able to end the voting session", async () => {
        await expectRevert.unspecified(votingInstance.endVote({from: voter1}));
    });

    // A registered voter submit a prop -> un event is emmited
    it("A proposal is registered by a voter: un event is emmited", async function(){
        await votingInstance.addVoterToList(voter1, {from: owner});
        await votingInstance.startRegisteringProposal({from: owner});
        let respropadd = await votingInstance.addProposal("proposition1", {from: voter1});
        
        await expectEvent(respropadd, "ProposalRegistred");

        });

    // A non-registered voter cannot submit a proposal
    it("A proposal cannot be registered by a nonvoter", async function(){
        await votingInstance.addVoterToList(voter1, {from: owner});
        await votingInstance.startRegisteringProposal({from: owner});
        
        await expectRevert.unspecified(votingInstance.addProposal("Proposition2", {from: nonvoter}));
        
        });



// a registered voter can submit a prop only after the admin started the session -> to be done
// a voter cannot vote before the voting session was allowed by adm
// a voter cannot vote after the voting session is ended by admin
// a voter can vote only once

  })