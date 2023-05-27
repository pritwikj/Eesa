import React, { Component } from 'react'
import { Container, Row, Col, Button, Modal, Form, Table, Spinner } from 'react-bootstrap'
import Layout from '../components/Layout'
import Image from 'next/image'
import Select from 'react-select'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { commonPostService, notifySuccess, notifyError } from '../../properties'
import Router from "next/router";
import moment from 'moment'
import { ToastContainer } from 'react-toastify';

const blockInvalidDateChar = e => !/^[0-9/]+$/.test(e.key) && e.key !== "Backspace" && e.preventDefault();

class ConfigurationReport extends Component {
    constructor(props) {
        super(props);
        this.state = {
            startDate: new Date(),
            configDetails: {},
            reportList: [],
            reportDetails: {},
            isSave: false,
            searchText: '',
            isSpin: false
        }
    }

    componentDidMount() {
        if (localStorage.getItem("configDetails")) {
            let { configDetails } = this.state
            configDetails = JSON.parse(localStorage.getItem("configDetails"))
            this.setState({ configDetails }, () => {
                this.getReportList();
            })
        }
    }

    //Get the report list
    getReportList = () => {
        this.setState({ isSpin: true })
        commonPostService(`api/report-list`).then(res => {
            if (res.status) {
                let { reportList } = this.state
                res?.object?.map(val => {
                    reportList.push({
                        reportName: val,
                        isSelected: false,
                        reportFetchTypeOptions: [
                            { value: 'Last 90 Days', label: 'Last 90 Days' },
                            { value: 'Custom From Date', label: 'Custom From Date' },
                        ],
                        reportFetchType: '',
                        isCustomDate: false,
                        isEveryDay: false,
                        customDate: '',
                        customTime: '',
                        rId: Math.floor(Math.random() * 90000) + 10000
                    })
                })
                this.setState({ reportList, isSpin: false }, () => {
                    if (this.state.configDetails.configId) {
                        this.getReportDetails(this.state.configDetails?.configId)
                    }
                })
            }
            else {
                this.setState({ isSpin: false })
                notifyError(res.msg);
            }
        })
    }

    //Get the report details
    getReportDetails = (cId) => {
        let params = {
            "config_id": cId
        }
        this.setState({ isSpin: true })
        commonPostService(`api/get-configuration`, params).then(res => {
            if (res.status) {
                let { reportList, configDetails } = this.state
                reportList?.map(report => {
                    res?.object?.map(val => {
                        if (report.reportName.trim() === val.dataset_name.trim()) {
                            configDetails.configId = val?.config_id
                            report.isSelected = true
                            report.customDate = new Date(moment(val?.dataset_fetch_from_date).format('YYYY-MM-DD'))
                            report.reportFetchType = {
                                value: val?.dataset_fetch_type === 'LAST_90_DAYS' ? 'Last 90 Days' : 'Custom From Date',
                                label: val?.dataset_fetch_type === 'LAST_90_DAYS' ? 'Last 90 Days' : 'Custom From Date'
                            }
                            report.isCustomDate = val?.dataset_fetch_type === 'CUSTOM_FROM_DATE'
                            report.isEveryDay = val?.dataset_run_time_type === 'E'
                            report.customTime = val?.dataset_run_time !== null ? val?.dataset_run_time.substr(0, 5) : ''
                        }
                    })
                })
                this.setState({ reportDetails: res?.object, reportList, isSpin: false })
            }
            else {
                notifyError(res.msg);
                this.setState({ isSpin: false })
            }
        })
    }

    //store the report details when user edit
    handleOnChange = (e, val, name, action) => {
        let { reportList } = this.state
        if (name === 'toggle') {
            reportList?.map(res => {
                if (val.rId === res.rId) {
                    res.isSelected = !res.isSelected
                    res.reportFetchType = ''
                    res.isCustomDate = false
                    res.customDate = ''
                    res.isEveryDay = false
                    res.customTime = ''
                }
            })
        }
        else if (name === 'update') {
            reportList?.map(res => {
                if (val.rId === res.rId) {
                    res.reportFetchType = e
                    res.isCustomDate = e.value === 'Custom From Date'
                    res.customDate = ''
                }
            })
        }
        else if (name === 'date') {
            reportList?.map(res => {
                if (val.rId === res.rId) {
                    res.customDate = e
                }
            })
        }
        else if (name === 'duration') {
            reportList?.map(res => {
                if (val.rId === res.rId) {
                    res.isEveryDay = action === 'everyDay'
                    res.customTime = ''
                }
            })
        }
        else {
            reportList?.map(res => {
                if (val.rId === res.rId) {
                    res.customTime = e.target.value
                }
            })
        }
        this.setState({ reportList })
    }

