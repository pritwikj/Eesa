# This is calender process python file 
import time
import logging
from multiprocessing import Process

import psycopg2

from meet_assist import google_meet_web_scraping

logging.basicConfig(filename="eesa_meeting.log", level=logging.DEBUG, format="%(asctime)s  %(name)s  %(levelname)s: %(message)s")
logging.getLogger("selenium").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)

EESA_EMAIL='*****'
EESA_EMAIL_PASSWORD='******'

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname="*****",
            user="*****",
            password="******",
            host="*******",
            port="5432"
        )
        return conn
    except psycopg2.Error as e:
        logging.error("Error connecting to database:", e)
        return None
    
def close_db_connection(conn, cur=None):
    if cur:
        cur.close()
    if conn:
        conn.close()

def fetch_all(query, params=None):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)
        return cur.fetchall()
    except psycopg2.Error as e:
        logging.error("Error fetching data:", e)
        return None
    finally:
        close_db_connection(conn, cur)

def execute_query(query, params=None):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)
        conn.commit()
        return True
    except psycopg2.Error as e:
        logging.error("Error executing query:", e)
        return False
    finally:
        close_db_connection(conn, cur)

def process():
    try:
        query = "SELECT calendar_id, meeting_sub, meeting_code, meeting_start_dt \
            FROM user_calendar WHERE status=%s AND meeting_type=%s AND meeting_status=%s AND DATE(meeting_start_dt)=DATE(NOW())"
        params = ('A', 'E', 'P')
        calenders = fetch_all(query, params)
        
        if calenders:
            for calender in calenders:
                logging.info(calender)
                process = Process(target=google_meet_web_scraping, args=(EESA_EMAIL, EESA_EMAIL_PASSWORD, calender[2], calender[0]))
                process.start()

                # Update status as processing
                execute_query("UPDATE user_calendar SET meeting_status=%s WHERE calendar_id=%s", ("R",calender[0]))
    except Exception as e:
        logging.error("process - exception -", e)

if __name__ == "__main__":
    while True:
        process()
        time.sleep(5)
