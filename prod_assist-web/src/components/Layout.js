import Image from 'next/image'
import React, { Component } from 'react'
import { Container } from 'react-bootstrap'
import Router from "next/router";

class Layout extends Component {

  constructor(props) {
    super(props);
  }
  render() {
    const { page } = this.props
    return (
      <div className='body_container d-flex'>
        <div className='left_sidemenu'>
          <div className='logo mt-3'>
            <Image width={69} height={26} src="/eesaweb/images/eesa_logo.svg" alt='Logo' />
          </div>

          <ul className='ps-0'>
            <li className={`d-flex align-items-center ${page?.pageName === 'Dashboard' && 'active'}`} onClick={() => { Router.push('/Dashboard') }}>
              <div className='each-icon d-flex align-items-center justify-content-center'>
                <Image width={16} height={16} src={`/eesaweb/images/${page.pageName === 'Dashboard' ? "db-icon-blue" : "db-icon" }.svg`} alt='icon' />
              </div>
              Dashboard
            </li>
            <li className={`d-flex align-items-center ${page?.pageName === 'EventCalendar' && 'active'}`} onClick={() => { Router.push('/EventCalendar') }}>
              <div className='each-icon d-flex align-items-center justify-content-center'>
                <Image width={16} height={16} src={`/eesaweb/images/${page.pageName === 'EventCalendar' ? "calendar-icon-blue" : "calendar-icon" }.svg`} alt='icon' />
              </div>
              Calendar
            </li>
            <li className={`d-flex align-items-center ${page?.pageName === 'Task' && 'active'}`} onClick={() => { Router.push('/Task') }}>
              <div className='each-icon d-flex align-items-center justify-content-center'>
                <Image width={16} height={16} src={`/eesaweb/images/${page.pageName === 'Task' ? "task-icon-blue" : "task-icon" }.svg`} alt='icon' />
              </div>
              Tasks
            </li>
            <li className={`d-flex align-items-center ${page?.pageName === 'Notification' && 'active'}`} onClick={() => { Router.push('/Notification') }}>
              <div className='each-icon d-flex align-items-center justify-content-center'>
                <Image width={16} height={16} src={`/eesaweb/images/${page.pageName === 'Notification' ? "noti-icon-blue" : "noti-icon" }.svg`} alt='icon' />
              </div>
              Notifications
            </li>
            <li className={`d-flex align-items-center ${page?.pageName === 'Configuration' && 'active'}`} onClick={() => { Router.push('/Configuration') }}>
              <div className='each-icon d-flex align-items-center justify-content-center'>
                <Image width={16} height={16} src={`/eesaweb/images/${page.pageName === 'Configuration' ? "config-icon-blue" : "config-icon" }.svg`} alt='icon' />
              </div>
              Configuration
            </li>
            <li className={`d-flex align-items-center ${page?.pageName === 'Profile' && 'active'}`} onClick={() => { Router.push('/Profile') }}>
              <div className='each-icon d-flex align-items-center justify-content-center'>
                <Image width={16} height={16} src={`/eesaweb/images/${page.pageName === 'Profile' ? "myprofile-icon-blue" : "myprofile-icon" }.svg`} alt='icon' />
              </div>
              My Profile
            </li>
          </ul>
        </div>
        <div className='main_container'>
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default Layout