import React, { Component } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Table from 'react-bootstrap/Table';
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import Confetti from 'react-confetti';
import "./App.css";

const WorkflowStatus={ //Etat d'avancement du vote
  RegisteringVoters : "RegisteringVoters",
  ProposalsRegistrationStarted: "ProposalsRegistrationStarted",
  ProposalsRegistrationEnded: "ProposalsRegistrationEnded",
  VotingSessionStarted: "VotingSessionStarted",
  VotingSessionEnded: "VotingSessionEnded",
  VotesTallied: "VotesTallied"
};

function Status_Sol2Web(Sol_Status){
  switch (Sol_Status){
    case "0":
      return WorkflowStatus.RegisteringVoters;
      break;
    case "1": 
      return WorkflowStatus.ProposalsRegistrationStarted;
      break;
    case "2": 
      return WorkflowStatus.ProposalsRegistrationEnded;
      break;
    case "3": 
      return WorkflowStatus.VotingSessionStarted;
      break;
    case "4": 
      return WorkflowStatus.VotingSessionEnded;
      break;
    case "5": 
      return WorkflowStatus.VotesTallied;
      break;
  }
}

class App extends Component {
  state = { web3: null,
            accounts: null, 
            contract: null, 
            whitelist: null, 
            myproposal: null, 
            proposals: null, 
            winningProposalDescription: null,
            IsOwner:false,
            Status: WorkflowStatus.RegisteringVoters,
            DisplayConfetti: false
          };

  initState = async () =>{
        return { web3: null,
          accounts: null, 
          contract: null, 
          whitelist: null, 
          myproposal: null, 
          proposals: null, 
          winningProposalDescription: null,
          IsOwner:false,
          Status: WorkflowStatus.RegisteringVoters,
          DisplayConfetti: false
              };
  }