    //validate the datas before save
    handleValidate = () => {
        let { reportList } = this.state
        if (reportList?.every(res => !res.isSelected)) {
            notifyError('Please select atleast one report')
            return false;
        }
        if (reportList?.filter(res => res.isSelected)?.some(val => val.reportFetchType === '')) {
            notifyError('Please select the date')
            return false;
        }
        if (reportList?.filter(res => res.isSelected && res.reportFetchType.value === 'Custom From Date')?.some(val => val.customDate === '')) {
            notifyError('Please enter the date')
            return false;
        }
        if (reportList?.filter(res => res.isSelected && res.isEveryDay)?.some(val => val.customTime === '')) {
            notifyError('Please select the time')
            return false;
        }
        return true;
    }

    //save the report details
    handleSave = () => {
        if (this.handleValidate()) {
            let { reportList, configDetails } = this.state
            let params = {
                "config_id": configDetails?.configId,
                "config_data_type": configDetails?.type,
                "config_user_login_id": configDetails?.userEmail !== '' ? configDetails?.userEmail : null,
                "config_user_password": configDetails?.userPassword !== '' ? configDetails?.userPassword : null,
                "config_maps": reportList?.filter(res => res?.isSelected)?.map(res => {
                    return {
                        "dataset_name": res?.reportName,
                        "dataset_fetch_type": res?.reportFetchType?.value === 'Custom From Date' ? 'CUSTOM_FROM_DATE' : 'LAST_90_DAYS',
                        "dataset_fetch_from_date": res?.reportFetchType?.value === 'Custom From Date' ? moment(res?.customDate).format("YYYY-MM-DD") : null,
                        "dataset_run_time_type": res?.isEveryDay ? 'E' : 'O',
                        "dataset_run_time": res?.isEveryDay ? moment(res?.customTime, "HH:mm:ss").format("hh:mm A") : null
                    }
                })
            }
            this.setState({ isSave: true, isSpin: true })
            commonPostService(`api/configuration-save-update`, params).then(res => {
                this.setState({ isSave: false, isSpin: false })
                if (res.status) {
                    notifySuccess(res.msg);
                    Router.push('Configuration');
                }
                else {
                    notifyError(res.msg);
                }
            })
        }
    }

