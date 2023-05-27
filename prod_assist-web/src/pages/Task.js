import React, { Component } from 'react'
import Layout from '../components/Layout'
import { Col, Container, Row, Spinner } from 'react-bootstrap'
import Image from 'next/image';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { commonPostService, notifySuccess, notifyError } from '../../properties';
import moment from 'moment'
import { ToastContainer } from 'react-toastify';

class Task extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDate: new Date(),
            taskList: [],
            isSpin: false
        }
    }

    componentDidMount() {
        this.getTaskList(this.state.selectedDate);
    }

    //Get the current date task details
    getTaskList = (date) => {
        let params = {
            "input_date": moment(date).format("YYYY-MM-DD")
        }
        this.setState({ isSpin: true })
        commonPostService(`api/task-list`, params).then(res => {
            this.setState({ isSpin: false })
            if (res.status) {
                this.setState({ taskList: res?.object })
            }
            else {
                notifyError(res.msg);
            }
        })
    }

    //Get the task details based on the date
    handleOnChange = (date) => {
        this.setState({ selectedDate: date }, () => {
            this.getTaskList(date);
        })
    }

    //To delete the waiting task
    handleDeleteTask = (val) => {
        let params = {
            "task_id": val?.task_id
        }
        this.setState({ isSpin: true })
        commonPostService(`api/task-delete`, params).then(res => {
            this.setState({ isSpin: false })
            if (res.status) {
                notifySuccess(res.msg);
                this.getTaskList(this.state.selectedDate);
            }
            else {
                notifyError(res.msg);
            }
        })
    }
    render() {
        const { taskList, selectedDate, isSpin } = this.state
        return (
            <>
                <Layout page={{ pageName: 'Task' }}>
                    <Container fluid className='task-page py-3'>
                        <Row>
                            <Col sm={{ order: "last" }} className='task_rightside_container'>
                                <div className='cust-calendar'>
                                    <Calendar
                                        onChange={this.handleOnChange}
                                        value={selectedDate}
                                        maxDate={new Date()}
                                    />
                                </div>
                            </Col>
                            <Col sm={{ order: "first" }}>
                                <h4 className='mb-2 pb-1 fw-bold'>Tasks</h4>
                                <div className='all-tasks'>
                                    {taskList?.map((res, i) => (
                                        <div className={`each-task d-flex align-items-center border ${res?.task_status === 'C' && 'completed'}`} key={i}>
                                            <div className='task-status d-flex align-items-center justify-content-center'>
                                                <div className='circular_icon'>
                                                    <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                        <Image width={res?.task_status === 'C' ? 18 : 32} height={res?.task_status === 'C' ? 18 : 32} src={`/eesaweb/images/${res?.task_status === 'P' ? 'orange-progress-circel' : res?.task_status === 'C' ? 'green-check-only' : 'noti-icon-blue-big'}.svg`} alt='icon' />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className='task pe-3'>
                                                <p className='task_name'>{res?.task_dt}</p>
                                                <h5 className='mb-0 fw-bold task_info'>{res?.task_desc}</h5>
                                            </div>
                                            {res?.task_status === 'W' &&
                                                <div className='delete_task' onClick={() => { this.handleDeleteTask(res) }}>
                                                    <Image width={10} height={10} src="/eesaweb/images/cross-gray.svg" alt='icon' />
                                                </div>
                                            }
                                        </div>
                                    ))}

                                    {/* <div className='each-task d-flex align-items-center border completed'>
                                        <div className='task-status d-flex align-items-center justify-content-center'>
                                            <div className='circular_icon'>
                                                <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                    <Image width={18} height={13} src="/eesaweb/images/green-check-only.svg" alt='icon' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='task pe-3'>
                                            <p className='task_name'>11:30 PM</p>
                                            <h5 className='mb-0 fw-bold task_info'>Order Chicken Pizza at Pizza Hut for Lunch <span className='sub-text'>(stephen@chups.com)</span> </h5>
                                        </div>
                                        <div className='delete_task'>
                                            <Image width={10} height={10} src="/eesaweb/images/cross-gray.svg" alt='icon' />
                                        </div>
                                    </div>

                                    <div className='each-task d-flex align-items-center border completed'>
                                        <div className='task-status d-flex align-items-center justify-content-center'>
                                            <div className='circular_icon'>
                                                <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                    <Image width={18} height={13} src="/eesaweb/images/green-check-only.svg" alt='icon' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='task pe-3'>
                                            <p className='task_name'>11:30 PM</p>
                                            <h5 className='mb-0 fw-bold task_info'>Order Chicken Pizza at Pizza Hut for Lunch <span className='sub-text'>(stephen@chups.com)</span> </h5>
                                        </div>
                                        <div className='delete_task'>
                                            <Image width={10} height={10} src="/eesaweb/images/cross-gray.svg" alt='icon' />
                                        </div>
                                    </div>

                                    <div className='each-task d-flex align-items-center border completed'>
                                        <div className='task-status d-flex align-items-center justify-content-center'>
                                            <div className='circular_icon'>
                                                <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                    <Image width={18} height={13} src="/eesaweb/images/green-check-only.svg" alt='icon' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='task pe-3'>
                                            <p className='task_name'>11:30 PM</p>
                                            <h5 className='mb-0 fw-bold task_info'>Order Chicken Pizza at Pizza Hut for Lunch <span className='sub-text'>(stephen@chups.com)</span> </h5>
                                        </div>
                                        <div className='delete_task'>
                                            <Image width={10} height={10} src="/eesaweb/images/cross-gray.svg" alt='icon' />
                                        </div>
                                    </div>

                                    <div className='each-task d-flex align-items-center border completed'>
                                        <div className='task-status d-flex align-items-center justify-content-center'>
                                            <div className='circular_icon'>
                                                <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                    <Image width={18} height={13} src="/eesaweb/images/green-check-only.svg" alt='icon' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='task pe-3'>
                                            <p className='task_name'>11:30 PM</p>
                                            <h5 className='mb-0 fw-bold task_info'>Order Chicken Pizza at Pizza Hut for Lunch <span className='sub-text'>(stephen@chups.com)</span> </h5>
                                        </div>
                                        <div className='delete_task'>
                                            <Image width={10} height={10} src="/eesaweb/images/cross-gray.svg" alt='icon' />
                                        </div>
                                    </div>

                                    <div className='each-task d-flex align-items-center border completed'>
                                        <div className='task-status d-flex align-items-center justify-content-center'>
                                            <div className='circular_icon'>
                                                <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                    <Image width={18} height={13} src="/eesaweb/images/green-check-only.svg" alt='icon' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='task pe-3'>
                                            <p className='task_name'>11:30 PM</p>
                                            <h5 className='mb-0 fw-bold task_info'>Order Chicken Pizza at Pizza Hut for Lunch <span className='sub-text'>(stephen@chups.com)</span> </h5>
                                        </div>
                                        <div className='delete_task'>
                                            <Image width={10} height={10} src="/eesaweb/images/cross-gray.svg" alt='icon' />
                                        </div>
                                    </div>

                                    <div className='each-task d-flex align-items-center border completed'>
                                        <div className='task-status d-flex align-items-center justify-content-center'>
                                            <div className='circular_icon'>
                                                <div className='circular_icon_child d-flex align-items-center justify-content-center'>
                                                    <Image width={18} height={13} src="/eesaweb/images/green-check-only.svg" alt='icon' />
                                                </div>
                                            </div>
                                        </div>
                                        <div className='task pe-3'>
                                            <p className='task_name'>11:30 PM</p>
                                            <h5 className='mb-0 fw-bold task_info'>Order Chicken Pizza at Pizza Hut for Lunch <span className='sub-text'>(stephen@chups.com)</span> </h5>
                                        </div>
                                        <div className='delete_task'>
                                            <Image width={10} height={10} src="/eesaweb/images/cross-gray.svg" alt='icon' />
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

export default Task
