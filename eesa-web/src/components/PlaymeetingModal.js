import React, { Component } from 'react'
import { Modal } from 'react-bootstrap'
import Image from 'next/image'
import { commonPostService } from '../../properties'

export class PlaymeetingModal extends Component {
    constructor(props) {
        super(props)
        this.state = {
            meetingSummary: {},
            fullscreenmodal: true
        }
    }

    componentDidMount() {
        let playMeetingId = this.props?.playMeetingId
        this.handlePlayMeeting(playMeetingId);
    }

    handlePlayMeeting = (pId) => {
        let params = {
            "calendar_id": pId
        }
        commonPostService(`api/get-calendar-info`, params).then(res => {
            if (res.status) {
                this.setState({ meetingSummary: res.object })
                this.funcplayvoice(res.object?.meeting_summary)
            }
            else {
                alert(res.msg);
            }
        })
    }

    funcplayvoice =(msg)=> {
        var old_texts = JSON.parse(localStorage.getItem('voicetext'));
        old_texts.push(msg);
        localStorage.setItem('voicetext', JSON.stringify(old_texts))
    }
    handleFullScreenModal = () => {
        this.setState({
            fullscreenmodal: !this.state.fullscreenmodal,
        })
    }
    render() {
        const { meetingSummary } = this.state
        return (
            <Modal centered {...this.props} size="lg" backdropClassName="custom-graycolor" className={`playmeetingModal ${this.state.fullscreenmodal ?"full_screen" : ""}`}>
                <Modal.Header closeButton className='border-bottom-0'>
                    <Modal.Title className='fw-bold'>Meeting Summary</Modal.Title>
                </Modal.Header>
                <Modal.Body className='py-0'>
                    <p>{meetingSummary?.meeting_summary}</p>
                    {/* <p>Vestibulum blandit viverra convallis. Pellentesque ligula urna, fermentum ut semper in, tincidunt nec dui. Morbi mauris lacus consequat eget justo in semper gravida enim. Donec ultrices varius ligula. Ut non pretium augue. Etiam non rutrum metus. In varius sit amet lorem tempus sagittis. Cras sed maximus enim, vel ultricies tortor. Pellentesque consectetur tellus ornare felis porta dapibus. Etiam eget viverra ipsum, ac posuere massaDuis malesuada iaculis augue, eu viverra mi pharetra at.</p>
                    <ul className='ps-3'>
                        <li>Ahoncus ligula id laoreet cursus.</li>
                        <li>Curabitur eu sem quis tellus hendrerit rutrum.</li>
                        <li>Praesent vitae ligula hendrerit, finibus ligula eget, egestas leo.</li>
                        <li>Ahoncus ligula id laoreet cursus.</li>
                        <li>Curabitur eu sem quis tellus hendrerit rutrum.</li>
                        <li>Praesent vitae ligula hendrerit, finibus ligula eget, egestas leo.</li>
                    </ul>
                    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin tempor erat quis tellus ullamcorper ultrices. Curabitur convallis est magna, eu feugiat eros congue bibendum.</p> */}
                </Modal.Body>
                <Modal.Footer>
                    <div className='w-100 d-flex align-items-center justify-content-between'>
                        <div className=''>
                            <p className='mb-0'>{meetingSummary?.meeting_start_dt}</p>
                            <h4 className='fw-bold mb-0'>{meetingSummary?.meeting_sub}</h4>
                        </div>
                        <div className='d-flex align-items-center'>
                            <div className='pmm-icon d-flex align-items-center justify-content-center ms-2 cursor-pointer' onClick={this.handleFullScreenModal}>
                                <Image width={18} height={18} src={`/eesaweb/images/${this.state.fullscreenmodal ? "popout-blue" : "share-icon"}.svg`} alt='icon' />
                            </div>
                            <div className='pmm-icon d-flex align-items-center justify-content-center ms-2 cursor-pointer'>
                                <Image width={18} height={18} src="/eesaweb/images/search-gray.svg" alt='icon' />
                            </div>
                            <div className='pmm-icon d-flex align-items-center justify-content-center ms-2 cursor-pointer'>
                                <Image width={11} height={13} src="/eesaweb/images/pause.svg" alt='icon' />
                            </div>
                        </div>
                    </div>
                </Modal.Footer>
            </Modal>
        )
    }
}

export default PlaymeetingModal
