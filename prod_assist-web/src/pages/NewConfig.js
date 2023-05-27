import React, { Component } from 'react'
import { Container, Row, Col, Button, Modal, Form } from 'react-bootstrap'
import Layout from '../components/Layout'
import Image from 'next/image'
import Router from "next/router";
import { ToastContainer } from 'react-toastify';
import { notifyError } from '../../properties';

class NewConfig extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModal: false,
            emailId: '',
            password: '',
            showPassword: false,
            isAccept: false,
            selectedConfiguration: ''
        }
    }

    handleOnChange = (e) => {
        this.setState({ [e.target.name]: e.target.value })
    }

    handleConnect = () => {
        let { emailId, password, isAccept, selectedConfiguration } = this.state
        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
        if (emailId.trim() === '') {
            notifyError('Please enter the Email-id')
            return false;
        }
        if (!emailRegex.test(emailId)) {
            notifyError('Please enter the valid Email-id')
            return false;
        }
        if (password.trim() === '') {
            notifyError('Please enter the password');
            return false;
        }
        if (!isAccept) {
            notifyError("Please select the Terms & Conditions");
            return false;
        }
        let newConfig = {
            configId: 0,
            userEmail: emailId,
            userPassword: password,
            type: selectedConfiguration
        }
        localStorage.setItem("configDetails", JSON.stringify(newConfig))
        Router.push('ConfigurationReport')
    }
    render() {
        const { showModal, emailId, password, showPassword, isAccept } = this.state
        return (
            <>
                <Layout page={{ pageName: 'Configuration' }}>
                    <Container fluid className='newconfig-page'>
                        <Row>
                            <Col>
                                <div className='d-flex align-items-center mb-3 py-3'>
                                    <div className='d-flex align-items-center me-2 cursor-pointer' onClick={() => { Router.back() }}>
                                        <Image width={24} height={24} src="/eesaweb/images/backarrow.svg" alt='icon' />
                                    </div>
                                    <h3 className='mb-0 ms-1'>New Configuration</h3>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col>
                                <h1>Collect Data</h1>
                                <p className='w-50'>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vel diam porttitor, aliquet sapien vel, iaculis ante. Nullam eu sagittis mi, non vehicula leo.</p>
                                <div className='newconfig-container d-flex'>
                                    <div className='each-newconfig d-flex align-items-center justify-content-center flex-column' onClick={() => { this.setState({ showModal: true, selectedConfiguration: 'CHUPS' }) }}>
                                        <div className='each-newconfig-icon d-flex align-items-center justify-content-center me-2 mb-2 pb-1'>
                                            <Image width={55} height={78} src="/eesaweb/images/chups-logo.svg" alt='icon' />
                                        </div>
                                        <h4 className='mb-0'>Chups</h4>
                                    </div>
                                    {/* <div className='each-newconfig d-flex align-items-center justify-content-center flex-column' onClick={this.handleConnection}>
                                        <div className='each-newconfig-icon d-flex align-items-center justify-content-center me-2 mb-2 pb-1'>
                                            <Image width={85} height={85} src="/eesaweb/images/salesforce-logo.svg" alt='icon' />
                                        </div>
                                        <h4 className='mb-0'>Salesforce</h4>
                                    </div>
                                    <div className='each-newconfig d-flex align-items-center justify-content-center flex-column'>
                                        <div className='each-newconfig-icon d-flex align-items-center justify-content-center me-2 mb-2 pb-1'>
                                            <Image width={85} height={85} src="/eesaweb/images/oracle-logo.svg" alt='icon' />
                                        </div>
                                        <h4 className='mb-0'>Oracle DB</h4>
                                    </div>
                                    <div className='each-newconfig d-flex align-items-center justify-content-center flex-column'>
                                        <div className='each-newconfig-icon d-flex align-items-center justify-content-center me-2 mb-2 pb-1'>
                                            <Image width={85} height={85} src="/eesaweb/images/csv-logo.svg" alt='icon' />
                                        </div>
                                        <h4 className='mb-0'>CSV File Upload</h4>
                                    </div> */}
                                </div>
                            </Col>
                        </Row>
                        <ToastContainer />
                    </Container>
                </Layout>

                <Modal centered show={showModal} onHide={() => { this.setState({ showModal: false }) }} backdropClassName="custom-graycolor" className='new_connection'>
                    <Modal.Header closeButton className='border-bottom-0 pb-2'>
                        <Modal.Title>Connect to Chups</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group as={Row} className="mb-3" controlId="formEmail">
                                <Form.Label column sm={2} className='fw-bold'>Email Id</Form.Label>
                                <Col sm={10}>
                                    <Form.Control type="email" name="emailId" value={emailId} onChange={(e) => { this.handleOnChange(e) }} placeholder="Enter email" />
                                    <Form.Text className="text-muted">
                                        {" We'll never share your email with anyone else."}
                                    </Form.Text>
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3" controlId="formPassword">
                                <Form.Label column sm={2} className='fw-bold'>Password</Form.Label>
                                <Col sm={10}>
                                    <div className='position-relative'>
                                        <Form.Control type={`${showPassword ? 'text' : 'password'}`} placeholder="Password" name="password" value={password} onChange={(e) => { this.handleOnChange(e) }} className='pe-5' />
                                        <div className={`ps-icon-show d-flex align-items-center justify-content-center position-absolute top-0 end-0 ${showPassword ? 'hide' : ''}`} onClick={() => { this.setState({ showPassword: !showPassword }) }}>
                                            <Image width={24} height={15} src="/eesaweb/images/eye.svg" alt='icon' />
                                        </div>
                                    </div>

                                    <Form.Text className="text-muted">
                                        {"We'll never share your email with anyone else."}
                                    </Form.Text>
                                </Col>
                            </Form.Group>
                            <Row>
                                <Col sm={{ span: 10, offset: 2 }}>
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" value="" checked={isAccept} onChange={(e) => { this.setState({ isAccept: !isAccept }) }} id="flexCheckDefault" />
                                        <label className="form-check-label" for="flexCheckDefault">
                                            Accept our <strong>Terms & Condition</strong> & <strong>Privacy Policy</strong>
                                        </label>
                                    </div>
                                </Col>
                            </Row>
                            {/* <Form.Group className="mb-3" controlId="formBasicCheckbox">
                                <Form.Check type="checkbox" label="Check me out" />
                            </Form.Group> */}
                            {/* <Button variant="primary" type="submit">
                                Submit
                            </Button> */}
                        </Form>
                    </Modal.Body>
                    <Modal.Footer className='border-top-0'>
                        <Button variant="light" onClick={() => { this.setState({ showModal: false, emailId: '', password: '', isAccept: false, showPassword: false }) }}>
                            Back
                        </Button>
                        <Button variant="primary" className='ms-2' onClick={() => { this.handleConnect() }}>
                            Connect
                        </Button>
                    </Modal.Footer>
                </Modal>
            </>
        )
    }
}

export default NewConfig
