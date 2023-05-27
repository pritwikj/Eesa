import React, { Component } from 'react'
import Layout from '../components/Layout'
import { Col, Container, Row, Spinner } from 'react-bootstrap'
import Image from 'next/image'
import { commonPostService, notifySuccess, notifyError } from '../../properties'
import Router from "next/router";
import { ToastContainer } from 'react-toastify';

class Profile extends Component {
    constructor(props) {
        super(props)
        this.state = {
            profileDetails: {},
            isSpin: false
        }
    }

    componentDidMount() {
        this.getProfileDetails()
    }

    //Get the profile details
    getProfileDetails = () => {
        this.setState({ isSpin: true })
        commonPostService(`api/user-profile`).then(res => {
            if (res.status) {
                this.setState({ profileDetails: res?.object, isSpin: false })
            }
            else {
                this.setState({ isSpin: false })
                notifyError(res.msg);
            }
        })
    }

    //Logout from the Easa website
    handleLogOut = () => {
        document.cookie = 'X-XSRF-TOKEN = null;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        localStorage.clear()
        Router.push("/")
    }

    render() {
        const { profileDetails, isSpin } = this.state
        return (
            <>
                <Layout page={{ pageName: 'Profile' }}>
                    <Container fluid className='profile-page py-3 px-md-4'>
                        <Row>
                            <Col xs={12} className=''>
                                <h3 className='mb-3 pb-1 fw-bold'>My Profile</h3>
                                <div className='profile-header d-flex align-items-center p-3 mb-5'>
                                    <div className='profile-image position-relative me-4'>
                                        {/* <Image fill sizes="100%" src={profilePic} alt='Sample Image is here I am adding some more text' /> */}
                                        <Image fill sizes="100%" src="/eesaweb/images/image.svg" alt='Sample Image' />
                                    </div>
                                    <h2 className='mb-0 text-capitalize ms-1 fw-bold'>{profileDetails?.user_name}</h2>
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <div className="form-floating mb-4">
                                    <input type="text" className="form-control" id="your_name" placeholder="Your Name" name="name" value={profileDetails?.user_name} readOnly />
                                    <label for="your_name"><span>Your Name</span></label>
                                </div>
                                <div className="form-floating mb-4">
                                    <input type="text" className="form-control" id="phone_no" placeholder="Phone No" name="phoneNo" value={profileDetails?.user_phone} readOnly />
                                    <label for="phone_no"><span>Phone No</span></label>
                                </div>
                                <div className="form-floating mb-4">
                                    <input type="email" className="form-control" id="email_id" placeholder=" " name="email" value={profileDetails?.user_email} readOnly />
                                    <label for="email_id"><span>Email</span></label>
                                </div>
                                <div className='d-flex align-items-center icon-text-cs text-capitalize mb-4'>
                                    <div className='d-flex align-items-center justify-content-center me-3'>
                                        <Image width={18} height={18} src="/eesaweb/images/phone.svg" alt='icon' />
                                    </div>
                                    <h5 className='mb-0 ms-2 fw-bold'>Contact Us</h5>
                                </div>
                                <div className='d-flex align-items-center icon-text-logout text-capitalize mb-4'>
                                    <div className='d-flex align-items-center justify-content-center me-3'>
                                        <Image width={18} height={18} src="/eesaweb/images/logout.svg" alt='icon' />
                                    </div>
                                    <h5 className='ms-2 mb-0 fw-bold cursor-pointer' onClick={() => { this.handleLogOut() }}>Logout</h5>
                                </div>
                            </Col>
                        </Row>
                        <ToastContainer />
                    </Container>
                </Layout>
                {isSpin &&
                    <div className='fullpage-loader'>
                        <div className='d-flex align-items-center justify-content-center flex-column'>
                            <Spinner animation="border" role="status" variant="light">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                    </div>
                }
            </>
        )
    }
}

export default Profile
