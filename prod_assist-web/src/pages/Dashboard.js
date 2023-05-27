import React, { Component } from 'react'
import { Row, Container, Col, Form, Modal, Button, Spinner } from 'react-bootstrap'
import Layout from '../components/Layout'
import Image from 'next/image'
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import 'react-circular-progressbar/dist/styles.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import RadialSeparators from "../components/RadialSeparators";
import Slider from "react-slick";
import SearchModal from '../components/SearchModal';
import { commonPostService, notifySuccess, notifyError } from '../../properties';
import PlaymeetingModal from '../components/PlaymeetingModal';
import { chartGraph } from '@/components/graph';
import VoiceToText from '../components/VoiceToText';
import { ToastContainer } from 'react-toastify';
import TextToVoice from '../components/TextToVoice';
import Router from "next/router";
import SortableList, { SortableItem } from "react-easy-sort";


class Dashboard extends Component {
    constructor() {
        super();
        this.state = {
            showSearch: false,
            briefingList: [],
            graphList: [],
            backupGraphList: [],
            queryList: [],
            notificationList: [],
            isEdit: false,
            isUpdate: false,
            playMeeting: false,
            playMeetingId: '',
            isSave: false,
            realtimetext: "",
            speech_end: false,
            display_speech: false,
            display_voice: false,
            isSpin: false,
            wakeLock: null,
            isrendered: false,
            predictionList: {
                x: {
                    x1: [],
                    x2: []
                },
                y: {
                    y1: [],
                    y2: []
                },
                type: 'SPLINE'
            }
        }
    }

    componentDidMount() {
        this.getDashBoardDetails("initial");
        this.initiateSpeech();
        if ("wakeLock" in navigator) {
            window.addEventListener('visibilitychange', this.handleVisibilityChange);
            this.requestWakeLock();
            console.log('wake lock is supported by this browser.')
        } else {
            console.log("Wake lock is not supported by this browser.")
        }
    }

