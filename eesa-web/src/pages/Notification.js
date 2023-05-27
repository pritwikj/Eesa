import React, { Component } from 'react'
import Layout from '../components/Layout'
import { Col, Container, Row, Spinner } from 'react-bootstrap'
import Image from 'next/image';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { commonPostService, notifySuccess, notifyError } from '../../properties';
import { ToastContainer } from 'react-toastify';

class Notification extends Component {
    constructor(props) {
        super(props)

        this.state = {
            notificationList: [],
            isSpin: false
        }
    }

    componentDidMount() {
        this.getNotificationList();
    }

    //Get the Notification List
    getNotificationList = () => {
        this.setState({ isSpin: true })
        commonPostService(`api/notification-list`).then(res => {
            this.setState({ isSpin: false })
            if (res.status) {
                this.setState({ notificationList: res?.object })
            }
            else {
                notifyError(res.msg);
            }
        })
    }
    render() {
        const { notificationList, isSpin } = this.state
        return (
            <>
                <Layout page={{ pageName: 'Notification' }}>
                    <Container fluid className='task-page notification-page py-3'>
                        <Row>
                            <Col sm={{ order: "last" }} className='task_rightside_container'></Col>
                            <Col sm={{ order: "first" }}>
                                <h4 className='mb-2 pb-1 fw-bold'>Notifications</h4>
                                <div className='all-tasks'>
                                    {notificationList?.map((res, i) => (
                                        <div className='each-task d-flex border' key={i}>
                                            <div className='task-status pt-2 mt-1 d-flex justify-content-center'>
                                                <div className='circular_icon'>
                                                    <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                        <Image width={17} height={21} src="/eesaweb/images/noti-icon-blue-big.svg" alt='icon' />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='task pe-3'>
                                                <p className='task_name'>{res?.cr_dt}</p>
                                                <h5 className='mb-0 fw-bold task_info'>{res?.notification}</h5>
                                                <p className='task_discrip'>
                                                    {res?.notification_desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {/* <div className='each-task d-flex border'>
                                        <div className='task-status pt-2 mt-1 d-flex justify-content-center'>
                                            <div className='circular_icon'>
                                                <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                    <Image width={17} height={21} src="/eesaweb/images/noti-icon-blue-big.svg" alt='icon' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='task pe-3'>
                                            <p className='task_name'>11:30 PM</p>
                                            <h5 className='mb-0 fw-bold task_info'>Etiam ut elit vehicula, mattis elit ac, semper lacus </h5>
                                            <p className='task_discrip'>
                                                Pellentesque tincidunt tristique neque, eget venenatis enim gravida quis. Fusce at egestas libero. Cras convallis egestas ullamcorper. Suspendisse sed ultricies nisl, pharetra rutrum maurisestibulum at massa dui.
                                            </p>
                                        </div>
                                    </div>

                                    <div className='each-task d-flex border completed'>
                                        <div className='task-status pt-2 mt-1 d-flex justify-content-center'>
                                            <div className='circular_icon'>
                                                <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                    <Image width={17} height={21} src="/eesaweb/images/noti-icon-gray.svg" alt='icon' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='task pe-3'>
                                            <p className='task_name'>11:30 PM</p>
                                            <h5 className='mb-0 fw-bold task_info'>Order Chicken Pizza at Pizza Hut for Lunch</h5>
                                            <p className='task_discrip'>
                                                Pellentesque tincidunt tristique neque, eget venenatis enim gravida quis. Fusce at egestas libero. Cras convallis egestas ullamcorper. Suspendisse sed ultricies nisl, pharetra rutrum maurisestibulum at massa dui.
                                            </p>
                                        </div>
                                    </div>

                                    <div className='each-task d-flex border completed'>
                                        <div className='task-status pt-2 mt-1 d-flex justify-content-center'>
                                            <div className='circular_icon'>
                                                <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                    <Image width={17} height={21} src="/eesaweb/images/noti-icon-gray.svg" alt='icon' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='task pe-3'>
                                            <p className='task_name'>11:30 PM</p>
                                            <h5 className='mb-0 fw-bold task_info'>Order Chicken Pizza at Pizza Hut for Lunch <span className='sub-text'>(stephen@chups.com)</span> </h5>
                                        </div>
                                    </div> */}
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

export default Notification