    render() {
        const { configDetails, reportList, isSave, searchText, isSpin } = this.state

        return (
            <>
                <Layout page={{ pageName: 'Configuration' }}>
                    <Container fluid className='configreport-page px-md-4'>
                        <Row>
                            <Col className=''>
                                <div className='d-flex align-items-center justify-content-between mb-4 py-3 config-report-header border-bottom'>
                                    <div>
                                        <div className='d-flex align-items-center'>
                                            <div className='d-flex align-items-center me-2 cursor-pointer' onClick={() => { Router.back() }}>
                                                <Image width={24} height={24} src="/eesaweb/images/backarrow.svg" alt='icon' />
                                            </div>
                                            <h3 className='mb-0 ms-1 fw-bold'>Data from {configDetails.type}</h3>
                                        </div>
                                        <p className='mb-0'>Created: May 10, 2023 - 10:30 AM</p>
                                    </div>

                                    <Button type="button" className='fw-bold' disabled={isSave} onClick={() => { this.handleSave() }}>Save</Button>
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                <div className='position-relative report-search'>
                                    <Form.Control type="text" name="searchText" value={searchText} onChange={(e) => { this.setState({ searchText: e.target.value }) }} placeholder="Search Report" className='ps-5' />
                                </div>
                            </Col>
                        </Row>

                        <Row>
                            <Col>
                                <Table striped hover>
                                    <thead>
                                        <tr>
                                            <th>Toggle</th>
                                            <th>Report Name</th>
                                            <th>Update</th>
                                            <th>Run Report</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportList?.filter(res => {
                                            if (searchText.trim() === '') {
                                                return res;
                                            }
                                            else if (res?.reportName?.trim().toLowerCase().includes(searchText?.trim().toLowerCase())) {
                                                return res;
                                            }
                                        })?.map((report, i) => (
                                            <tr key={i}>
                                                <td>
                                                    <div className="form-check form-switch">
                                                        <input className="form-check-input" checked={report?.isSelected} onChange={(e) => { this.handleOnChange(e, report, 'toggle') }} type="checkbox" id={'switchId' + report?.rId} />
                                                    </div>
                                                </td>
                                                <td>{report?.reportName}</td>
                                                {report?.isSelected &&
                                                    <>
                                                        <td>
                                                            <div className='d-flex align-items-center'>
                                                                <div className='select_report_date me-4'>
                                                                    <Select
                                                                        options={report?.reportFetchTypeOptions}
                                                                        value={report?.reportFetchType}
                                                                        onChange={(e) => { this.handleOnChange(e, report, 'update') }}
                                                                        classNamePrefix="essa_results"
                                                                    />
                                                                </div>
                                                                {report?.isCustomDate &&
                                                                    <div className='choose_date'>
                                                                        <DatePicker
                                                                            dateFormat="dd/MM/yyyy"
                                                                            placeholderText={`eg. DD/MM/YYYY`}
                                                                            maxDate={new Date()}
                                                                            selected={report?.customDate}
                                                                            onChange={(e) => { this.handleOnChange(e, report, 'date') }}
                                                                            onKeyDown={blockInvalidDateChar}
                                                                        />
                                                                    </div>
                                                                }
                                                            </div>

                                                        </td>
                                                        <td>
                                                            <div className='d-flex'>
                                                                <div class="form-check me-4">
                                                                    <input className="form-check-input" type="radio" checked={!report?.isEveryDay} onChange={(e) => { this.handleOnChange(e, report, 'duration', 'oneTime') }} name={'fr1' + report?.rId} id={'fr1' + report?.rId} />
                                                                    <label className="form-check-label" for={'fr1' + report?.rId}>
                                                                        One Time
                                                                    </label>
                                                                </div>
                                                                <div class="form-check">
                                                                    <input className="form-check-input" type="radio" checked={report?.isEveryDay} onChange={(e) => { this.handleOnChange(e, report, 'duration', 'everyDay') }} name={'fr2' + report?.rId} id={'fr2' + report?.rId} />
                                                                    <label className="form-check-label" for={'fr2' + report?.rId}>
                                                                        Everyday
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {report?.isEveryDay &&
                                                                <div className='d-flex cust-time'>
                                                                    <input type="time" id="appt" name="time" value={report?.customTime} onChange={(e) => { this.handleOnChange(e, report, 'time') }} />
                                                                    {/* <select className="form-select" aria-label="Default select example">
                                                                        <option value="AM" selected>AM</option>
                                                                        <option value="PM">PM</option>
                                                                    </select> */}
                                                                </div>
                                                            }
                                                        </td>
                                                    </>
                                                }
                                            </tr>
                                        ))}
                                        {/* <tr>
                                            <td>
                                                <div className="form-check form-switch">
                                                    <input className="form-check-input" type="checkbox" id="flexSwitchCheckChecked" />
                                                </div>
                                            </td>
                                            <td>Performance</td>
                                            <td>
                                                <div className='d-flex align-items-center'>
                                                    <div className='select_report_date me-4'>
                                                        <Select options={options} classNamePrefix="essa_results" />
                                                    </div>
                                                    <div className='choose_date'>
                                                        <DatePicker selected={this.state.startDate} onChange={(date) => this.setStartDate(date)} />
                                                    </div>
                                                </div>

                                            </td>
                                            <td>
                                                <div className='d-flex'>
                                                    <div class="form-check me-4">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr1" />
                                                        <label className="form-check-label" for="fr1">
                                                            One Time
                                                        </label>
                                                    </div>
                                                    <div class="form-check">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr2" />
                                                        <label className="form-check-label" for="fr2">
                                                            Everyday
                                                        </label>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className='d-flex cust-time'>
                                                    <input type="time" id="appt" name="appt" />
                                                    <select className="form-select" aria-label="Default select example">
                                                        <option value="AM" selected>AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="form-check form-switch">
                                                    <input className="form-check-input" type="checkbox" id="flexSwitchCheckChecked" />
                                                </div>
                                            </td>
                                            <td>Performance</td>
                                            <td>
                                                <div className='d-flex align-items-center'>
                                                    <div className='select_report_date me-4'>
                                                        <Select options={options} classNamePrefix="essa_results" />
                                                    </div>
                                                    <div className='choose_date'>
                                                        <DatePicker selected={this.state.startDate} onChange={(date) => this.setStartDate(date)} />
                                                    </div>
                                                </div>

                                            </td>
                                            <td>
                                                <div className='d-flex'>
                                                    <div class="form-check me-4">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr1" />
                                                        <label className="form-check-label" for="fr1">
                                                            One Time
                                                        </label>
                                                    </div>
                                                    <div class="form-check">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr2" />
                                                        <label className="form-check-label" for="fr2">
                                                            Everyday
                                                        </label>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className='d-flex cust-time'>
                                                    <input type="time" id="appt" name="appt" />
                                                    <select className="form-select" aria-label="Default select example">
                                                        <option value="AM" selected>AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="form-check form-switch">
                                                    <input className="form-check-input" type="checkbox" id="flexSwitchCheckChecked" />
                                                </div>
                                            </td>
                                            <td>Performance</td>
                                            <td>
                                                <div className='d-flex align-items-center'>
                                                    <div className='select_report_date me-4'>
                                                        <Select options={options} classNamePrefix="essa_results" />
                                                    </div>
                                                    <div className='choose_date'>
                                                        <DatePicker selected={this.state.startDate} onChange={(date) => this.setStartDate(date)} />
                                                    </div>
                                                </div>

                                            </td>
                                            <td>
                                                <div className='d-flex'>
                                                    <div class="form-check me-4">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr1" />
                                                        <label className="form-check-label" for="fr1">
                                                            One Time
                                                        </label>
                                                    </div>
                                                    <div class="form-check">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr2" />
                                                        <label className="form-check-label" for="fr2">
                                                            Everyday
                                                        </label>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className='d-flex cust-time'>
                                                    <input type="time" id="appt" name="appt" />
                                                    <select className="form-select" aria-label="Default select example">
                                                        <option value="AM" selected>AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="form-check form-switch">
                                                    <input className="form-check-input" type="checkbox" id="flexSwitchCheckChecked" />
                                                </div>
                                            </td>
                                            <td>Performance</td>
                                            <td>
                                                <div className='d-flex align-items-center'>
                                                    <div className='select_report_date me-4'>
                                                        <Select options={options} classNamePrefix="essa_results" />
                                                    </div>
                                                    <div className='choose_date'>
                                                        <DatePicker selected={this.state.startDate} onChange={(date) => this.setStartDate(date)} />
                                                    </div>
                                                </div>

                                            </td>
                                            <td>
                                                <div className='d-flex'>
                                                    <div class="form-check me-4">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr1" />
                                                        <label className="form-check-label" for="fr1">
                                                            One Time
                                                        </label>
                                                    </div>
                                                    <div class="form-check">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr2" />
                                                        <label className="form-check-label" for="fr2">
                                                            Everyday
                                                        </label>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className='d-flex cust-time'>
                                                    <input type="time" id="appt" name="appt" />
                                                    <select className="form-select" aria-label="Default select example">
                                                        <option value="AM" selected>AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div className="form-check form-switch">
                                                    <input className="form-check-input" type="checkbox" id="flexSwitchCheckChecked" />
                                                </div>
                                            </td>
                                            <td>Performance</td>
                                            <td>
                                                <div className='d-flex align-items-center'>
                                                    <div className='select_report_date me-4'>
                                                        <Select options={options} classNamePrefix="essa_results" />
                                                    </div>
                                                    <div className='choose_date'>
                                                        <DatePicker selected={this.state.startDate} onChange={(date) => this.setStartDate(date)} />
                                                    </div>
                                                </div>

                                            </td>
                                            <td>
                                                <div className='d-flex'>
                                                    <div class="form-check me-4">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr1" />
                                                        <label className="form-check-label" for="fr1">
                                                            One Time
                                                        </label>
                                                    </div>
                                                    <div class="form-check">
                                                        <input className="form-check-input" type="radio" name="flexRadioDefault" id="fr2" />
                                                        <label className="form-check-label" for="fr2">
                                                            Everyday
                                                        </label>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className='d-flex cust-time'>
                                                    <input type="time" id="appt" name="appt" />
                                                    <select className="form-select" aria-label="Default select example">
                                                        <option value="AM" selected>AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr> */}
                                    </tbody>
                                </Table>
                            </Col>
                        </Row>
                        <ToastContainer />
                    </Container>
                </Layout >
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

export default ConfigurationReport
