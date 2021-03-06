import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import NetworkList from './NetworkList';
import swal from 'sweetalert';
import NetworkOptions from '../Bill_Payment/NetworkOptions';
import baseUrl from '../../Utils/baseUrl';
import MakingPayment from '../../Components/makingPayment/makingPayment';
import withTimeout from '../../Components/HOCs/withTimeout.hoc';
import { manipulateNumber } from '../../Utils/manipulateNumber';
import AuthenticatedPagesLayoutWrapper from '../../Components/AuthenticatedPagesLayoutWrapper/authenticatedPagesLayoutWrapper';
import SlimContentCardWrapper from '../../Components/SlimContentCardWrapper/slimContentCardWrapper';
import Panel from '../../Components/Panel/panel';

const { auth_token } = JSON.parse(sessionStorage.getItem('userDetails'));

class AirtimeTopup extends Component {
  state = {
    networkNames: 'Select Network',
    serviceID: [],
    options: [],
    Networks: [],
    optionName: 'Select Option',
    id: '',
    code: '',
    amount: '',
    deviceNumber: '',
    agentPin:'',
    makingPayment: false,
  }

componentDidMount = async () => { 
  await fetch(`${baseUrl}/bills/category/1/service`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth_token}`
    },
    body: JSON.stringify({})
  }).then(response => response.json())
    .then(result => {       
        this.setState({ Networks: result.respBody })
      }
    ); //End of Get Bill Payment Details
}

  getServiceAmount = async (amount, optionName) => {
    this.setState({amount: amount, optionName: optionName})
  }

  getServiceNames = async (name) => {
    await this.setState({networkNames: name})
    await this.setState({optionName: 'Select Option'})

  // Unique ID generation
    await this.setState({serviceID: this.state.Networks})
    const list = []
    if (this.state.serviceID !== null) {
      this.state.serviceID.forEach((content,i) => {
      if(content.serviceName === this.state.networkNames){
        list.push(content.id);
      }
    }   
  )
}
  this.setState({id: JSON.parse(list)});
  //End of Uniquse ID generation

  //Get Service Code for each ID
  await fetch(`${baseUrl}/bills/category/service/${this.state.id}/options`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth_token}`
    },
    body: JSON.stringify({})
  }).then(response => response.json())
    .then(result => {
      this.setState({options: result.respBody});
      result.respBody.map((code) =>
        this.setState({
          code: code.code
        })
      )
  })
    .catch(err => {
      swal('Error', `${err}`, 'error')
    });
  //End of Get Service Code for each ID      
}

  onChange = async (event) =>{ 
    await this.setState({[event.target.name]: event.target.value}); 
  }

