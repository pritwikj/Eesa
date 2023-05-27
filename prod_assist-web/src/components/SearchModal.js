import React, { Component } from 'react'
import Image from 'next/image'
import { Modal, Button, Form, Container, Row, Col, Collapse, Spinner } from 'react-bootstrap'
import Select from 'react-select'
import { commonPostService, notifySuccess, notifyError, clientId, API_KEY } from '../../properties'
import { chartGraph } from './graph'
import { object } from 'prop-types'
import { ToastContainer } from 'react-toastify';
import ApiCalendar from "react-google-calendar-api";
import moment from 'moment'

const config = {
    "clientId": clientId,
    "apiKey": API_KEY,
    "scope": 'https://www.googleapis.com/auth/calendar.events',
    "discoveryDocs": ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
}
const apiCalendar = new ApiCalendar(config);

class SearchModal extends Component {
    constructor(props) {
        super(props)
        this.state = {
            emailOpen: false,
            email: '',
            message: '',
            subject: '',
            receive_name: '',
            chartOptions: [
                { value: 'LINE', label: 'Line Chart' },
                { value: 'BAR', label: 'Bar Chart' },
                { value: 'PIE', label: 'Pie Chart' }
                // { value: 'DONUT', label: 'Donut Chart' },
                // { value: 'SPLINE', label: 'Spline Chart' },
                // { value: 'AREA', label: 'Area Chart' }
            ],
            selectedChart: { value: 'LINE', label: 'Line Chart' },
            chartData: {},
            isSave: false,
            showgraph: 'none',
            confirmbox: 'none',
            plainmail: "none",
            graphmail: "none",
            alreadycalled: false,
            charttitle: "",
            voice_text: "",
            showspinner: false,
            loader: false,
            waitingforconfirm: 0,
            orderbookingdata: {},
            orderbook: 'none',
            server_response: '',
            composeResponse: '',
            isMeeting: 'none',
            meetingList: [],
            newMeetDetails: {},
        }
    }

    componentDidMount() {
        this.processquery();
        setInterval(() => {
            if (!this.props.speech_end) {
                this.setState({ voice_text: localStorage.getItem('transcript') })
            }
        }, 100);

        //--------------
        // this.getquestioncategory("create meeting with kathiravan at 10am");
        //--------------
    }

    componentDidUpdate(prevProps) {
        if (prevProps.speech_end != this.props.speech_end && this.state.voice_text.trim() != "") {
            this.processquery();
        }
    }

    processquery() {
        if (!this.state.alreadycalled && this.props.speech_end == true && this.state.voice_text.trim() != "") {
            console.log(`question : ` + this.state.voice_text);
            this.setState({ alreadycalled: true, composeResponse: '' })
            var texttoserver = this.state.voice_text;

            var graph_change = false;

            //replace charts and graph words with empty
            if (texttoserver.search('line') > -1) {
                this.setState({ selectedChart: { value: 'LINE', label: 'Line Chart' } })
                texttoserver = texttoserver.replace('line', '');
                graph_change = true;
            }
            if (texttoserver.search('pie') > -1) {
                this.setState({ selectedChart: { value: 'PIE', label: 'Pie Chart' } })
                texttoserver = texttoserver.replace('pie', '');
                graph_change = true;
            }
            if (texttoserver.search('bar') > -1) {
                this.setState({ selectedChart: { value: 'BAR', label: 'Bar Chart' } })
                texttoserver = texttoserver.replace('bar', '');
                graph_change = true;
            }
            if (texttoserver.search('graph') > -1) {
                texttoserver = texttoserver.replace('graph', '');
                graph_change = true;
            }
            if (texttoserver.search('chart') > -1) {
                texttoserver = texttoserver.replace('chart', '');
                graph_change = true;
            }

            // change graph action
            if (texttoserver.search('show') > -1 && graph_change) {
                this.setState({ alreadycalled: false })
                setTimeout(() => {
                    this.handleOnChange(this.state.selectedChart)
                }, 1000);
            }
            // pin to dashboard action 
            else if (texttoserver.search('dashboard') > -1) {
                console.log('pin to dashboard');
                this.handlePinDashboard()
            }
            // send this chart
            else if (texttoserver.search('this') > -1 && (texttoserver.search('send') > -1 || texttoserver.search('mail') > -1)) {
                this.framemailforgraph(texttoserver);
                //send yes   
            } else if (this.state.waitingforconfirm > 0 && (texttoserver.search('yes') > -1 || texttoserver.search('ahead') > -1)) {
                setTimeout(() => {
                    this.closemodel();
                }, 1000);
                this.process_yes();
            }
            // send cancel
            else if (this.state.waitingforconfirm > 0 && (texttoserver.search('cancel') > 1 || texttoserver.search('ignore') > -1)) {
                this.closemodel();
            }
            //remaing action
            else {
                this.setState({ charttitle: texttoserver })
                this.getquestioncategory(texttoserver);
            }
        }
    }

