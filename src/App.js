import React, { Component } from 'react';
import { Button, Form, FormGroup, Label, Input, FormText, Container, Row, Col } from 'reactstrap';
import logo from './logo.png';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default;
let BITBOX = new BITBOXCli();

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      category: '',
      url: '',
      description: '',
      tokenManagementAddress: ''
    }
  }

  componentDidMount() {
  }

  handleSubmit(e) {
    BITBOX.RawTransactions.getRawTransaction(this.state.txid).then((result) => {
    }, (err) => { console.log(err); });
    e.preventDefault();
  }

  handleInputChange(e) {
    let value = e.target.value;
    let id = e.target.id;
    let obj = {};
    obj[id] = value;
    this.setState(obj);
  }

  render() {
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
      </Container>
    );
  }
}

export default App;
