import React, { useState, useEffect, createContext } from 'react';
import swal from '../../Utils/alert';
import Login from './Login.component';
import { loginUrl } from '../../Utils/baseUrl';
import { pinRegex } from '../../Utils/regex';
import { customPageTitle } from '../../Utils/customTitle';
import LoginPageLayoutWrapper from '../../Components/LoginPageLayoutWrapper/loginPageLayoutWrapper';

export const LoginContext = createContext();
const MainLogin = ({history}) => {
  customPageTitle('Login');
  const [state, setState] = useState({
    agentId: '',
    pin: '',
    loggingIn: false,
    loginError: false,
    errorMessage: ''
  })   

  useEffect(() => {
    sessionStorage.clear();
  }, [])

const onChange = (event, option) => {
  if(option){
    setState({
      ...state,
      [event.target.name]: pinRegex(event)
    });
  } else {
    setState({
      ...state,
      [event.target.name]: event.target.value
    })
  }
}

const loginButtonClick = (e) => {
  e.preventDefault();
  const { agentId, pin } = state;
    let reqBody = {
      agentId,
      pin,
    };

    if(pin === '' || agentId === ''){
      swal("Wrong Operation", "All Fields are Required", "error")
    } else {
      setState({
        ...state,
        loggingIn: true,
        loginError: false
      });
    fetch(`${loginUrl}`, {
      method: 'post',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(reqBody)
    })
    .then(response => response.json())
    .then(user => {
      setState({
        ...state,
        loggingIn: false
      })
      if(user.respCode === '00'){          
        sessionStorage.setItem('userDetails', JSON.stringify(user.respBody)); 
        redirectToDashboard(user.respBody.userType)    
      } else {
        setState({
          ...state, 
          loginError: true,
          errorMessage: user.respDescription
        })
      }  
    }).catch(err => {
      setState({
        ...state,
        loggingIn: false
      })
      swal("Login Failed", `${err}`, 'error')
    })
  }
}

const redirectToDashboard = (userType) => {
  // Redirect to Dashboard    
  userType = userType.toLowerCase();       
  if (userType.includes('master')) {
    history.push("/aggregator")
    } else if (userType.includes('operator') || userType.includes('agent')){
      history.push("/dashboard")
      // history.push("/open-an-account")

    } else {
      swal("Login Failed", 'User type unknown', 'error')              
    } 
}

  const { loggingIn, loginError, errorMessage, pin } = state;

  return (
    <LoginContext.Provider value={{
      loginButtonClick, 
      onChange, 
      loggingIn,
      loginError,
      errorMessage,
      pin
    }}>
      <LoginPageLayoutWrapper>
        <Login />   
      </LoginPageLayoutWrapper>
    </LoginContext.Provider>
  ); 
}

export default MainLogin;