    process_yes() {
        let { waitingforconfirm, email, message, subject, orderbookingdata, } = this.state;
        if (waitingforconfirm == 1) {
            this.handleSentEmail();
        }
        if (waitingforconfirm == 2) {
            var params = {
                email: email,
                message: message,
                subject: subject
            }
            commonPostService(`api/send-mail`, params).then(res => {
                notifySuccess(res.msg);
                this.funcplayvoice(res.msg);
            })
        }
        if (waitingforconfirm == 3) {
            var params = {
                mobile: email,
                message: message
            }
            commonPostService(`api/send-sms`, params).then(res => {
                notifySuccess(res.msg);
                this.funcplayvoice(res.msg);
            })
        }
        if (waitingforconfirm == 4) {
            var params = {
                number_of_people: orderbookingdata.number_of_people,
                restaurant_name: orderbookingdata.restaurant_name,
                time: orderbookingdata.time
            }
            commonPostService(`api/opentable-booking`, params).then(res => {
                notifySuccess(res.msg);
                this.funcplayvoice(res.msg);
            })
        }
        if (waitingforconfirm === 5) {
            this.createEvent()
        }
    }

    createEvent = () => {
        let { newMeetDetails } = this.state
        let fromTime = new Date()
        let toTime = new Date()
        fromTime.setHours((newMeetDetails?.meeting_time.split(' ')[0].split(':')[0]))
        fromTime.setMinutes((newMeetDetails?.meeting_time.split(' ')[0].split(':')[1] ))
        fromTime.setSeconds(0);
        toTime.setHours((fromTime?.getHours()) + 1)
        toTime.setMinutes((fromTime?.getMinutes()))
        toTime.setSeconds(0);

        let params = {
            "meeting_sub": `Meeting with ${newMeetDetails?.person_name}`,
            "meeting_code": "npf-tjxq-xbt",
            "meeting_start_dt": `${moment(fromTime).format('YYYY-MM-DD')} ${fromTime.getHours()}:${fromTime.getMinutes()}`,
            "meeting_end_dt": `${moment(toTime).format('YYYY-MM-DD')} ${toTime.getHours()}:${toTime.getMinutes()}`
        }

        const meetDetails = {
            summary: `Meeting with ${newMeetDetails?.person_name}`,
            start: {
                dateTime: fromTime.toISOString(),
                timeZone: "Asia/Kolkata",
            },
            end: {
                dateTime: toTime.toISOString(),
                timeZone: "Asia/Kolkata",
            },
            attendees: [{'email': newMeetDetails?.email}],
            'reminders': {
                'useDefault': false,
                'overrides': [
                  {'method': 'email', 'minutes': 24 * 60},
                  {'method': 'popup', 'minutes': 10}
                ]
              }
        }

        apiCalendar
            .createEventWithVideoConference(meetDetails, this.apiCalendar ,'all')
            .then((result) => {
                notifySuccess('Meeting Created Successfully');
                this.funcplayvoice('Meeting Created Successfully');
            })
            .catch((error) => {
                notifyError(error);
            });

        // console.log(JSON.stringify(params));
         commonPostService(`api/calendar-save`, params).then(res => {
         })

    }

