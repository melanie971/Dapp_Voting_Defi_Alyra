// Voting.sol
// SPDX-Licence-Identifier: MIT

pragma solidity 0.6.11;
pragma experimental ABIEncoderV2; //to make the getProposals() works, however might not be a safe solution
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/access/Ownable.sol"; // does not work using truffle
//import "https://github.com/OpenZeppelin/openzeppelin-contracts/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract Voting is Ownable{

	using SafeMath for uint;

	struct Voter {
	  	bool isRegistred;
	  	bool hasVoted;
	  	uint votedProposalId;
	 }

	  struct Proposal {
	  	string description;
	  	uint voteCount;
	  }

  
  	uint winningProposalId;
  	uint countProposalId = 0;


	mapping(address => Voter) public RegisteredVoters; // Le registre des voteurs
	Proposal[] public proposals; //tableau des propositions
	address[] public addresses; //Ajout - tableau des addresses


	  
	 //Gestion des différents états d'un vote
	 enum WorkflowStatus {
	  RegisteringVoters,
	  ProposalsRegistrationStarted,
	  ProposalsRegistrationEnded,
	  VotingSessionStarted,
	  VotingSessionEnded,
	  VotesTallied
	 }

	 WorkflowStatus public currentWorkflowStatus = WorkflowStatus.RegisteringVoters; //on initilise l'état du workflow

	 modifier inState(WorkflowStatus state) { 
  		require (state == currentWorkflowStatus); 
  		_; 
  	}

	 // Les différents évènements
	 event VoterRegistrered(address voterAddress);
	 event ProposalsRegistrationStarted();
	 event ProposalsRegistrationEnded();
	 event ProposalRegistred (uint proposalId);
	 event VotingSessionStarted();
	 event VotingSessionEnded();
	 event Voted (address voter, uint proposalId);
	 event VotesTallied();
	 event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);


	//Fonctions pour récupérer les divers éléments nécessaires pour le FrontEnd
	//Récupérer la liste des propositions enregistrées...does not work compilation failed
      function getProposals() public view returns(Proposal[] memory){
       return proposals;
   		}

	//Getting addresses
	 function getAddresses() public view returns(address[] memory){
		 return addresses;
	 }

	 

  	//Etape 1 - L'administrateur du vote enregistre une liste blanche d'électeurs identifiés par leur adresse Ethereum
  	 function addVoterToList(address _address) public onlyOwner inState(WorkflowStatus.RegisteringVoters)
  	 {
	      require(RegisteredVoters[_address].isRegistred != true, "This address is already registred !");
	      RegisteredVoters[_address] = Voter(true, false, 0); 
		  addresses.push(_address);
	      emit VoterRegistrered(_address);
	 }

	 


	 //Etape 2 - L'admin commence la session d'enregistrement des propositions émises par les voteurs
	 function startRegisteringProposal() public onlyOwner inState(WorkflowStatus.RegisteringVoters)
	  {
	  	emit ProposalsRegistrationStarted();
	  	currentWorkflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
	  	emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
	  }

	 //Etape 3 - Les électeurs inscrits sont autorisés à enregistrer leur propostion
	  function addProposal(string memory _description) public inState(WorkflowStatus.ProposalsRegistrationStarted)
		  {
		  	require (RegisteredVoters[msg.sender].isRegistred == true, "You're not registered, you can't submit a proposal");
		  	proposals.push(Proposal(_description, 0)); //Adding the proposal to the array, only the description since count will be done later
		  	countProposalId = countProposalId.add(1); //instead of countProposalId++
		  	emit ProposalRegistred(countProposalId);
		  }

	//Etape 4 - L'administrateur met fin à la session d'enregistrement des propositions
		function endOfRegisteringProposal() public onlyOwner inState(WorkflowStatus.ProposalsRegistrationStarted)
		{
			currentWorkflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
			emit ProposalsRegistrationEnded();
			emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
		}


	// Etape 5 - L'administrateur commence la session de vote
		function startVote() public onlyOwner inState(WorkflowStatus.ProposalsRegistrationEnded)
		{
			currentWorkflowStatus = WorkflowStatus.VotingSessionStarted;
			emit VotingSessionStarted();
			emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
		}


	//Etape 6 - Les électeurs inscrits votent pour leur proposition preferee:
	function DoingTheVote (uint proposal_id) public inState(WorkflowStatus.VotingSessionStarted)

	 {
		require (RegisteredVoters[msg.sender].isRegistred == true, "You're not registered, you can't vote");
		require (RegisteredVoters[msg.sender].hasVoted == false, "You've already vote for a proposal");
		
		RegisteredVoters[msg.sender].votedProposalId = proposal_id ; 
		RegisteredVoters[msg.sender].hasVoted = true ;//updating status of the voter
		proposals[proposal_id].voteCount =  (proposals[proposal_id].voteCount).add(1); //order!
		emit Voted (msg.sender, proposal_id);

	}


	//Etape 7- l'administrateur met fin à la session de vote
	function endVote() public inState(WorkflowStatus.VotingSessionStarted) onlyOwner
		{
			currentWorkflowStatus = WorkflowStatus.VotingSessionEnded;
			emit VotingSessionEnded();
			emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
		}

  
    
	//Etape 8- l'administrateur comptabilise les votes et retourne l'id de la proposition qui a gagné
	function TheWinnerIs() public inState(WorkflowStatus.VotingSessionEnded) onlyOwner returns(uint)
		{
			uint winningVoteCount = 0 ;
			for (uint i=0; i <proposals.length; i++) {
				if (proposals[i].voteCount > winningVoteCount) {
					winningVoteCount = proposals[i].voteCount;
					winningProposalId = i;
				
			    }
			}
			
    	return winningProposalId;

		}

	// Etape 9 - L'administateur indique "VotesTallied"
	function votesTallied() public inState(WorkflowStatus.VotingSessionEnded) onlyOwner returns(uint)
		{
			currentWorkflowStatus = WorkflowStatus.VotesTallied;
	    	emit VotesTallied();
	    	emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
		}


    // Etape 10 - 
      function LookAtTheWinningProposal() public view returns (string memory proposalName)
      {
        proposalName = proposals[winningProposalId].description;
        return(proposalName);
        }


    
    
}
		