    componentDidMount = async () => {
    try {
      // Récupérer le provider web3
      const web3 = await getWeb3();
      // Utiliser web3 pour récupérer les comptes de l’utilisateur (MetaMask dans notre cas) 
      const accounts = await web3.eth.getAccounts();
      this.setState({ 'account': accounts[0] });//ajout
      console.log(accounts);
    
      // Récupérer l’instance du smart contract avec web3 et les informations du déploiement du fichier
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Voting.networks[networkId];
      const instance = new web3.eth.Contract(Voting.abi,deployedNetwork && deployedNetwork.address);
      
      
      //Query and Monitor Ethereum Contract Events with Web3
      instance.events.VoterRegistrered().on('data', (event) => this.doWhenEvent(event)).on('error', console.error);
      instance.events.ProposalsRegistrationStarted().on('data', (event) => this.doWhenEvent(event)).on('error', console.error);
      instance.events.ProposalsRegistrationEnded().on('data', (event) => this.doWhenEvent(event)).on('error', console.error);
      instance.events.ProposalRegistred().on('data', (event) => this.doWhenEvent(event)).on('error', console.error);
      instance.events.VotingSessionStarted().on('data', (event) => this.doWhenEvent(event)).on('error', console.error);
      instance.events.VotingSessionEnded().on('data', (event) => this.doWhenEvent(event)).on('error', console.error);
      instance.events.Voted().on('data', (event) => this.doWhenEvent(event)).on('error', console.error);
      instance.events.VotesTallied().on('data', (event) => this.getWinningProposalDescription(event)).on('error', console.error);
      instance.events.WorkflowStatusChange().on('data', (event) => this.doWhenEvent(event)).on('error', console.error);
      
      //Owner of contract
      const owner_address = await instance.methods.owner().call();
      console.log("owner: ",owner_address);
      
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, IsOwner:(owner_address == accounts[0]) }, this.runInit);//
      
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Non-Ethereum browser detected. Can you please try to install MetaMask before starting.`,
      );
      console.error(error);
    }
  };

  //Fonction pour mettre à jour les variables
  runInit = async() => {
    const { accounts, contract } = this.state;
    
    let currentStatus = await contract.methods.currentWorkflowStatus().call(); //List of currentWorkflowStatus
    let Status = Status_Sol2Web(currentStatus);

    let whitelist = await contract.methods.getAddresses().call(); // récupérer la liste des comptes autorisés
    let proposals = await contract.methods.getProposals().call(); //recupérer les propositions
    //let winningProposalDescription = '' ;
    //const admin = await contract.methods.owner().call();
    
    //Updating states
    this.setState({ whitelist: whitelist, proposals: proposals, Status: Status}); // Updating the states
    
    console.log("Current status=",Status,", whitelist=",whitelist, "List of prosals:", proposals);
        
  }; 

  /*Gestion des événements reçus du smart contract*/
  doWhenEvent = async (event) => {
    console.log(event.event);
    console.log(event.returnValues);
    await this.runInit();
  }  

  getWinningProposalDescription = async() => {
    const { accounts, contract } = this.state;
    const winningProposalDescription = await contract.methods.LookAtTheWinningProposal().call();
    this.setState({ winningProposalDescription: winningProposalDescription, DisplayConfetti:true});
    console.log(winningProposalDescription);
  }

  // Fonctions de l'administrateur
  // fonction pour permettre ajout d'une adresse à la liste des comptes
  whitelist = async() => {
    const { accounts, contract } = this.state;
    const address = this.address.value;
    // Interaction avec le smart contract pour ajouter un compte 
    await contract.methods.addVoterToList(address).send({from: accounts[0]});
    // Récupérer la liste des comptes autorisés
    this.runInit();
  }
 
  //fonction pour commencer le processus d'enregistrement des propositions
  btn_startRegisteringProposals = async() => {
    const { accounts, contract } = this.state;
    await contract.methods.startRegisteringProposal().send({from: accounts[0]});
   
  }
    
  //fonction pour cloturer le processus d'enregistrement des propositions
  btn_EndRegisteringProposals = async() => {
    const { accounts, contract } = this.state;
    await contract.methods.endOfRegisteringProposal().send({from: accounts[0]});
   
  }

  //fonction pour commencer la session de vote
  btn_StartVotingSession = async() => {
    const { accounts, contract } = this.state;
    await contract.methods.startVote().send({from: accounts[0]});
  }

  //fonction pour mettre fin à la session de vote
  btn_EndVotingSession = async() => {
    const { accounts, contract } = this.state;
    await contract.methods.endVote().send({from: accounts[0]});
  }

  //fonction pour faire le compte des votes
  btn_CountingVotes = async() => {
    const { accounts, contract } = this.state;
    await contract.methods.TheWinnerIs().send({from: accounts[0]});
    await contract.methods.votesTallied().send({from: accounts[0]}); 
  }

  //   //Fonction pour tout cloturer 
  // btn_votetallied = async() => {
  //   const { accounts, contract } = this.state;
  //   await contract.methods.votesTallied().send({from: accounts[0]}); 
  // }

  
  // Fonctions pour les votants
  //fonction pour permettre ajout d'une proposition
  btn_addingProposal= async() => {
    const {accounts, contract } = this.state;
    await contract.methods.addProposal(this.state.myproposal).send({from: accounts[0]});
    this.runInit();
    
  }

  //fonction pour voter
  btn_voting = async() => {
    const {accounts, contract } = this.state;
    let proposal_id = this.proposal_id.value;
    await contract.methods.DoingTheVote(proposal_id -1 ).send({from: accounts[0]});
    this.runInit();
  }

  

  render() {
        
    if (!this.state.web3) { return <div>Loading Web3, accounts, and contract...</div>;}

    var show;
    console.log("State=", this.state);
    switch (this.state.Status){
      case WorkflowStatus.RegisteringVoters:
        show = (
         <div className="App">
           <div>
               <h2 className="text-center">Voting Dapp - Registering Voters </h2>
               <hr></hr>
               <br></br>
           </div>
           
           <div style={{display: 'flex', justifyContent: 'center'}}>
             <Card style={{ width: '50rem' }}>
               <Card.Header><strong> Authorized voters </strong></Card.Header>
               <Card.Body>
                 <ListGroup variant="flush">
                   <ListGroup.Item>
                     <Table striped bordered hover>
                       <thead>
                         <tr>
                           <th>List of registrered addresses</th>
                         </tr>
                       </thead>
                       <tbody>
                         {this.state.whitelist !== null && 
                           this.state.whitelist.map((a) => <tr><td>{a}</td></tr>)
                         }
                       </tbody>
                     </Table>
                   </ListGroup.Item>
                 </ListGroup>
               </Card.Body>
             </Card>
           </div>
           <br></br>
          
           { 
             this.state.IsOwner && //Only owner can registerer voter
            <div>
             <div style={{display: 'flex', justifyContent: 'center'}}>
              <Card border="danger" style={{ width: '50rem' }}>
                <Card.Header><strong> Register a new account </strong></Card.Header>
                <Card.Body>
                  <Form.Group controlId="formAddress">
                    <Form.Control type="text" id="address" ref={(input) => { this.address = input }}/>
                  </Form.Group>
                  <Button onClick={ this.whitelist } variant="danger"> Register </Button>  <br/>
                  <br></br>
                  <Button onClick={ this.btn_startRegisteringProposals } variant="dark" className="px-3"> End Registering Voters and Start Registering Proposal </Button>
                                      
                </Card.Body>
              </Card>
              </div>
              </div> 
           }
           <br></br>
 
             <div> Current connected account: {this.state.account}</div>
           </div>
         
       );
           break;

      //Second Step: Registering Proposals
      case WorkflowStatus.ProposalsRegistrationStarted:
        show = (
          <div className="App">
          <div>
              <h2 className="text-center">Voting Dapp - Registering Proposals </h2>
              <hr></hr>
              <br></br>
          </div>
  
          { 
            this.state.IsOwner && //Only owner can end Proposal registration and start votting session
            <div style={{display: 'flex', justifyContent: 'center'}}>
            <Card border="danger" style={{ width: '50rem' }}>
              <Card.Header><strong> Proposals registration process </strong></Card.Header>
              <Card.Body>
                
                <Button onClick={ this.btn_EndRegisteringProposals } variant="danger" > Close it</Button> <br/>
                
                </Card.Body>
                </Card>
            </div> 
          }

          { 
            !this.state.IsOwner &&
          <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card border="warning" style={{ width: '50rem' }}>
            <Card.Header><strong> Register a proposal </strong></Card.Header>
            <Card.Body>
            <Form.Control type="text" value={this.state.myproposal} onChange={e => this.setState({myproposal: e.target.value})}/>
              <br/>
              <Button onClick={ this.btn_addingProposal } variant="danger" > Send my proposal'description </Button>
              <br/>
              <br/>
            </Card.Body>
          </Card>
          </div>
          }
  
          <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong> List of Proposals </strong></Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Table striped bordered hover>
                    <tbody>
                    <ol>
                    {this.state.proposals !== null && 
                      this.state.proposals.map((item, index) => (
                        <li key={index}>{item.description}</li>
                      ))
                    }
                    </ol>
                    </tbody>
                  </Table>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </div>

        
        <div> Current connected account: {this.state.account}</div>
      </div>

       );
           break;

      //Third step: Starting Voting Session
      case WorkflowStatus.ProposalsRegistrationEnded:
        show = (
          <div className="App">
          <div>
              <h2 className="text-center">Voting Dapp- Voting Session </h2>
              <hr></hr>
              <br></br>
          </div>
    
          { 
            this.state.IsOwner && //Only Owner can end the Voting session and do the counting
          
            
          <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card border="danger" style={{ width: '50rem' }}>
            <Card.Header><strong> Voting Session </strong></Card.Header>
            <Card.Body>
              <Button onClick={ this.btn_StartVotingSession } variant="danger" > Start Voting Session </Button>           
            </Card.Body>
          </Card>
          </div>
          }

          { 
            !this.state.IsOwner && //Only Owner can end the Voting session and do the counting
          
            
          <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card border="success" style={{ width: '50rem' }}>
            <Card.Header><strong> Voting Session </strong></Card.Header>
            <Card.Body>
              Voting session is not open yet - come back later         
            </Card.Body>
          </Card>
          </div>
          }

                 
        <div> Current connected account: {this.state.account}</div>
      </div>

       );
           break;

      //Fourth step: Voting Session Started
      case WorkflowStatus.VotingSessionStarted:
        show = (
          <div className="App">
          <div>
              <h2 className="text-center">Voting Dapp - Voting Session </h2>
              <hr></hr>
              <br></br>
          </div>
    
          { 
            this.state.IsOwner && //Only Owner can end the Voting session and do the counting
          
            
          <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card className="mb-2" border="danger" style={{ width: '50rem' }}>
            <Card.Header><strong> Voting Session </strong></Card.Header>
            <Card.Body>
                  
              <Button onClick={ this.btn_EndVotingSession } variant="danger" > End Voting Session </Button>
                            
            </Card.Body>
          </Card>
          </div>
          }

          <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card style={{ width: '50rem' }}>
            <Card.Header><strong> List of Proposals </strong></Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Table striped bordered hover>
                    <tbody>
                    <ol>
                    {this.state.proposals !== null && 
                      this.state.proposals.map((item, index) => (
                        <li key={index}>{item.description}</li>
                      ))
                    }
                    </ol>
                    </tbody>
                  </Table>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </div>
        { !this.state.IsOwner && 
          <div style={{display: 'flex', justifyContent: 'center'}}>
          <Card className="mb-2" border="danger" style={{ width: '50rem' }}>
            <Card.Header><strong> Enter # of the proposal you are voting for </strong></Card.Header>
            <Card.Body>
            <Form.Group controlId="formProposal">
            <Form.Control type="number" id="proposal_id" ref={(input) => { this.proposal_id = input }} size="sm"/>
            <br></br>
            <Button onClick={ this.btn_voting } variant="danger" > Submit my vote </Button>
          </Form.Group>
            </Card.Body>
          </Card>
          </div>
        }
        
        <div> Current connected account: {this.state.account}</div>
      </div>

       );

           break;

    //Sixth step: Ending Voting Session
    case WorkflowStatus.VotingSessionEnded:
      show = (
        <div className="App">
        <div>
            <h2 className="text-center">Voting Dapp - Ending the voting session </h2>
            <hr></hr>
            <br></br>
        </div>
  
        { 
          this.state.IsOwner && //Only Owner can end the Voting session and do the counting
        
          
        <div style={{display: 'flex', justifyContent: 'center'}}>
        <Card style={{ width: '50rem' }}>
          <Card.Header><strong> </strong></Card.Header>
          <Card.Body>
                
            <Button onClick={ this.btn_CountingVotes } variant="danger" > Count votes and end process </Button>
            
            
          </Card.Body>
        </Card>
        </div>
        }

      <div> Current connected account: {this.state.account}</div>
    </div>

     );
     
     break;

  //Seventh step: VotesTallied - > Showing Winning Proposal
  case WorkflowStatus.VotesTallied:
    show = (
      <div className="App">
      <div>
          <h2 className="text-center">Voting Dapp - THE END  </h2>
          <hr></hr>
          <br></br>
      </div>

      { this.state.DisplayConfetti &&
            <Confetti/>
      }

    
      <div style={{display: 'flex', justifyContent: 'center'}}>
      <Card style={{ width: '50rem' }}>
        <Card.Header><strong> The wining proposal is :</strong></Card.Header>
        <Card.Body>
            {this.state.winningProposalDescription}
            <br></br>
            <br></br>
            <Button onClick={ this.getWinningProposalDescription } variant="primary" > Show winning proposal </Button>
        </Card.Body>
        </Card>
      </div>
      

      

      <br></br>
      <div> Current connected account: {this.state.account}</div>
    </div>

    );
  
  break;


     } 
     
     return (show);

    }
  }
  
export default App;