    framemailforgraph = (texttoserver) => {
        let params = {
            "prompt": `${texttoserver} and answer ${this.state.server_response}`
        }
        this.setState({ loader: true, showgraph: 'none', composeResponse: "Working on that." })
        commonPostService(`api/chatgpt-graph-mail-search`, params).then(res => {
            this.setState({ alreadycalled: false, loader: false })
            if (res?.object?.email) {
                this.setState({
                    email: res.object.email,
                    message: res.object.message,
                    subject: res.object.subject,
                    receive_name: res.object.name
                });
                this.setState({ alreadycalled: false, showgraph: 'none', plainmail: 'block', confirmbox: 'block', graphmail: 'block', waitingforconfirm: 1, composeResponse: "Should I go ahead and send it?" })
                this.funcplayvoice(res.object.message)
                this.funcplayvoice("Should I go ahead and send it?");
            }
        }).catch(err => {
            this.setState({ alreadycalled: false, loader: false })
        })
    }

    getquestioncategory = (question) => {
        let params = {
            "prompt": question
        }
        this.setState({ loader: true, showgraph: 'none', confirmbox: 'none', plainmail: 'none', graphmail: 'none', orderbook: 'none' })
        commonPostService(`api/chatgpt-categories`, params).then(res => {
            this.setState({ alreadycalled: false, loader: false })
            if (res.status && res.object) {
                if (res.object == 1) {
                    //Question
                    this.funcplayvoice("Let me look into that for you");
                    this.setState({ alreadycalled: true, showgraph: 'block', graphmail: 'block', composeResponse: 'Let me look into that for you' })
                    this.getGraphDetails(question, res.object);
                } else if (res.object == 2) {
                    //mail
                    this.funcplayvoice("Working on that");
                    this.setState({ alreadycalled: false, confirmbox: 'block', plainmail: 'block', composeResponse: 'Working on that' })
                    this.getGraphDetails(question, res.object);
                } else if (res.object == 3) {
                    //sms
                    this.funcplayvoice("Working on that");
                    this.setState({ alreadycalled: false, confirmbox: 'block', plainmail: 'block', composeResponse: 'Working on that' })
                    this.getGraphDetails(question, res.object);
                } else if (res.object == 4) {
                    //opentable
                    this.funcplayvoice("Working on that");
                    this.setState({ alreadycalled: false, orderbook: 'block', composeResponse: "Working on that" })
                    this.getGraphDetails(question, res.object);
                } else if (res.object == 5) {
                    //meetingList
                    this.funcplayvoice("Working on that");
                    this.setState({ alreadycalled: false, isMeeting: 'block', composeResponse: "Working on that" })
                    this.getGraphDetails(question, res.object);
                }
            } else {
                notifyError(res.msg);
                this.funcplayvoice(res.msg);
            }
        }).catch((err) => {
            this.setState({ alreadycalled: false, loader: false })
        })
    }

