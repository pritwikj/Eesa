import React, { Component } from 'react'
import Layout from '../components/Layout'
import { Container, Row, Col } from 'react-bootstrap'
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css"
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import 'react-big-calendar/lib/sass/styles.scss';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.scss'; // if using DnD 
import { commonPostService, notifySuccess, notifyError } from '../../properties';

class EventCalendar extends Component {
    constructor(props) {
      super(props)
    
      this.state = {
         eventList:[]
      }
    }
    componentDidMount(){
        let params = {
            "start_dt": "2023-04-18",
            "end_dt": "2023-04-21"        
        }
        commonPostService(`api/calendar-list`,params).then(res=>{
            if(res.status){
                this.setState({eventList:res?.object})
            }
            else{
                notifyError(res.msg);
            }
        })
    }
    render() {
        const locales = {
            "en-US": require("date-fns/locale/en-US")
        }
        
        const localizer = dateFnsLocalizer({
            format,
            parse,
            startOfWeek,
            getDay,
            locales,
        })
        
        const events = [
            {
                title: "Big Meeting",
                allDay: false,
                start: new Date(2023, 4, 12, 10, 33, 30, 0),
                end: new Date(2023, 4, 12, 12, 33, 30, 0)
            },
            {
                title: "Vacation",
                start: new Date(2023, 4, 15),
                end: new Date(2023, 4, 19)
            },
            {
                title: "Conference",
                start: new Date(2023, 4, 24),
                end: new Date(2023, 4, 26)
            },
        ]
        
        return (
            <Layout page={{ pageName: 'EventCalendar' }}>
                <Container fluid>
                    <Row>
                        <Col sm={12} className='my-4'>
                            <Calendar 
                            localizer={localizer} 
                            events={events} 
                            startAccessor="start" 
                            endAccessor="end" 
                            style={{height: 'calc(100vh - 50px)'}} />
                        </Col>
                    </Row>
                </Container>
            </Layout>
        )
    }
}

export default EventCalendar
