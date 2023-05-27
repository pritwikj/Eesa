import React, { Component } from 'react'
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap'
import Layout from '../components/Layout'
import Image from 'next/image'
import { commonPostService, notifySuccess, notifyError } from '../../properties'
import Router from "next/router";
import { ToastContainer } from 'react-toastify';

class Configuration extends Component {
    constructor(props) {
        super(props)

        this.state = {
            configurationList: [],
            isSpin: false
        }
    }

    componentDidMount() {
        this.getConfigurationList();
    }

    //Get the configuratin list details
    getConfigurationList = () => {
        this.setState({ isSpin: true })
        commonPostService(`api/configuration-list`).then(res => {
            if (res.status) {
                res.object?.map(val => {
                    val.dataSet = val.dataset_names.split(',')
                })
                this.setState({ configurationList: res?.object, isSpin: false })
            }
            else {
                notifyError(res.msg);
                this.setState({ isSpin: false })
            }
        })
    }

    handleRoute = (val) => {
        let configDetails = {
            configId: val.config_id,
            userEmail: '',
            userPassword: '',
            type: val.config_data_type
        }
        localStorage.setItem("configDetails", JSON.stringify(configDetails))
        Router.push('ConfigurationReport')
    }
    render() {
        const { configurationList, isSpin } = this.state
        return (
            <>
                <Layout page={{ pageName: 'Configuration' }}>
                    <Container fluid className='config-page'>
                        <Row>
                            <Col md={12}>
                                <div className='d-flex align-items-center justify-content-between py-3 pe-3 me-1'>
                                    <h3 className='mb-0 fw-bold'>Configuration</h3>
                                    <Button className='config-btn d-flex align-items-center justify-content-center fw-bold' onClick={() => { Router.push('NewConfig') }}>
                                        <Image width={16} height={16} src="/eesaweb/images/plus-white.svg" alt='icon' />
                                        <span className='ms-2'>Configuration</span>
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <div className='config-container d-flex flex-wrap'>
                                    {configurationList?.map((res, i) => (
                                        res?.config_data_type === 'CHUPS' &&
                                        <div className='each-config p-3' key={i} onClick={() => { this.handleRoute(res) }}>
                                            <div className='mb-2 pb-1'>
                                                <div className='d-flex align-items-center'>
                                                    <div className='d-flex align-items-center me-2'>
                                                        <Image width={16} height={16} src={`/eesaweb/images/${res?.config_data_type === 'CHUPS' ? 'chups' : 'salesforce'}-logo.svg`} alt='icon' />
                                                    </div>
                                                    <h5 className='mb-0 fw-bold'>{res?.config_data_type}</h5>
                                                </div>
                                                <p className='mb-0'>{res?.cr_dt}</p>
                                            </div>
                                            <h6 className='fw-bold mb-1'>{res?.dataSet?.length} Datasets</h6>
                                            <p className='mb-0'>{res?.dataset_names}</p>
                                        </div>
                                    ))}
                                    {/* <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/chups-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Chups</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/oracle-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Oracle BG</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/salesforce-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Salesforce</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/csv-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>CSV Upload</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/salesforce-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Salesforce</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/chups-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Chups</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/oracle-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Oracle BG</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/salesforce-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Salesforce</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/csv-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>CSV Upload</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/salesforce-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Salesforce</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/chups-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Chups</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/oracle-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Oracle BG</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/salesforce-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>Salesforce</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/csv-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>CSV Upload</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
                                    </div>

                                    <div className='each-config p-3'>
                                        <div className='mb-2 pb-1'>
                                            <div className='d-flex align-items-center'>
                                                <div className='d-flex align-items-center me-2'>
                                                    <Image width={16} height={16} src="/eesaweb/images/csv-logo.svg" alt='icon' />
                                                </div>
                                                <h5 className='mb-0 fw-bold'>CSV Upload</h5>
                                            </div>
                                            <p className='mb-0'>May 10, 2023 - 10:30 AM</p>
                                        </div>
                                        <h6 className='fw-bold mb-1'>35 Datsets</h6>
                                        <p className='mb-0'>Performance, Sales, Profit, Team Member, Salary, Expense, Attendance ...</p>
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

export default Configuration