    //Get the graph deta for user question
    getGraphDetails = (quest, logica) => {
        let sampleQuestion = {
            "prompt": quest,
            "category": logica
        }
        this.setState({ loader: true, chartData: {} })
        commonPostService(`api/chatgpt-search`, sampleQuestion).then(res => {
            this.setState({ alreadycalled: false, loader: false })
            if (res.status && res.object) {
                if (logica == 1) {
                    this.setState({ composeResponse: '' })
                    if (res.object.query_id === 0) {
                        notifyError(res.object?.response)
                        this.funcplayvoice(res.object?.response);
                    }
                    else {
                        try {
                            this.setState({ server_response: res.object?.response })
                            if (res.object?.response?.indexOf('{"schema') !== -1) {
                                res.object.parsedData = JSON.parse(res.object?.response?.slice(res.object?.response?.indexOf('{"schema')))
                                res.object.xAxis = []
                                res.object.yAxis = []
                                res.object.parsedData?.data?.map(axis => {
                                    for (let x in axis) {
                                        res.object.xAxis.push(x);
                                        res.object.yAxis.push(axis[x]);
                                    }
                                })
                            }
                            else if (Array.isArray(JSON.parse(res.object?.response))) {
                                res.object.parsedData = res.object?.response && JSON.parse(res.object?.response)
                                res.object.xAxis = []
                                res.object.yAxis = []
                                res.object.data = []
                                res.object?.parsedData?.map(axis => {
                                    for (let x in axis) {
                                        res.object.data.push(axis[x]);
                                    }
                                })
                                res.object?.data?.map((val, i) => {
                                    if ((i + 1) % 2 === 0) {
                                        res.object.yAxis.push(val)
                                    }
                                    else {
                                        res.object.xAxis.push(val)
                                    }
                                })
                            }
                            else {
                                res.object.parsedData = res.object?.response && JSON.parse(res.object?.response)
                                res.object.xAxis = []
                                res.object.yAxis = []
                                for (let x in res?.object?.parsedData) {
                                    res.object?.xAxis.push(x);
                                    res.object?.yAxis.push(res?.object?.parsedData[x]);
                                }
                            }
                            res.object.type = this.state.selectedChart.value;
                            res.object.highestRange = Math.max.apply(null, res.object?.yAxis)
                            this.setState({ chartData: res?.object })
                        }
                        catch (error) {
                            console.log(error)
                            notifyError("I apologize, Please try again.")
                            this.funcplayvoice("I apologize, Please try again.");
                        }
                    }
                }
                if (logica == 2) {
                    this.setState({
                        email: res.object.email,
                        message: res.object.message,
                        subject: res.object.subject,
                        receive_name: res.object.name,
                        waitingforconfirm: 2,
                        composeResponse: "Should I go ahead and send it?"
                    })
                    this.funcplayvoice(res.object.message);
                    this.funcplayvoice("Should I go ahead and send it?")

                }

                if (logica == 3) {
                    this.setState({
                        email: res.object.mobile,
                        message: res.object.message,
                        subject: res.object.subject,
                        receive_name: res.object.name,
                        waitingforconfirm: 3,
                        composeResponse: "Should I go ahead and send it?"
                    })
                    this.funcplayvoice(res.object.message);
                    this.funcplayvoice("Should I go ahead and send it?")
                }

                if (logica == 4) {
                    this.setState({
                        orderbookingdata: res.object,
                        waitingforconfirm: 4,
                        composeResponse: "Can I confirm this reservation?"
                    })
                    this.funcplayvoice(`${res.object.restaurant_name} restaurant for ${res.object.number_of_people}  people at ${res.object.time}`)
                    this.funcplayvoice("Can I confirm this reservation?")
                }

                if (logica == 5) {
                    if (quest.toLowerCase().split(' ').includes('reschedule')) {
                        if (res.object.length && res.object.length === 1) {
                            this.setState({ isMeeting: 'none', confirmbox: 'block', plainmail: 'block' })
                            this.getGraphDetails(`send email to ${res.object[0].name} that ${quest}`, 2);
                        }
                        else if (res.object.length && res.object.length > 1) {
                            this.setState({
                                meetingList: res.object,
                                waitingforconfirm: 5,
                                composeResponse: "You have shedule clash. Which event would you like to reshedule?"
                            })
                            this.funcplayvoice("You have shedule clash. Which event would you like to reshedule?")
                        }
                    }
                    else {
                        this.setState({
                            isMeeting: 'none',
                            orderbook: 'block',
                            newMeetDetails: res.object,
                            waitingforconfirm: 5,
                            composeResponse: "Can I confirm this schedule?"
                        })
                        this.funcplayvoice(` ${res.object?.meeting_name} Meeting with ${res.object?.person_name} at ${res.object?.meeting_time}`)
                        this.funcplayvoice("Can I confirm this schedule?")
                    }
                }
            }
            else {
                notifyError(res.msg);
                this.funcplayvoice(res.msg);
            }
        }).catch((err) => {
            this.setState({ alreadycalled: false, loader: false })
        })
    }

