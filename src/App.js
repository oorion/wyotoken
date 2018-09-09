import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input, FormText, Container, Row, Col } from 'reactstrap';
import logo from './logo.png';
import QRCode from 'qrcode.react';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem } from 'reactstrap';

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
let change2 = BITBOX.HDNode.derivePath(account, "0/1");

// get the cash address
let cashAddress = BITBOX.HDNode.toCashAddress(change);
let cashAddress2 = BITBOX.HDNode.toCashAddress(change2);

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
      amount: '',
      stepOne: true,
      showStepOneSuccess: false,
      showManagement: false,
      grantee: '',
      showCheckout: false
    }
  }

  async handleSubmit(e) {
    e.preventDefault();

    let managed = await Wormhole.PayloadCreation.managed(1, 0, 0, this.state.category, this.state.subcategory, this.state.name, this.state.url, this.state.description);
    let utxo = [{
      txid: "ba661aea85641956298376f7f3f36a913a6991deb06b246d41fdfec76464a24d",
      vout:  0,
      scriptPubKey: "76a91423da806c2dbf8f7381c391d1018cec0f963d491888ac",
      amount: 0.02,
      value: 0.02,
      satoshis: 2000000
    }];

    let rawTx = await Wormhole.RawTransactions.create(utxo, {});
    let opReturn = await Wormhole.RawTransactions.opReturn(rawTx, managed);
    let ref = await Wormhole.RawTransactions.reference(opReturn, cashAddress);
    let changeHex = await Wormhole.RawTransactions.change(ref, utxo, cashAddress, 0.00006);

    let tx = Wormhole.Transaction.fromHex(changeHex)
    let tb = Wormhole.Transaction.fromTransaction(tx)

    let keyPair = Wormhole.HDNode.toKeyPair(change);
    let redeemScript;
    tb.sign(0, keyPair, redeemScript, 0x01, utxo[0].satoshis);
    let builtTx = tb.build()
    let txHex = builtTx.toHex();
    let txid = await Wormhole.RawTransactions.sendRawTransaction(txHex);
    console.log("STEP 1 SUCCESS: ", txid)
    this.setState({
      stepOne: false,
      showStepOneSuccess: true
    });
  }

  async handleTokenCreation(e) {
    e.preventDefault();
    let grant = await Wormhole.PayloadCreation.grant(202, this.state.amount);

    let utxo = [{
      txid: "ee29d4d4ce77714a20bc4d6503f862111b19c333ed24258b77a5276c8aaf5740",
      vout: 0,
      scriptPubKey: "76a91423da806c2dbf8f7381c391d1018cec0f963d491888ac",
      amount: 0.02,
      value: 0.02,
      satoshis: 2000000
    }];
    let rawTx = await Wormhole.RawTransactions.create(utxo, {});
    let opReturn = await Wormhole.RawTransactions.opReturn(rawTx, grant);
    let ref = await Wormhole.RawTransactions.reference(opReturn, cashAddress);
    let changeHex = await Wormhole.RawTransactions.change(ref, utxo, cashAddress, 0.00006);

    let tx = Wormhole.Transaction.fromHex(changeHex)
    let tb = Wormhole.Transaction.fromTransaction(tx)

    let keyPair = Wormhole.HDNode.toKeyPair(change);
    let redeemScript;
    tb.sign(0, keyPair, redeemScript, 0x01, utxo[0].satoshis);
    let builtTx = tb.build()
    let txHex = builtTx.toHex();
    console.log(txHex)
    let txid = await Wormhole.RawTransactions.sendRawTransaction(txHex);
    console.log("STEP 2 SUCCESS: ", txid)
    this.setState({
      showManagement: false,
      showCheckout: true
    });
  }

  handleInputChange(e) {
    let value = e.target.value;
    let id = e.target.id;
    let obj = {};
    obj[id] = value;
    this.setState(obj);
  }

  bip21Address(address, amount) {
    let options = {
      amount: amount,
      label: "mah label",
      message: "bitbox ftw"
    };
    return BITBOX.BitcoinCash.encodeBIP21(address, options);
  }

  handleNext() {
    this.setState({
      showStepOneSuccess: false,
      showManagement: true
    });
  }

  render() {
    let stepOneMarkup = [];
    if(this.state.stepOne)  {
      stepOneMarkup.push(
        <Row>
          <Col className='center'>
            <h2 className='stepHeaders'>Step 1: Define your token</h2>
            <Form onSubmit={this.handleSubmit.bind(this)}>
              <FormGroup>
                <Input className='inputField' onChange={this.handleInputChange.bind(this)} type="text" name="name" id="name" placeholder="Name" value={this.state.name} />
              </FormGroup>
              <FormGroup>
                <Input className='inputField' onChange={this.handleInputChange.bind(this)} type="text" name="category" id="category" placeholder="Category" value={this.state.category} />
              </FormGroup>
              <FormGroup>
                <Input className='inputField' onChange={this.handleInputChange.bind(this)} type="text" name="url" id="url" placeholder="Url" value={this.state.url} />
              </FormGroup>
              <FormGroup>
                <Input className='inputField'  onChange={this.handleInputChange.bind(this)} type="text" name="description" id="description" placeholder="Description" value={this.state.description}/>
              </FormGroup>
              <FormGroup>
                <Input className='inputField' onChange={this.handleInputChange.bind(this)} type="text" name="tokenManagementAddress" id="tokenManagementAddress" placeholder="Token Management Address" value={this.state.tokenManagementAddress} />
              </FormGroup>
              <Button color='primary' size='lg'>Submit</Button>
            </Form>
          </Col>
        </Row>
      );
    }

    let successMarkup = [];
    if(this.state.showStepOneSuccess)  {
      successMarkup.push(
        <Container>
          <Row className='payment center'>
            <Col>
              <h2 className='stepHeaders'>Step 2: Send $.01 (miners fee)</h2>
            </Col>
          </Row>
          <Row className='center'>
            <Col>
              <QRCode value={cashAddress} className='qrcode' />
            </Col>
          </Row>
          <Row>
            <Col className='center'>
              <Button onClick={this.handleNext.bind(this)} color='primary' size='lg'>Continue</Button>
            </Col>
          </Row>
        </Container>
      )
    }

    let managementMarkup = [];
    if(this.state.showManagement) {
      managementMarkup.push(
        <Row>
          <Col className='center'>
            <h2 className='stepHeaders'>Step 3: Grant Tokens</h2>
            <Form onSubmit={this.handleTokenCreation.bind(this)}>
              <FormGroup>
                <Input onChange={this.handleInputChange.bind(this)} type="text" name="grantee" id="grantee" placeholder="Grantee" value={this.state.grantee} />
              </FormGroup>
              <FormGroup>
                <Input onChange={this.handleInputChange.bind(this)} type="text" name="amount" id="amount" placeholder="Number of tokens to create" value={this.state.amount} />
              </FormGroup>
              <FormGroup>
                <Input onChange={this.handleInputChange.bind(this)} type="text" name="purchasePrice" id="purchasePrice" placeholder="Purchase price in USD" value={this.state.purchasePrice} />
              </FormGroup>
              <Button color='primary' size='lg'>Submit</Button>
            </Form>
          </Col>
        </Row>
      )
    }

    let checkoutMarkup = [];
    if(this.state.showCheckout) {
      checkoutMarkup.push(
        <Container>
          <Row>
            <Col className='center'>
              <h2 className='stepHeaders'>Step 4: Purchase token for ${this.state.purchasePrice}</h2>
            </Col>
          </Row>
          <Row className='center'>
            <Col>
              <QRCode value={this.bip21Address(this.state.tokenManagementAddress, this.state.purchasePrice)} className='qrcode' />
            </Col>
          </Row>
        </Container>
      )
    }

    return (
      <Container>
        <Navbar className='titleRow header'>
          <Col>
            <img src={logo} className="App-logo" alt="logo" />
          </Col>
        </Navbar>
        <Row>
          <Col className='title'>
            <h1>WyoToken Utility Token Generator</h1>
          </Col>
        </Row>
        <hr />
        {stepOneMarkup}
        {successMarkup}
        {managementMarkup}
        {checkoutMarkup}

        <div className="footer">
          <Navbar expand="md">
            <NavbarBrand href="https://www.wyohackathon.io">WyoHackathon</NavbarBrand>
            <NavbarToggler onClick={this.toggle} />
            <Collapse isOpen={this.state.isOpen} navbar>
              <Nav className="ml-auto" navbar>
                <NavItem>
                  <NavLink href="http://www.wyoleg.gov/2018/Digest/HB0070.pdf">More info on HB70</NavLink>
                </NavItem>
              </Nav>
            </Collapse>
          </Navbar>
        </div>

      </Container>
    );
  }
}

export default App;
