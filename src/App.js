import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input, FormText, Container, Row, Col } from 'reactstrap';
import logo from './logo.png';
import QRCode from 'qrcode.react';


import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli({
  restUrl: 'https://trest.bitcoin.com/v1/'
});
let wormhole = require("wormholecash/lib/Wormhole").default;
let Wormhole = new wormhole({
  restURL: 'https://wormholecash-staging.herokuapp.com/v1/'
});

let mnemonic = 'remain bring turkey race next ivory direct crunch dwarf material correct oak intact copper jaguar lottery hope under kingdom robot leopard call giggle genuine';

// root seed buffer
let rootSeed = BITBOX.Mnemonic.toSeed(mnemonic);

// master HDNode
let masterHDNode = BITBOX.HDNode.fromSeed(rootSeed, 'testnet');

// HDNode of BIP44 account
let account = BITBOX.HDNode.derivePath(masterHDNode, "m/44'/145'/0'");

// derive the first external change address HDNode which is going to spend utxo
let change = BITBOX.HDNode.derivePath(account, "0/0");

// get the cash address
let cashAddress = BITBOX.HDNode.toCashAddress(change);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      category: '',
      subcategory: 'subcategory',
      url: '',
      description: '',
      tokenManagementAddress: '',
      showForm: true,
      showSuccess: false
    }
  }

  componentDidMount() {
  }

  async handleSubmit(e) {
    e.preventDefault();
    // BITBOX.RawTransactions.getRawTransaction(this.state.txid).then((result) => {
    // }, (err) => { console.log(err); });

    let managed = await Wormhole.PayloadCreation.managed(1, 0, 0, this.state.category, this.state.subcategory, this.state.name, this.state.url, this.state.description);
    let utxo = [{
      txid: "0a6a946cc8b9d969dd482f13215d7da1eaf98518079e96cdc7829850d60c841a",
      vout: 1,
      scriptPubKey: "76a91423da806c2dbf8f7381c391d1018cec0f963d491888ac",
      amount: 0.02,
      value: 0.02,
      satoshis: 2000000
    }];

    let rawTx = await Wormhole.RawTransactions.create(utxo, {});
    let opReturn = await Wormhole.RawTransactions.opReturn(rawTx, managed);
    let ref = await Wormhole.RawTransactions.reference(opReturn, cashAddress);
    let changeHex = await Wormhole.RawTransactions.change(ref, utxo, cashAddress, 0.006);

    let tx = Wormhole.Transaction.fromHex(changeHex)
    let tb = Wormhole.Transaction.fromTransaction(tx)

    let keyPair = Wormhole.HDNode.toKeyPair(change);
    let redeemScript;
    tb.sign(0, keyPair, redeemScript, 0x01, utxo[0].satoshis);
    let builtTx = tb.build()
    let txHex = builtTx.toHex();
    let txid = await BITBOX.RawTransactions.sendRawTransaction(txHex);
    this.setState({
      showForm: false,
      showSuccess: true
    });
  }

  handleInputChange(e) {
    let value = e.target.value;
    let id = e.target.id;
    let obj = {};
    obj[id] = value;
    this.setState(obj);
  }

  render() {
    let formMarkup = [];
    if(this.state.showForm)  {
      formMarkup.push(
        <Row>
          <Col>
            <Form onSubmit={this.handleSubmit.bind(this)}>
              <FormGroup>
                <Label for="name">Name</Label>
                <Input onChange={this.handleInputChange.bind(this)} type="text" name="name" id="name" placeholder="Name" value={this.state.name} />
              </FormGroup>
              <FormGroup>
                <Label for="category">Category</Label>
                <Input onChange={this.handleInputChange.bind(this)} type="text" name="category" id="category" placeholder="Category" value={this.state.category} />
              </FormGroup>
              <FormGroup>
                <Label for="url">Url</Label>
                <Input onChange={this.handleInputChange.bind(this)} type="text" name="url" id="url" placeholder="Url" value={this.state.url} />
              </FormGroup>
              <FormGroup>
                <Label for="description">Description</Label>
                <Input  onChange={this.handleInputChange.bind(this)} type="text" name="description" id="description" placeholder="Description" value={this.state.description}/>
              </FormGroup>
              <FormGroup>
                <Label for="token-management-address">Token Management Address</Label>
                <Input onChange={this.handleInputChange.bind(this)} type="text" name="tokenManagementAddress" id="tokenManagementAddress" placeholder="Token Management Address" value={this.state.tokenManagementAddress} />
              </FormGroup>
              <Button>Submit</Button>
            </Form>
          </Col>
        </Row>
      );
    }
    let successMarkup = [];
    if(this.state.showSuccess)  {
      successMarkup.push(
        <Container className='payment'>
          <Row>
            <Col>
              Send $.01 (miners fee)
            </Col>
          </Row>
          <Row>
            <Col>
              <QRCode value={cashAddress} className='qrcode' />
            </Col>
          </Row>
        </Container>
      )
    }
    return (
      <Container>
        <Row>
          <Col className='header'>
            <img src={logo} className="App-logo" alt="logo" />
          </Col>
          <Col className='header'>
            <h1>WyoToken Utility Token Generator</h1>
          </Col>
        </Row>
        {formMarkup}
        {successMarkup}
      </Container>
    );
  }
}

export default App;
