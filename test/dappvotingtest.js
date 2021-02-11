const Voting = artifacts.require("Voting");
//const { BN, ether, expectEvent, expectRevert } = require('@openzeppelin/test-helpers'); // BN: Big Number

const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
  } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');


// // The solution below does not work -guess - I did not find out why
// contract("Voting", function (accounts) {

//     let votingInstance;
//     const owner = accounts[0];
//     const nonvoter = accounts[1];

//     beforeEach('setup contract for each test case', async () => {
//         votingInstance = await Voting.new({from: owner});
//     });

//     it("Only the admin should be able to start the proposal registration session", async () => {

//        try {
//             await votingInstance.addVoterToList(voter1, {from: owner});
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
    it("A proposal is registered by a voter only after session started by admin", async function(){
        await votingInstance.addVoterToList(voter1, {from: owner});
        await expectRevert.unspecified(votingInstance.addProposal("Proposition2", {from: voter1}));
        });

    // a voter cannot vote before the voting session was allowed by adm
    it("A voter cannot vote before the voting session is allowed by adm", async function(){
        await votingInstance.addVoterToList(voter1, {from: owner});
        await votingInstance.startRegisteringProposal({from: owner});
        await votingInstance.addProposal("Proposition2", {from: voter1});
        await votingInstance.endOfRegisteringProposal({from: owner});
        //await votingInstance.startVote({from: owner});
        await expectRevert.unspecified(votingInstance.DoingTheVote(0, {from: voter1}));
        
        });

     // a voter can vote only once
     it("A voter can vote only once", async function(){
        await votingInstance.addVoterToList(voter1, {from: owner});
        await votingInstance.startRegisteringProposal({from: owner});
        await votingInstance.addProposal("Proposition1", {from: voter1});
        await votingInstance.endOfRegisteringProposal({from: owner});
        await votingInstance.startVote({from: owner});
        await votingInstance.DoingTheVote(0, {from: voter1});

        await expectRevert.unspecified(votingInstance.DoingTheVote(0, {from: voter1}));
        
        });

        //a non-voter cannot vote
        it("A non-voter cannot vote", async function(){
            await votingInstance.addVoterToList(voter1, {from: owner});
            await votingInstance.startRegisteringProposal({from: owner});
            await votingInstance.addProposal("Proposition1", {from: voter1});
            await votingInstance.endOfRegisteringProposal({from: owner});
            await votingInstance.startVote({from: owner});
            await votingInstance.DoingTheVote(0, {from: voter1});
    
            await expectRevert.unspecified(votingInstance.DoingTheVote(0, {from: nonvoter}));
            
            });

        //a voter cannot vote after admin ends the voting session
        it("A voter cannot vote after admin ends the session", async function(){
            await votingInstance.addVoterToList(voter1, {from: owner});
            await votingInstance.startRegisteringProposal({from: owner});
            await votingInstance.addProposal("Proposition1", {from: voter1});
            await votingInstance.endOfRegisteringProposal({from: owner});
            await votingInstance.startVote({from: owner});
            await votingInstance.DoingTheVote(0, {from: voter1});
            await votingInstance.endVote({from: owner});
    
            await expectRevert.unspecified(votingInstance.DoingTheVote(0, {from: voter1}));
            
            });

            //only the admin should be allowed to end the voting session
            it("Only the admin can end the voting session", async function(){
                await votingInstance.addVoterToList(voter1, {from: owner});
                await votingInstance.startRegisteringProposal({from: owner});
                await votingInstance.addProposal("Proposition1", {from: voter1});
                await votingInstance.endOfRegisteringProposal({from: owner});
                await votingInstance.startVote({from: owner});
                await votingInstance.DoingTheVote(0, {from: voter1});
                
        
                await expectRevert.unspecified(votingInstance.endVote({from: voter1}));
                
                });

            //only the admn can count the votes
            it("Only the admin can count the votes", async function(){
                await votingInstance.addVoterToList(voter1, {from: owner});
                await votingInstance.startRegisteringProposal({from: owner});
                await votingInstance.addProposal("Proposition1", {from: voter1});
                await votingInstance.endOfRegisteringProposal({from: owner});
                await votingInstance.startVote({from: owner});
                await votingInstance.DoingTheVote(0, {from: voter1});
                await votingInstance.endVote({from: owner});
                await expectRevert.unspecified(votingInstance.TheWinnerIs({from: voter1}));
                
                });


            //a winning proposal is returned -- THIS TEST DOES NOT WORK
            it("a winning proposal id is returned", async function(){
                await votingInstance.addVoterToList(voter1, {from: owner});
                await votingInstance.addVoterToList(voter2, {from: owner});
                await votingInstance.startRegisteringProposal({from: owner});
                await votingInstance.addProposal("Proposition1", {from: voter1});
                await votingInstance.addProposal("Proposition2", {from: voter1});
                await votingInstance.endOfRegisteringProposal({from: owner});
                await votingInstance.startVote({from: owner});
                await votingInstance.DoingTheVote(1, {from: voter1});
                await votingInstance.DoingTheVote(1, {from: voter2});
                await votingInstance.endVote({from: owner});
                await votingInstance.TheWinnerIs({from: owner});

                const winning_prop = await votingInstance.TheWinnerIs({from: owner});
                expect(winning_prop).to.equal(1);
                //expect(winning_prop).to.be.equal(1);
                //assert.equal(winning_prop, 1, "The winning proposal is not the good one");
                
                });



    }
  )