import React, { Component } from 'react'
import { Button, Container, Form, Col, Row } from 'react-bootstrap';
import Image from 'next/image';
import Router from "next/router";
import { commonPostService, getCookie, notifySuccess, notifyError, clientId, API_KEY } from '../../properties';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ApiCalendar from "react-google-calendar-api";

const config = {
    "clientId": clientId,
    "apiKey": API_KEY,
    "scope": 'https://www.googleapis.com/auth/calendar.events',
    "discoveryDocs": ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
}
const apiCalendar = new ApiCalendar(config);

class Home extends Component {
  constructor(props) {
    super(props)

    this.state = {
      userEmail: "",
      userPassword: "",
      showPassword: false,
      isLogin: false,
      isRememberMe: false,
      emailError: false,
      validEmailError: false,
      passwordError: false
    }
  }

  componentDidMount() {
    if (localStorage.getItem("loginDetails")) {
      let loginDetails = JSON.parse(localStorage.getItem("loginDetails"))
      if (loginDetails?.isRememberMe) {
        this.setState({
          userEmail: loginDetails?.email,
          userPassword: loginDetails?.password,
          isRememberMe: loginDetails?.isRememberMe
        }, () => {
          if (getCookie()) {
            Router.push("Dashboard");
          }
          else {
            this.handleLogin();
          }
        })
      }
    }
    localStorage.setItem('voiceurl', JSON.stringify([]));
    localStorage.setItem('voicetext', JSON.stringify([]));
    apiCalendar?.handleAuthClick()
  }

  //store the login details
  handleOnChange = (e) => {
    this.setState({
      [e.target.name]: e.target.name === 'isRememberMe' ? !this.state.isRememberMe : e.target.value,
      emailError: false,
      validEmailError: false,
      passwordError: false
    })
  }

  //validate login credentials before login
  handleValidate = () => {
    let { userEmail, userPassword } = this.state
    const emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
    if (userEmail.trim() === "" || userEmail.trim() === null) {
      this.setState({ emailError: true })
      return false;
    }
    if (!emailRegex.test(userEmail)) {
      this.setState({ validEmailError: true })
      return false;
    }
    if (userPassword.trim() === "" || userPassword.trim() === null) {
      this.setState({ passwordError: true })
      return false;
    }
    return true;
  }

  funcplayvoice =(msg)=> {
    var old_texts = JSON.parse(localStorage.getItem('voicetext'));
    old_texts.push(msg);
    localStorage.setItem('voicetext', JSON.stringify(old_texts))
}

  //handle the login function
  handleLogin = () => {
    if (this.handleValidate()) {
      let { userEmail, userPassword, isRememberMe } = this.state
      let params = {
        "email": userEmail,
        "password": userPassword
      }
      this.setState({ isLogin: true })
      commonPostService(`api/login`, params).then(res => {
        if (res.status) {
          let d = new Date();
          d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
          let expireTime = d.toUTCString();
          document.cookie = `X-XSRF-TOKEN = ${res.object?.token};expires=${expireTime};path=/`;
          let loginDetails = {
            "email": userEmail,
            "password": userPassword,
            "name": res?.object?.name,
            "isRememberMe": isRememberMe
          }
          localStorage.setItem("loginDetails", JSON.stringify(loginDetails));
          this.funcplayvoice("Hey I’m Eesa");
          this.funcplayvoice("an extension of you");
          Router.push("Dashboard")
        }
        else {
          notifyError(res.msg);
          this.setState({ isLogin: false })
        }
      })
    }
  }

  render() {

    const { userEmail, userPassword, showPassword, isLogin, isRememberMe, emailError, validEmailError, passwordError } = this.state
    return (
      <Container fluid>
        <Row>
          <Col md={12} className='login-page d-flex align-items-center justify-content-center'>
            <div className='login-container'>
              <div className='login-logo d-flex align-items-center justify-content-center'>
                <Image width={165} height={63} src="/eesaweb/images/eesa_logo.svg" alt='Logo' />
              </div>
              <div className='login-inner-cont'>
                <h3 className='text-uppercase fw-bold'>Login</h3>
                <Form>
                  <Form.Group as={Row} className="mb-3" controlId="formEmail">
                    <Form.Label column sm={2} className='fw-bold py-0 d-flex align-items-center'>Email Id</Form.Label>
                    <Col sm={10}>
                      <Form.Control type="email" name="userEmail" value={userEmail} onChange={(e) => this.handleOnChange(e)} placeholder="Enter email" />
                      {emailError || validEmailError ?
                        <Form.Text className="text-danger">
                          {emailError ? "Please enter the Email - id." : "Please enter the valid Email - id."}
                        </Form.Text> : ""
                      }
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-4" controlId="formPassword">
                    <Form.Label column sm={2} className='fw-bold py-0 d-flex align-items-center'>Password</Form.Label>
                    <Col sm={10}>
                      <div className='position-relative'>
                        <Form.Control type={showPassword ? 'text' : 'password'} placeholder="Password" name="userPassword" value={userPassword} onChange={(e) => this.handleOnChange(e)} className='pe-5' />
                        <div className={`ps-icon-show d-flex align-items-center justify-content-center position-absolute top-0 end-0 ${showPassword ? 'hide' : ''}`}>
                          <Image width={24} height={15} src="/eesaweb/images/eye.svg" alt='icon' onClick={() => { this.setState({ showPassword: !showPassword }) }} className='cursor-pointer' />
                        </div>
                      </div>
                      {passwordError ?
                        <Form.Text className="text-danger">
                          Please enter the password.
                        </Form.Text> : ""
                      }
                    </Col>
                  </Form.Group>
                  <Row>
                    <Col sm={{ span: 10, offset: 2 }}>
                      <div className='d-flex align-items-center justify-content-between mb-4 pb-1'>
                        <div className="form-check">
                          <input className="form-check-input" type="checkbox" name="isRememberMe" checked={isRememberMe} onChange={(e) => { this.handleOnChange(e) }} id="remberme" />
                          <label className="form-check-label" for="remberme">Remember me</label>
                        </div>
                        <h6 className='mb-0 fw-bold cursor-pointer'>Forgot Password?</h6>
                      </div>
                      <Button className={`w-100 rounded-pill fw-bold ${isLogin ? 'loading-btn' : ''}`} disabled={isLogin} onClick={() => { this.handleLogin() }}>Login</Button>
                      {/* <Button variant='danger' onClick={this.notifyError}>Notify ! Error</Button>
                      <Button variant='success' onClick={this.notifySuccess}>Notify ! Success</Button>
                      <Button variant='warning' onClick={this.notifyWarning}>Notify ! Warning</Button>
                      <Button variant='dark' onClick={this.notify}>Notify ! default</Button>
                      <Button variant='primary' onClick={this.notifyInfo}>Notify ! Info</Button> */}
                    </Col>
                  </Row>
                </Form>
              </div>
            </div>
          </Col>
        </Row>
        <ToastContainer />
      </Container>
    )
  }
}

export default Home