//Making the payment
  makePayment = async (e) => {
    if (this.state.amount === '' || this.state.deviceNumber === '' || this.state.agentPin === ''){
      swal("Failed Operation", "All Fields are required. Please fill all fields correctly", "error")
    } else if (this.state.code === ''){
      swal("Missing Field", "Select a Network", "info")
    } else {
        ;
        this.setState({makingPayment: true})
        let reqBody = {
          customerId: this.state.deviceNumber,
          amount: this.state.amount,
          pin: this.state.agentPin,
          paymentCode: this.state.code,
          phoneNumber: this.state.deviceNumber
        };

        await fetch(`${baseUrl}/bills/pay`, {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth_token}`
          },
          body: JSON.stringify(reqBody)
        }).then(response => response.json())
          .then(paymentResponse => {
            ;
            if(paymentResponse.respCode === "00"){
              swal("Successful Operation", "Airtime recharge was successful", "success");
              this.setState({makingPayment: false})
              this.props.history.push('/dashboard');
            }
            else if(paymentResponse.respCode === "119"){
              swal("Failed Operation", `${paymentResponse.respDescription}`, "error");
              this.setState({makingPayment: false})
            } else {
              this.setState({makingPayment: false})
              swal("Failed Operation", `${paymentResponse.respDescription}`, "error");
            }
      }).catch(err => {
            ;
            swal("Failed Operation", `${err}`, "error")
            this.setState({makingPayment: false})
            this.props.history.push('/dashboard');
          })
    }
    
}

  render() {
    const { makingPayment, networkNames, options, optionName, amount, Networks } = this.state;
    return (
      <AuthenticatedPagesLayoutWrapper>
        <SlimContentCardWrapper>
          <Panel 
            title="Airtime Topup" 
          />                              
          <div>
            <div className="row d-flex justify-content-center mb-5">
              <ul className="nav navbar-nav">
                <div className="dropdown">
                  <li 
                    className="btn dropdown-toggle" 
                    type="button" data-toggle="dropdown" 
                    style={{backgroundColor: '#faa831', width: '350px'}}
                  >
                    <strong>{networkNames}</strong> 
                    
                  </li>
                  <ul className="dropdown-menu dropdown" id="billPaymentOptionsDropdown">
                    {
                      Networks.map((name,i) => {
                        return <NetworkList 
                          getServiceNames={() => this.getServiceNames(name.serviceName)} 
                          key={i} 
                          name={name.serviceName} 
                          index={i}
                        />
                      })
                    }
                  </ul>
                </div>
              </ul>
            </div>

            {
              networkNames === 'Select Network' ?
              null :
              <div className="row d-flex justify-content-center mb-5">
                <ul className="nav navbar-nav">
                  <div className="dropdown">
                    <li 
                      className="btn dropdown-toggle" 
                      type="button" data-toggle="dropdown" 
                      id="billPaymentOptions"  
                    >
                        <strong>{optionName}</strong> 
                        
                      </li>
                    <ul className="dropdown-menu dropdown"  id="billPaymentOptionsDropdown">
                      {
                        options === null ? null : (options.length === 0 ? null : 
                          options.map((optionName,i) => {
                            return <NetworkOptions 
                              getServiceAmount={() => this.getServiceAmount(optionName.amount, optionName.optionName)} 
                              key={i} optionName={optionName.optionName} 
                              amount={optionName.amount} 
                            />
                          })
                        ) 
                      }
                  </ul>
                  </div>
                </ul>
              </div>
            }
            <div>
              {
                networkNames === 'Select Network' || optionName === 'Select Option' ? 
                  null : 
                  <React.Fragment>
                    <h4 id="serviceName"> {networkNames} </h4>
                    <form className="form-horizontal">
                      <div className="form-group">
                        <input className="form-control" type="number" name="amount" value={amount} step="0.01" maxLength="10" required="required" placeholder="Enter Amount" onChange={this.onChange} onKeyPress={(e) => manipulateNumber(e)} />
                      </div>
                      <div className="form-group">
                        <input className="form-control" type="number" name="deviceNumber" required="required" placeholder="Enter Phone Number" onChange={this.onChange} onKeyPress={(e) => manipulateNumber(e)} maxLength="11" /> 
                      </div>
                      <div className="form-group">
                        <input className="form-control" type="password" name="agentPin" required="required" placeholder="Enter Agent PIN" onChange={this.onChange} onKeyPress={(e) => manipulateNumber(e)} maxLength="4" />
                      </div>
                      <div className="form-group">         
                        <button 
                          type="submit"
                          className="btn btn-success col-sm-8 col-md-6 col-lg-4" 
                          id="button"
                          disabled={makingPayment}                      
                          onClick={this.makePayment}>
                          {
                            makingPayment ? <MakingPayment />
                            : 'Proceed'
                          }
                        </button>
                      </div> 
                    </form>
                </React.Fragment>
              }            
            </div>
          </div> 
        </SlimContentCardWrapper>
      </AuthenticatedPagesLayoutWrapper>          
    )  
  }
}
export default withTimeout(withRouter(AirtimeTopup));