    //Change the chart type either 'bar' or 'line'
    handleOnChange = (e) => {
        let { chartData } = this.state
        if (chartData.type) {
            chartData.type = e.value
        }
        this.setState({ selectedChart: e, chartData })
    }

    //Pin the chart at dashboard
    handlePinDashboard = () => {
        let { chartData } = this.state
        let params = {
            "query_id": chartData.query_id,
            "graph_type": chartData.type
        }
        this.setState({ isSave: true })
        commonPostService(`api/pin-to-dashboard`, params).then(res => {
            this.setState({ isSave: false })
            if (res.status) {
                this.props?.getUpdate("updated")
                notifySuccess(res.msg);
                this.funcplayvoice(res.msg);
            }
            else {
                notifyError(res.msg);
                this.funcplayvoice(res.msg);
            }
            this.closemodel();
        })
    }

    //Send the chart as image via email
    handleSentEmail = async () => {
        let { email, subject, message } = this.state
        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
        // if (email.trim() === '') {
        //     notifyError('Please enter the Email-id')
        //     return false;
        // }
        // if (!emailRegex.test(email)) {
        //     notifyError('Please enter the valid Email-id')
        //     return false;
        // } 
        const blob = await fetch(document.getElementById("graph_image").src).then((res) => res.blob());
        const file = new File([blob], "chart.png", {
            type: 'image/png'
        });
        var fd = new FormData();
        fd.append("image", file);
        this.setState({ showspinner: true })
        commonPostService(`api/send-attachment-mail/${encodeURI(email)}/${encodeURI(subject)}/${encodeURI(message)}`, fd).then(res => {
            this.setState({ showspinner: false })
            notifySuccess(res);
            this.funcplayvoice(res);
        }).catch((error) => {
            this.setState({ showspinner: false })
            console.log(error);
        })
    }

    imagefromchart = (url) => {
        document.getElementById('graph_image').src = url;
    }

    closemodel = () => {
        console.log('close model');
        this.props?.closemodel();
    }

    funcplayvoice = (msg) => {
        var old_texts = JSON.parse(localStorage.getItem('voicetext'));
        old_texts.push(msg);
        localStorage.setItem('voicetext', JSON.stringify(old_texts))
    }