    requestWakeLock = async () => {
        let { wakeLock } = this.state
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.onrelease = function (ev) {
                console.log(ev);
            }
            this.setState({ wakeLock })
        } catch (err) {
            console.log(err)
        }
    }

    handleVisibilityChange = () => {
        let { wakeLock } = this.state
        if (wakeLock !== null && document.visibilityState === 'visible') {
            this.requestWakeLock();
        }
    }

    showtext = (text) => {
        console.log(text);
        text = text.replaceAll("isha", '');
        text = text.replaceAll("essa", '');
        text = text.replaceAll("isa", '');
        localStorage.setItem('transcript', text);
    }

    startlisten = () => {
        this.setState({ showSearch: true, isUpdate: false, speech_end: false })
        setTimeout(() => {
            this.setState({ speech_end: true })
        }, 10000);
    }

    updatespeechend = (value) => {
        // this.setState({ speech_end: value })
    }

    initiateSpeech = () => {
        setTimeout(() => {
            localStorage.setItem("serive_strt", 0);
            localStorage.setItem("voice_playing", 0);
            this.setState({ display_speech: true, display_voice: true })
        }, 1000);
    }

    imagefromchart = (url) => {
    }


    //Get the Dashboard details
    getDashBoardDetails = (name) => {
        this.setState({ isSpin: true })
        commonPostService(`api/dashboard`).then(res => {
            this.setState({ isSpin: false })
            if (res.status) {
                let { predictionList } = this.state
                res.object?.graph_list?.map((val, i) => {
                    if (val.output.indexOf('{"schema') !== -1) {
                        val.parsedData = JSON.parse(val?.output?.slice(val?.output?.indexOf('{"schema')))
                        val.xAxis = []
                        val.yAxis = []
                        val.parsedData?.data?.map(axis => {
                            for (let x in axis) {
                                val.xAxis.push(x);
                                val.yAxis.push(axis[x]);
                            }
                        })
                        val.highestRange = Math.max.apply(null, val?.yAxis)
                        val.uId = Math.floor(Math.random() * 90000) + 10000
                    }
                    else if (Array.isArray(JSON.parse(val?.output))) {
                        val.parsedData = JSON.parse(val?.output)
                        val.xAxis = []
                        val.yAxis = []
                        val.data = []
                        val?.parsedData?.map(axis => {
                            for (let x in axis) {
                                val.data.push(axis[x]);
                            }
                        })
                        val?.data?.map((inval, i) => {
                            if ((i + 1) % 2 === 0) {
                                val.yAxis.push(inval)
                            }
                            else {
                                val.xAxis.push(inval)
                            }
                        })
                        val.highestRange = Math.max.apply(null, val?.yAxis)
                        val.uId = Math.floor(Math.random() * 90000) + 10000
                    }
                    else {
                        val.parsedData = JSON.parse(val?.output)
                        val.xAxis = []
                        val.yAxis = []
                        for (let x in val?.parsedData) {
                            val?.xAxis.push(x);
                            val?.yAxis.push(val?.parsedData[x]);
                        }
                        val.highestRange = Math.max.apply(null, val?.yAxis)
                        val.uId = Math.floor(Math.random() * 90000) + 10000
                    }
                })
                res?.object?.prediction_list?.map(val => {
                    if (val.prediction == 'N') {
                        predictionList.x.x1.push(new Date(val?.ds));
                        predictionList.y.y1.push(val?.y);
                    }
                    else {
                        predictionList.x.x2.push(new Date(val?.ds));
                        predictionList.y.y2.push(val?.y);
                    }
                })
                if (predictionList.x.x2.length) {
                    predictionList.x.x1.push(predictionList.x.x2[0]);
                    predictionList.y.y1.push(predictionList.y.y2[0]);
                }
                this.setState({
                    briefingList: res?.object?.briefing_list,
                    graphList: res?.object?.graph_list,
                    queryList: res?.object?.query_list,
                    backupGraphList: JSON.parse(JSON.stringify(res?.object?.graph_list)),
                    isrendered: true,
                    predictionList
                }, () => {
                    if (name === 'initial') {
                        this.getNotificationList();
                    }
                })
            }
            else {
                notifyError(res.msg);
                if (name === 'initial') {
                    this.getNotificationList();
                }
            }
        })
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

    //delete the chart from dashboard
    deleteChart = (cId) => {
        let { graphList } = this.state
        this.setState({ graphList: graphList?.filter(res => res.uId !== cId) })
    }

    //Reset the chart details
    resetGraph = () => {
        this.setState({ graphList: this.state.backupGraphList })
    }

    //Update the dashboard details when user pin the chart from search page
    handleUpdate = (val) => {
        if (val === 'updated') {
            this.setState({ isUpdate: true })
        }
    }

    handleHide = () => {
        this.setState({ showSearch: false, realtimetext: "" });
        if (this.state.isUpdate) {
            this.getDashBoardDetails();
        }
    }

    //Handle the calendar update 
    handleCalendarUpdate = (val) => {
        let params = {
            "calendar_id": val.id,
            "meeting_type": val.meeting_type === "D" ? "E" : "D"
        }
        this.setState({ isSpin: true })
        commonPostService('api/calender-update', params).then(res => {
            this.setState({ isSpin: false })
            if (res.status) {
                this.getDashBoardDetails();
                if (val.meeting_type === "D") {
                    notifySuccess("Eesa will attend this meeting.");
                    this.funcplayvoice("Eesa will attend this meeting.");
                } else {
                    notifySuccess(res.msg);
                }
            }
            else {
                notifyError(res.msg);
            }
        })
    }

    funcplayvoice = (msg) => {
        var old_texts = JSON.parse(localStorage.getItem('voicetext'));
        old_texts.push(msg);
        localStorage.setItem('voicetext', JSON.stringify(old_texts))
    }

    //Save the graph details when user edit 
    handleGraphSave = () => {
        let { graphList, isSave } = this.state
        let params = {
            "list_ids": []
        }
        graphList?.map(res => {
            params.list_ids.push(res.list_id);
        })
        this.setState({ isSave: true, isSpin: true })
        commonPostService(`api/dashboard-graph-order-change`, params).then(res => {
            this.setState({ isEdit: false, isSave: false, isSpin: false })
            if (res.status) {
                notifySuccess(res.msg);
                this.getDashBoardDetails();
            }
            else {
                notifyError(res.msg);
                this.resetGraph();
            }
        })
    }

    closemodel = () => {
        this.setState({ showSearch: false });
        this.getDashBoardDetails("initial");
    }

    onSortEnd = (oldIndex, newIndex) => {
        const graphList = this.reorder(
            this.state.graphList,
            oldIndex,
            newIndex
        );
        this.setState({ graphList })
    }

    reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return result;
    };

    render() {
        const { briefingList, queryList, graphList, notificationList, isEdit, showSearch, playMeeting, playMeetingId, isSave, realtimetext, isSpin, predictionList } = this.state
        let chartList = graphList?.map((res, i) => {
            return { query: res.query, i: chartGraph(res?.xAxis, res?.yAxis, res?.graph_type, null, null, 300, null, null, res?.highestRange, 6, 'dashboard', this.imagefromchart), cId: res.uId }
        })
        let predictionChart = chartGraph(predictionList?.x, predictionList?.y, predictionList?.type, null, 316, 301, null, null, null, 6, 'dashboard', this.imagefromchart)
        const settings = {
            dots: true,
            infinite: true,
            fade: true,
            autoplay: false,
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1
        };
        return (
            <>
                <Layout page={{ pageName: 'Dashboard' }}>
                    <Container fluid className='pe-md-4'>
                        {!isEdit &&
                            <>
                                <Row>
                                    <Col md={{ span: 6, offset: 3 }}>
                                        <div className='main_search position-relative'>
                                            <div className='search-icon d-flex align-items-center justify-content-center' onClick={() => { this.setState({ showSearch: true, isUpdate: false }) }}>
                                                <Image width={22} height={22} src="/eesaweb/images/search.svg" alt='icon' />
                                            </div>
                                            <div className='mic-icon d-flex align-items-center justify-content-center cursor-pointer' onClick={() => { this.setState({ showSearch: true, isUpdate: false }) }}>
                                                <Image width={27} height={27} src="/eesaweb/images/mic.svg" alt='icon' />
                                            </div>
                                            {this.state.display_speech && <VoiceToText
                                                realtimetext={realtimetext}
                                                showtext={(abc) => { this.showtext(abc) }}
                                                startlisten={() => { this.startlisten() }}
                                                updatespeechend={(val) => { this.updatespeechend(val) }}

                                            />}





                                            <Form.Control type="text" placeholder="Ask Eesa anything" onClick={() => { this.setState({ showSearch: true, isUpdate: false }) }} />
                                            <p className='text-center'>Tips: Try Saying <b>{'"Hey Eesa"'}</b></p>
                                        </div>
                                    </Col>
                                </Row>


                                {this.state.display_voice && <TextToVoice display_voice={this.state.display_voice} />}

                                <div className='d-flex align-items-center justify-content-between mb-3 pb-1'>
                                    <h3>
                                        Welcome
                                        {/* <strong>John Smith</strong> */}
                                    </h3>
                                    <div className='edit-icon d-flex align-items-center justify-content-center' onClick={() => { this.setState({ isEdit: true }) }}>
                                        <Image width={16} height={16} src="/eesaweb/images/pencil.svg" alt='icon' />
                                    </div>
                                </div>

                                <Row>
                                    <Col lg={4} className='mb-4'>
                                        <div className='cust-card gray-bg h-100 p-0'>
                                            <div className='daily-header'>
                                                <h6>Daily Briefing</h6>
                                            </div>
                                            <div className='noti-container'>
                                                {briefingList?.map(res => (
                                                    <>
                                                        {res.type === 'CALENDAR' && res.meeting_status === "C" ?
                                                            <div className='each-event active d-flex align-items-center'>
                                                                <div className='ee-icon rounded-circle bg-white border d-flex align-items-center justify-content-center'>
                                                                    <Image width={22} height={22} src="/eesaweb/images/greencheck.svg" alt='icon' />
                                                                </div>
                                                                <div className='ee-info'>
                                                                    <p className='text-uppercase'>{res.time}</p>
                                                                    <h5 className='mb-0 fw-bold'>{res.sub}</h5>
                                                                    <div className='d-flex align-items-center'>
                                                                        <div className='d-flex align-items-center meet-info mt-2' onClick={() => { this.setState({ playMeeting: true, playMeetingId: res.id }) }}>
                                                                            <div className='info-icon d-flex align-items-center'>
                                                                                <Image width={16} height={16} src="/eesaweb/images/play.svg" alt='icon' />
                                                                            </div>
                                                                            <a className='cursor-pointer'>Play Meeting Summary</a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div> :
                                                            res.type === 'TASK' ?
                                                                <div className='each-event d-flex align-items-center'>
                                                                    <div className='ee-icon rounded-circle bg-white border d-flex align-items-center justify-content-center'>
                                                                        <Image width={21} height={24} src="/eesaweb/images/calendar-red.svg" alt='icon' />
                                                                    </div>
                                                                    <div className='ee-info'>
                                                                        <p className='text-uppercase'>{res.time}</p>
                                                                        <h5 className='mb-0 fw-bold'>{res.sub}</h5>
                                                                    </div>
                                                                </div> :
                                                                res.type === 'CALENDAR' && res.meeting_status !== "C" ?
                                                                    <div className='each-event d-flex align-items-center'>
                                                                        <div className='ee-icon rounded-circle bg-white border d-flex align-items-center justify-content-center'>
                                                                            <Image width={25} height={20} src="/eesaweb/images/google-meets.svg" alt='icon' />
                                                                        </div>
                                                                        <div className='ee-info'>
                                                                            <p className='text-uppercase'>{res.time}</p>
                                                                            <h5 className='mb-0 fw-bold'>{res.sub}</h5>
                                                                            <div className='d-flex align-items-center'>
                                                                                <div className='d-flex align-items-center meet-info mt-2 me-2'>
                                                                                    <div className='info-icon d-flex align-items-center'>
                                                                                        <Image width={16} height={16} src="/eesaweb/images/join-meet.svg" alt='icon' />
                                                                                    </div>
                                                                                    <a className='cursor-pointer' href={`https://meet.google.com/${res.meeting_code}`} target='_blank'>Join Now</a>
                                                                                </div>
                                                                                <div className={`d-flex align-items-center meet-info ${res.meeting_type === 'E' && 'active'} mt-2`} onClick={() => { this.handleCalendarUpdate(res) }}>
                                                                                    <div className='info-icon d-flex align-items-center'>
                                                                                        <Image width={16} height={16} src={`/eesaweb/images/join-eesa${res.meeting_type === 'E' ? '-white' : ''}.svg`} alt='icon' />
                                                                                    </div>
                                                                                    <a className='cursor-pointer'>Join as Eesa</a>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div> :
                                                                    ''
                                                        }
                                                    </>
                                                ))}
                                                {/* <div className='each-event d-flex align-items-center'>
                                        <div className='ee-icon rounded-circle bg-white border d-flex align-items-center justify-content-center'>
                                            <Image width={21} height={24} src="/eesaweb/images/red_bell.svg" alt='icon' />
                                        </div>
                                        <div className='ee-info'>
                                            <p className='text-uppercase'>04:50 PM</p>
                                            <h5 className='mb-0 fw-bold'>Chups Developers Meeting</h5>
                                        </div>
                                    </div> */}
                                            </div>
                                        </div>
                                    </Col>

                                    <Col lg={4} className='mb-4'>
                                        <div className='cust-card gray-bg p-0 h-100 '>
                                            <div className='noti-header'>
                                                <h6>Notification</h6>
                                            </div>
                                            <div className='noti-container'>
                                                {notificationList?.filter((val, ind) => {
                                                    return ind <= 4
                                                })?.map((res, i) => (
                                                    <div className='each-event d-flex align-items-center cursor-pointer' key={i} onClick={() => Router.push('Notification')}>
                                                        <div className='ee-icon rounded-circle bg-white border d-flex align-items-center justify-content-center'>
                                                            <Image width={21} height={24} src="/eesaweb/images/noti-icon-blue.svg" alt='icon' />
                                                        </div>
                                                        <div className='ee-info'>
                                                            <h5 className='mb-0 fw-bold'>{res?.notification}</h5>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* <div className='each-event d-flex align-items-center'>
                                                    <div className='ee-icon rounded-circle bg-white border d-flex align-items-center justify-content-center'>
                                                        <Image width={21} height={24} src="/eesaweb/images/noti-icon-blue.svg" alt='icon' />
                                                    </div>
                                                    <div className='ee-info'>
                                                        <h5 className='mb-0 fw-bold'>Chups Developers Meeting</h5>
                                                    </div>
                                                </div>
                                                <div className='each-event d-flex align-items-center'>
                                                    <div className='ee-icon rounded-circle bg-white border d-flex align-items-center justify-content-center'>
                                                        <Image width={21} height={24} src="/eesaweb/images/noti-icon-blue.svg" alt='icon' />
                                                    </div>
                                                    <div className='ee-info'>
                                                        <h5 className='mb-0 fw-bold'>Chups Developers Meeting</h5>
                                                    </div>
                                                </div> */}
                                            </div>

                                        </div>
                                        {/* <div className='cust-card gray-bg h-50'>
                                            <h6>Frequent Queries</h6>
                                            <ul className='ps-0 mb-0 fq-list d-flex align-items-center flex-wrap'>
                                                {queryList?.map((res, i) => (
                                                    <li key={i}>{res.query}</li>
                                                ))}
                                            </ul>
                                        </div> */}
                                    </Col>

                                    <Col lg={4} className='mb-4'>
                                        <div className='cust-card h-100'>
                                            <h6>Related Graph</h6>
                                            <h5 className='mb-4 fw-bold'>Sales Prediction</h5>

                                            <Slider {...settings}>
                                                <div>
                                                    {this.state.isrendered && <div className='w-100 h-100 position-relative'>
                                                        {predictionChart}
                                                    </div>}
                                                </div>

                                            </Slider>
                                        </div>
                                    </Col>
                                </Row>
                            </>
                        }

                        <Row>
                            {isEdit &&
                                <Col md={12}>
                                    <div className='d-flex align-items-center justify-content-between manage-cards my-3'>
                                        <div>
                                            <h2>Delete or Re-arrange Cards</h2>
                                            <p><strong>Note: </strong>Deleted cards/reports will be permanently removed from the system, you will not be able to retrieve it later. </p>
                                        </div>
                                        <div className='d-flex align-items-center'>
                                            <Button variant="outline-dark" onClick={() => { this.resetGraph() }}>Reset</Button>
                                            <Button variant="outline-primary" className='ms-2' disabled={isSave} onClick={() => { this.handleGraphSave() }}>Save</Button>
                                        </div>
                                    </div>
                                </Col>
                            }
                            {/* {chartList?.map((graph, i) => (
                                    <Col sm={6} md={6} lg={4} className='mb-4' key={i}>
                                        <div className='cust-card position-relative'>
                                            {isEdit &&
                                                <div className='close-icon position-absolute cursor-pointer' onClick={() => { this.deleteChart(graph.cId) }}>
                                                    <Image width={22} height={22} src="/eesaweb/images/close.svg" alt='Sample Image' />
                                                </div>
                                            }
                                            <h5 className='mb-4 fw-bold'>{graph?.query}</h5>
                                            <div className='graph-section position-relative'>
                                                {graph.i}
                                            </div>
                                        }
                                        <h5 className='mb-4 fw-bold'>{graph?.query}</h5>
                                        <div className='graph-section position-relative'>
                                            {graph.i}
                                        </div>
                                    </Col>
                                ))} */}
                            <SortableList
                                onSortEnd={this.onSortEnd}
                                allowDrag={isEdit}
                                className="row"
                                draggedItemClassName="dragged">
                                {chartList?.map((graph, i) => (
                                    <SortableItem key={graph}>
                                        <Col sm={6} md={6} lg={4} className='mb-4' key={i}>

                                            <div className='cust-card position-relative'>
                                                {isEdit &&
                                                    <div className='close-icon position-absolute cursor-pointer' onClick={() => { this.deleteChart(graph.cId) }}>
                                                        <Image width={22} height={22} src="/eesaweb/images/close.svg" alt='Sample Image' />
                                                    </div>
                                                }
                                                <h5 className='mb-4 fw-bold'>{graph?.query}</h5>
                                                <div className='graph-section position-relative'>
                                                    {graph.i}
                                                </div>
                                            </div>
                                        </Col>
                                    </SortableItem>
                                ))}
                            </SortableList>
                            {/* <Col className='mb-4'>
                                <div className='cust-card position-relative'>
                                    {isEdit &&
                                        <div className='close-icon position-absolute cursor-pointer'>
                                            <Image width={22} height={22} src="/eesaweb/images/close.svg" alt='Sample Image' />
                                        </div>
                                    }
                                    <h5 className='mb-4 fw-bold'>Sales Report</h5>
                                    <div className='graph-section position-relative'>
                                        <Image fill sizes="100%" src="/eesaweb/images/salesreport.png" alt='Sample Image' />
                                    </div>
                                </div>
                            </Col>

                            <Col className='mb-4'>
                                <div className='cust-card position-relative'>
                                    {isEdit &&
                                        <div className='close-icon position-absolute cursor-pointer'>
                                            <Image width={22} height={22} src="/eesaweb/images/close.svg" alt='Sample Image' />
                                        </div>
                                    }
                                    <h5 className='mb-4 fw-bold'>Todays Attendance</h5>
                                    <div className='graph-section position-relative'>
                                        <Image fill sizes="100%" src="/eesaweb/images/chart.png" alt='Sample Image' />
                                    </div>
                                </div>
                            </Col> */}
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
                {showSearch &&
                    <SearchModal speech_end={this.state.speech_end} show={showSearch} closemodel={() => { this.closemodel() }} onHide={() => { this.handleHide() }} getUpdate={this.handleUpdate} className="eesaSearchModal" />
                }
                {playMeeting &&
                    <PlaymeetingModal show={playMeeting} playMeetingId={playMeetingId} onHide={() => {
                        this.setState({ playMeeting: false }); localStorage.setItem('stopmeet', 1); setTimeout(() => {
                            localStorage.setItem('stopmeet', 0);
                        }, 1000);
                    }} className="playmeetingModal" />
                }
            </>
        )
    }
}

export default Dashboard
