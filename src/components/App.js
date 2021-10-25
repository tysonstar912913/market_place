import React, { Component } from 'react';
import Web3 from 'web3'
import logo from '../logo.png';
import './App.css';
// import Marketplace from '../abis/Marketplace.json'
import Marketplace from '../abis/ERC20Basic.json'
import Navbar from './Navbar'
import Main from './Main'

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    console.log("loadWeb3");
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    /* else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } */
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })
    const networkId = await web3.eth.net.getId()
    const networkData = Marketplace.networks[networkId]

    console.log(Marketplace.networks);

    if(networkData) {
      const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address)

      marketplace.events.Transfer().on('data', (e) => {
        console.log(e);
        this.state.chFrom = e.returnValues.from;
        this.state.chTo = e.returnValues.to;
        this.state.chValue = e.returnValues.tokens;
        this.setState({isChanged: 1});
      });

      this.setState({ marketplace })

      this.setState({ loading: false})
      return;

      const productCount = await marketplace.methods.productCount().call()
      this.setState({ productCount })
      // Load products
      for (var i = 1; i <= productCount; i++) {
        const product = await marketplace.methods.products(i).call()
        this.setState({
          products: [...this.state.products, product]
        })
      }
      this.setState({ loading: false})
    } else {
      window.alert('Marketplace contract not deployed to detected network.')
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      productCount: 0,
      products: [],
      loading: true,
      chFrom: '',
      chTo: '',
      chValue: '',
      isChanged: 0
    }

    this.createProduct = this.createProduct.bind(this)
    this.purchaseProduct = this.purchaseProduct.bind(this)
  }

  createProduct(name, price) {
    this.setState({ loading: true })
    let txtRes = this.state.marketplace.methods.balanceOf("0xD9F8886E9cA7074FeE9568e3e8fEBceE829F343d")
    .call({ from: this.state.account })

    console.log(txtRes);

    return;
    
    this.state.marketplace.methods.createProduct(name, price).send({ from: this.state.account })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  purchaseProduct(id, price) {
    this.setState({ loading: true })
    this.state.marketplace.methods.purchaseProduct(id).send({ from: this.state.account, value: price })
    .once('receipt', (receipt) => {
      this.setState({ loading: false })
    })
  }

  handleClick = () => {
    let eleA, eleB, eleC;

    eleA = document.getElementById("txtFrom").value;
    eleB = document.getElementById("txtTo").value;
    eleC = document.getElementById("txtAmount").value;

    console.log(eleA.value, eleB.value, eleC.value);

    this.state.marketplace.methods.transferFromTo(eleA, eleB, eleC).send({ from: this.state.account, value: 100 })

    let txtRes = this.state.marketplace.methods.balanceOf(eleB)
    .call({ from: this.state.account })

    console.log(txtRes);
  }

  clickView = () => {
    let eleA, eleB, eleC;

    eleA = document.getElementById("txtUser").value;
    eleB = document.getElementById("txtBal");

    this.state.marketplace.methods.balanceOf(eleA)
    .call({ from: this.state.account }).then(res=> {
      eleB.value = res;
    })
  }

  render() {
    let eleChange = null;

    if (this.state.isChanged) {
      eleChange = (
        <div>
          Sender: {this.state.chFrom} <br /> Receiver: {this.state.chTo} <br /> Amount: {this.state.chValue} 
        </div>
      )
      this.state.isChanged = 0;
    }

    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              { this.state.loading
                ? <div id="loader" className="text-center"><p className="text-center">Loading...</p></div>
                : <Main
                  products={this.state.products}
                  createProduct={this.createProduct}
                  purchaseProduct={this.purchaseProduct} />
              }
            </main>
          </div>
          <div className="row">
            <input type="text" id="txtFrom" size="45" /><br />
            <input type="text" id="txtTo" size="45" /><br />
            <input type="text" id="txtAmount" /><br />
            <input type="button" value="Send" onClick={this.handleClick}/><br />
          </div>
        </div>
        <div>
        <input type="text" id="txtUser" /><br />
        <input type="text" id="txtBal" /><br />
        <input type="button" value="View Balance" onClick={this.clickView}/><br />
        </div>
        {eleChange}
      </div>
    );
  }
}

export default App;