    render() {
        const { emailOpen, email, chartOptions, selectedChart, chartData, isSave, meetingList, newMeetDetails, waitingforconfirm } = this.state
        let chart = chartGraph(chartData?.xAxis, chartData?.yAxis, chartData?.type, null, null, 380, null, null, chartData?.highestRange, 8, 'search', this.imagefromchart)
        return (
            <>
                <ToastContainer />
                <Modal {...this.props} size="lg">
                    <Modal.Header id="close_button" closeButton className='border-bottom-0 p-0'></Modal.Header>
                    <Modal.Body className='d-flex flex-column justify-content-center'>
                        <Container fluid className='pe-md-4 mb-5'>
                            <Row>
                                <Col lg={{ span: 6, offset: 3 }}>
                                    <div className='main_search position-relative'>
                                        <div className='search-icon d-flex align-items-center justify-content-center'>
                                            <Image width={22} height={22} src="/eesaweb/images/search-white.svg" alt='icon' />
                                        </div>
                                        {this.props.speech_end ? <div className='mic-icon d-flex align-items-center justify-content-center cursor-pointer'>
                                            <Image width={27} height={27} src="/eesaweb/images/mic-white.svg" alt='icon' />
                                        </div> : <div className='mic-icon active d-flex align-items-center justify-content-center cursor-pointer'>
                                            <Image width={27} height={27} src="/eesaweb/images/mic-white.svg" alt='icon' />
                                        </div>}
                                        <Form.Control type="text" placeholder="" value={this.state.voice_text} />
                                        <p className='text-center mb-0'>Tips: Try Saying or Typing <strong>{'" Todays Sales Report "'}</strong> </p>
                                    </div>
                                </Col>

                                {this.state.composeResponse !== '' &&
                                    <Col lg={{ span: 6, offset: 3 }}>
                                        <div className='mail-notify position-relative d-flex align-items-center mt-4'>
                                            <div className='mail-notify-icon mx-3'>
                                                <Image width={38} height={38} src="/eesaweb/images/eesa_mini_logo.svg" alt='icon' />
                                            </div>
                                            <div className='mail-notify-text'>
                                                {this.state.composeResponse}
                                            </div>
                                        </div>
                                    </Col>
                                }

                                <div style={{ 'display': !this.state.loader ? this.state.confirmbox : 'none' }}>
                                    <Col lg={{ span: 6, offset: 3 }}>
                                        <div className='email-contanier position-relative mt-4'>
                                            <div className='email-header fw-bold'>
                                                New Message
                                            </div>
                                            <div className='email-sender'>
                                                To <span className='ms-2 sender-name'>{this.state.email} <span class="ms-3 sender-close">X</span></span>
                                            </div>
                                            {this.state.subject && this.state.subject !== '' &&
                                                <div className='email-sub'>
                                                    {this.state.subject}
                                                </div>
                                            }
                                            <div className='email-content'>
                                                {/* <p>Dear Victoria,</p> */}
                                                <p style={{ 'display': this.state.plainmail }}>{this.state.message}</p>
                                                {/* <p>Best regards,</p>
                                    <p>John Smith</p> */}
                                                <Image id="graph_image" style={{ 'display': this.state.graphmail }} src="" width={600} height={300} />
                                            </div>
                                            <div className='email-footer d-flex justify-content-end'>
                                                <button type='button ' className='btn me-2 cancle-btn normal-btn'>Cancel</button>
                                                <button type='button' className=' btn btn-primary normal-btn'>Send</button>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col lg={{ span: 6, offset: 3 }}>
                                        <div className='question-container position-relative mt-3'>
                                            <div className='ques-content d-flex align-items-center'>
                                                <div class="ques-icon">
                                                    <Image width={19} height={19} src="/eesaweb/images/chat.svg" alt='icon' />
                                                </div>
                                                <div className='ques-text ms-2'>
                                                    {this.state.charttitle}
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                </div>
                                {!this.state.loader &&
                                    <>
                                        <Col lg={{ span: 6, offset: 3 }} style={{ 'display': this.state.orderbook }}>
                                            <div className='email-contanier Order-container position-relative mt-4'>
                                                <div className='email-header fw-bold'>
                                                    {waitingforconfirm === 5 ? "New Meeting" : "New Order"}
                                                </div>
                                                {waitingforconfirm === 5 ?
                                                    <div className='order-content'>
                                                        <p>Meeting Name:<span className="order-name ms-1 fw-bold">{newMeetDetails?.meeting_name !== '' ? newMeetDetails?.meeting_name : `Meeting with ${newMeetDetails?.person_name}`}</span></p>
                                                        <p>Guest:<span className="order-name ms-1 fw-bold">{newMeetDetails?.person_name}</span></p>
                                                        <p>Time:<span className="order-name ms-1 fw-bold">{newMeetDetails?.meeting_time}</span></p>
                                                    </div>
                                                    :
                                                    <div className='order-content'>
                                                        <p>Restaurant Name:<span className="order-name ms-1 fw-bold">{this.state.orderbookingdata.restaurant_name}</span></p>
                                                        <p>No Of peoples:<span className="order-name ms-1 fw-bold">{this.state.orderbookingdata.number_of_people}</span></p>
                                                        <p>Time:<span className="order-name ms-1 fw-bold">{this.state.orderbookingdata.time}</span></p>
                                                    </div>
                                                }
                                                <div className='email-footer order-footer d-flex justify-content-end'>
                                                    <button type='button ' className='btn me-2 cancle-btn normal-btn'>Cancel</button>
                                                    <button onClick={()=>{this.process_yes()}} type='button' className=' btn btn-primary normal-btn'>Confirm</button>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col lg={{ span: 6, offset: 3 }} style={{ 'display': this.state.orderbook }}>
                                            <div className='question-container position-relative mt-3'>
                                                <div className='ques-content d-flex align-items-center'>
                                                    <div class="ques-icon">
                                                        <Image width={19} height={19} src="/eesaweb/images/chat.svg" alt='icon' />
                                                    </div>
                                                    <div className='ques-text ms-2'>
                                                        {this.state.charttitle}
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </>
                                }

                                {this.state.loader &&
                                    <Col lg={{ span: 6, offset: 3 }} className='d-flex justify-content-center '>
                                        <div className="mt-5 ">
                                            <span className="loading-btn preloder">
                                                <Image width={80} height={80} src="/eesaweb/images/essa-white.svg" alt='icon' />
                                            </span>
                                        </div>
                                    </Col>
                                }
                                {!this.state.loader &&
                                    <Col lg={{ span: 6, offset: 3 }} style={{ display: this.state.isMeeting }}>
                                        <div className='email-contanier resudule-container position-relative mt-4'>
                                            <div className='email-header fw-bold'>
                                                Calender
                                            </div>
                                            <div className='email-header fw-bold d-none'>
                                                Available time slot
                                            </div>
                                            <div className='resedule-content order-content'>
                                                {meetingList?.map((res, i) => (
                                                    <div className='meeting d-flex justify-content-between align-items-center mb-3 cursor-pointer' key={i}>
                                                        <div className='meeting-name'>
                                                            <h4>{res?.sub}</h4>
                                                            <p>{res?.time} &nbsp;I&nbsp; Hosted by {res?.name}</p>
                                                        </div>
                                                        <div className='meeting-sucess-img'>
                                                            <Image width={22} height={22} src="/eesaweb/images/tick.svg" alt='icon' className='tick-normal' />
                                                            <Image width={22} height={22} src="/eesaweb/images/tick-sucess.svg" alt='icon' className='tick-sucess d-none' />
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* <div className='meeting d-flex justify-content-between align-items-center mb-3 cursor-pointer selected'>
                                                    <div className='meeting-name'>
                                                        <h4>Marketing Meeting</h4>
                                                        <p>11:00 AM &nbsp;I&nbsp; Hosted by Mark</p>
                                                    </div>
                                                    <div className='meeting-sucess-img'>
                                                        <Image width={22} height={22} src="/eesaweb/images/tick.svg" alt='icon' className='tick-normal d-none' />
                                                        <Image width={22} height={22} src="/eesaweb/images/tick-sucess.svg" alt='icon' className='tick-sucess' />
                                                    </div>
                                                </div>
                                                <div className='meeting time-sedule mb-3 cursor-pointer selected d-flex justify-content-between align-items-center'>
                                                    <div className='time-text meeting-name'>
                                                        <h4>3 PM</h4>
                                                    </div>
                                                    <div className='meeting-sucess-img'>
                                                        <Image width={22} height={22} src="/eesaweb/images/tick.svg" alt='icon' className='tick-normal d-none' />
                                                        <Image width={22} height={22} src="/eesaweb/images/tick-sucess.svg" alt='icon' className='tick-sucess' />
                                                    </div>
                                                </div>
                                                <div className='meeting time-sedule mb-3 cursor-pointer d-flex justify-content-between align-items-center '>
                                                    <div className='time-text meeting-name'>
                                                        <h4>4 PM</h4>
                                                    </div>
                                                    <div className='meeting-sucess-img'>
                                                        <Image width={22} height={22} src="/eesaweb/images/tick.svg" alt='icon' className='tick-normal ' />
                                                        <Image width={22} height={22} src="/eesaweb/images/tick-sucess.svg" alt='icon' className='tick-sucess d-none' />
                                                    </div>
                                                </div> */}
                                            </div>
                                        </div>
                                    </Col>
                                }
                            </Row>
                        </Container>
                        {!this.state.loader &&
                            <div className='search_result' style={{ 'display': this.state.showgraph }}>
                                <div className='each_card'>
                                    <Container fluid>
                                        <Row>
                                            <Col lg={8} className='px-lg-4 py-lg-4 py-3'>
                                                <div className='d-flex align-items-center justify-content-between'>
                                                    <h3 className='mb-0 fw-bold'>{this.state.charttitle}</h3>
                                                    <Select
                                                        options={chartOptions}
                                                        value={selectedChart}
                                                        onChange={(e) => { this.handleOnChange(e) }}
                                                        classNamePrefix="essa_results"
                                                    />
                                                </div>
                                                <div className='report-dtls d-flex align-items-center justify-content-center'>
                                                    {chart}
                                                    {/* <h1 className='mb-0'>23,9875</h1> */}
                                                </div>
                                            </Col>
                                            <Col lg={4} className='p-3'>
                                                <div className='action-card p-3'>
                                                    <div className='pb-2 border-bottom'>
                                                        <h4 className='mb-0'>Action</h4>
                                                    </div>

                                                    <div className='border-bottom'>
                                                        <div className='d-inline-flex align-items-center pt-2 pb-2 mt-1 cursor-pointer' onClick={() => this.setState({ emailOpen: true })} aria-controls="email_r" aria-expanded={emailOpen}>
                                                            Email Recipients
                                                            <div className='d-flex align-items-center ms-2'>
                                                                <Image width={20} height={20} src="/eesaweb/images/plus-circle-blue.svg" alt='icon' />
                                                            </div>
                                                        </div>
                                                        <Collapse in={emailOpen}>
                                                            <div id="email_r">
                                                                <div className='d-flex align-items-center mb-3'>
                                                                    <Form.Control type='email' value={email} onChange={(e) => { this.setState({ email: e.target.value }) }} />
                                                                    <div className='d-flex align-items-center del-icon cursor-pointer' onClick={() => this.setState({ emailOpen: false })}>
                                                                        <Image width={16} height={16} src="/eesaweb/images/delete.svg" alt='icon' />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Collapse>
                                                    </div>

                                                    <div className='pt-2 mt-1 d-flex align-items-center'>
                                                        <Button className='d-flex align-items-center me-2' disabled={isSave} onClick={() => { this.handlePinDashboard() }}>
                                                            <div className='d-flex align-items-center me-2'>
                                                                <Image width={16} height={16} src="/eesaweb/images/pin-white.svg" alt='icon' />
                                                            </div>
                                                            Pin to Dashboard
                                                        </Button>
                                                        <div className='d-flex align-items-center justify-content-center cursor-pointer share-icon' onClick={() => { this.handleSentEmail() }}>
                                                            <div className='d-flex align-items-center'>
                                                                <Image width={18} height={18} src="/eesaweb/images/share-blue.svg" alt='icon' />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className='r_queries'>
                                                    <h5>Related Questions</h5>
                                                    <ul className='ps-0 d-flex align-items-center flex-wrap'>
                                                        <li>Today sales report</li>
                                                        <li>Today attendance</li>
                                                        <li>Cras mattis proin </li>
                                                        <li>Today sales report</li>
                                                        <li>Today attendance</li>
                                                        <li>Cras mattis proin </li>
                                                    </ul>
                                                </div>
                                            </Col>
                                        </Row>
                                    </Container>
                                </div>
                                <div>
                                    <Row>
                                        <Col lg={12}>
                                            <div className='question-container position-relative'>
                                                <div className='ques-content d-flex align-items-center'>
                                                    <div class="ques-icon">
                                                        <Image width={19} height={19} src="/eesaweb/images/chat.svg" alt='icon' />
                                                    </div>
                                                    <div className='ques-text ms-2'>
                                                        {this.state.charttitle}
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        }
                    </Modal.Body>
                </Modal>
                {this.state.showspinner &&
                    <div className='fullpage-loader'>
                        <div className='d-flex align-items-center justify-content-center flex-column'>
                            <Spinner animation="border" role="status" variant="light">
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                        </div>
                    </div>}
            </>
        )
    }
}

export default SearchModal
