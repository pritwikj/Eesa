import os
import logging
import openai
import subprocess
import uuid
import string
import random
import re
import pandas as pd
import datetime
import json
from fuzzywuzzy import fuzz

from multiprocessing import Process

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders

from twilio.rest import Client

from flask import Flask, jsonify, request
from flask_cors import CORS

from passlib.hash import pbkdf2_sha256
from email_validator import validate_email, EmailNotValidError
from flask_httpauth import HTTPTokenAuth

import psycopg2

from opentable import opentable_web_scraping

app = Flask(__name__)
cors = CORS(app)

# Authentication
auth = HTTPTokenAuth("Bearer")

openai.api_key = "API KEY"

logging.basicConfig(filename="server.log", level=logging.DEBUG, format="%(asctime)s  %(name)s  %(levelname)s: %(message)s")

help_dict = {
    'one': '1',
    'two': '2',
    'three': '3',
    'four': '4',
    'five': '5',
    'six': '6',
    'seven': '7',
    'eight': '8',
    'nine': '9',
    'zero': '0'
}

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
        print("Error connecting to database:", e)
        return None

def close_db_connection(conn, cur=None):
    if cur:
        cur.close()
    if conn:
        conn.close()

def execute_query(query, params=None):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        id = 0
        if params:
            cur.execute(query, params)
            try:
                id = cur.fetchone()[0]
            except:
                pass
        else:
            cur.execute(query)
        conn.commit()
        return True, id
    except psycopg2.Error as e:
        print("Error executing query:", e)
        return False, 0
    finally:
        close_db_connection(conn, cur)

def executemany(query, data_to_insert):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.executemany(query, data_to_insert)
        conn.commit()
        return True
    except psycopg2.Error as e:
        print("Error executing query:", e)
        return False
    finally:
        close_db_connection(conn, cur)

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
        print("Error fetching data:", e)
        return None
    finally:
        close_db_connection(conn, cur)

def fetch_one(query, params=None):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)
        return cur.fetchone()
    except psycopg2.Error as e:
        print("Error fetching data:", e)
        return None
    finally:
        close_db_connection(conn, cur)

@app.route("/", methods=['GET', 'POST'])
@app.route("/api", methods=['GET', 'POST'])
def home():
    return "ChatGPT Eesa API services."

@app.route("/api/login", methods = ["POST"])
def user_login():
    resp_dict = {"status":False, "msg":"", "object":None}
    try:
        email = request.json.get("email")
        password = request.json.get("password")

        input_validation = ""
        if not email:
            input_validation = "Email is required"

        elif not email_validation(email):
            input_validation = "Email is invalid. Please enter a valid email address"

        elif not password:
            input_validation = "Password is required"

        if input_validation:
            resp_dict["msg"] = input_validation
            return jsonify(resp_dict)

        user_account = fetch_one("SELECT user_id, user_name, user_email, user_password, status FROM user_account WHERE user_email=%s", (email.lower(),))
        if not user_account:
            resp_dict["msg"] = "Invalid Login Credentials"
            return jsonify(resp_dict)

        if not verify_password(password, user_account[3]):
            resp_dict["msg"] = "Invalid Login Credentials"
            return jsonify(resp_dict)

        if not user_account[4] == 'A':
            resp_dict["msg"] = "Your account has been disabled, Please see your system administrator"
            return jsonify(resp_dict)

        token = user_token_insert(user_account[0])
        if not token:
            resp_dict["msg"] = "Login authentication process failed, please try again after some time"
            return jsonify(resp_dict)

        resp_dict["object"] = {
            "token" : token,
            "name" : user_account[1],
            "email" : user_account[2]
        }
        resp_dict["status"]  = True
    except Exception as error:
        app.logger.error("user_login : exception :  %s", error)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

def email_validation(email):
    try:
        email = email.strip()
        validate_email(email)
        return True
    except EmailNotValidError:
        return False
    
def hash_password(input_password):
    """ Password hasing using passlib package"""
    return pbkdf2_sha256.hash(input_password)

def verify_password(input_password, db_password):
    """ Password verification """
    return pbkdf2_sha256.verify(input_password, db_password)

def user_token_insert(user_id):
    token = ""
    try:
        token = uuid.uuid4()
        while fetch_one("SELECT token FROM user_token WHERE token=%s", (str(token),)):
            token = uuid.uuid4()

        token = str(token)
        execute_query("INSERT INTO user_token VALUES(%s, %s, %s, NOW(),NOW())", (token, user_id, 'A'))
    except Exception as error:
         app.logger.error("user_token_insert - %s", error)
    return token

def random_password():
    """ Random Password Generation """
    chars = string.ascii_uppercase + string.ascii_lowercase + string.digits
    size = random.randint(8, 12)
    return "".join(random.choice(chars) for x in range(size))

class Login:
    def __init__(self, user_id, user_name):
        self.user_id=user_id
        self.user_name=user_name

@auth.verify_token
def verify_auth_token(token):
    """ Auth token verification """
    try:
        print(token)
        user_token = fetch_one("SELECT token, user_id FROM user_token WHERE token=%s AND status=%s", (token,'A'))
        if user_token:
            # Deactivate old session
            #execute_query("UPDATE user_token SET status =%s WHERE user_id =%s AND token !=%s AND status =%s", 
            #              ('D', user_token[1], user_token[0], 'A'))
            user_account = fetch_one("SELECT user_id, user_name FROM user_account WHERE user_id=%s", (user_token[1],))
            if user_account:
                return Login(user_account[0], user_account[1])
    except Exception as error:
        app.logger.error("verify_auth_token : exception :  %s", error)
    return None

@app.route("/api/forget-password", methods = ["POST"])
def forget_password():
    """Forgot Password"""
    resp_dict = {"status":False, "msg":"", "object":None}
    try:
        email = request.json.get("email")

        if not email:
            resp_dict["msg"] = "Email is required"
            return resp_dict

        if not email_validation(email):
            resp_dict["msg"] = "Email is invalid. Please enter a valid email address"
            return resp_dict

        user_account = fetch_one("SELECT user_id, user_email FROM user_account WHERE user_email=%s AND status=%s", (email.lower(), 'A'))
        if user_account:
            #creating the temporary password
            temp_password = random_password()
            print(temp_password)
            execute_query("UPDATE user_account SET user_password=%s, up_dt=NOW() WHERE user_id=%s", (hash_password(temp_password), user_account[0]))
            
            login_template = f'''
                            Hello,\n
                            Here is your login credentials:
                            Email : {user_account[1]}
                            Password : {temp_password}
                            \n
                            Thanks,
                            Easa Team
                        '''
            send_email(user_account[1], login_template, 'Easa - Login Info', None)

        resp_dict["status"] = True
        resp_dict["msg"] = "We have sent an email to your registered email address"
    except Exception as error:
        app.logger.error("forget_password : exception :  %s", error)
        resp_dict["msg"] = "Internal Server Error"

    return jsonify(resp_dict)

@app.route("/api/dashboard", methods=['POST'])
@auth.login_required()
def dashboard():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        # Daily briefing
        query = '''
            SELECT id, sub, TO_CHAR(dt,'HH:MI AM'), record_type, meeting_code, meeting_type, meeting_status FROM (
                SELECT calendar_id AS id, meeting_sub AS sub, meeting_start_dt AS dt, 'CALENDAR' AS record_type, meeting_code, meeting_type, \
                meeting_status FROM user_calendar WHERE status=%s AND user_id=%s
                UNION 
                SELECT task_id AS id, task_desc AS sub, task_dt AS dt, 'TASK' AS record_type, '' AS meeting_code, '' AS meeting_type, \
                '' AS meeting_status FROM user_task WHERE status=%s AND user_id=%s)
                S WHERE DATE(dt)=DATE(NOW()) ORDER BY S.dt;
            '''
        params = ('A', auth.current_user().user_id, 'Z', auth.current_user().user_id)
        briefings = fetch_all(query, params)

        briefing_list = []
        if briefings:
            for briefing in briefings:
                briefing_list.append({'id':briefing[0],'sub':briefing[1],'time':briefing[2],'type':briefing[3],
                                    'meeting_code':briefing[4],'meeting_type':briefing[5],'meeting_status':briefing[6]})

        query = "SELECT query_id, query FROM user_query WHERE user_id=%s ORDER BY cr_dt DESC  LIMIT 5"
        params = (auth.current_user().user_id,)
        queries = fetch_all(query, params)

        # Frequent queries
        query_list = []
        if queries:
            for query in queries:
                query_list.append({'id':query[0],'query':query[1]})

        # Graph data
        query = "SELECT list_id, index_no, query, graph_type, code FROM user_dashboard_list WHERE user_id=%s AND status=%s ORDER BY index_no ASC"
        params = (auth.current_user().user_id, 'A')
        queries = fetch_all(query, params)

        graph_list = []
        for query in queries:
            conn = get_db_connection()
            cur = conn.cursor()

            cur.execute(query[4])
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
            results = []
            for row in rows:
                row_dict = dict(zip(columns, row))
                results.append(row_dict)

            output = json.dumps(results, default=str)
            close_db_connection(conn, cur)

            graph_list.append({
                'list_id':query[0],
                'index_no':query[1],
                'query':query[2],
                'graph_type':query[3],
                'output':output
            })

        # Prediction data
        query = "SELECT to_char(ds, 'YYYY-MM-DD') AS ds, y, prediction FROM sales_prediction ORDER BY ds;"
        queries = fetch_all(query)
        predictions = [{'ds':query[0], 'y':query[1], 'prediction':query[2]} for query in queries]
        predictions = predictions[-50:]

        resp_dict["status"] = True
        resp_dict["object"] = {
                'briefing_list':briefing_list,
                'query_list':query_list,
                'graph_list': graph_list,
                'prediction_list': predictions
            }
    except Exception as e:
        app.logger.error('dashboard : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)    

@app.route("/api/dashboard-graph-order-change", methods=['POST']) 
@auth.login_required()
def dashboard_graph_order_change():  
    resp_dict={"status":False,"msg":"","object":None}
    try:
        list_ids = request.json.get("list_ids")
        index = 1
        # Update index sequence
        for list_id in list_ids:
             execute_query("UPDATE user_dashboard_list set index_no=%s, up_dt=NOW(), up_by=%s WHERE list_id=%s", (index, auth.current_user().user_id, list_id))
        
        # Update removed graph as deleted status
        query = "SELECT list_id FROM user_dashboard_list WHERE user_id=%s AND status=%s"
        params = (auth.current_user().user_id, 'A')
        queries = fetch_all(query, params)
        for query in queries:
            if not query[0] in list_ids:
                execute_query("UPDATE user_dashboard_list set status=%s, up_dt=NOW(), up_by=%s WHERE list_id=%s", ("D", auth.current_user().user_id, query[0]))

        resp_dict["status"] = True
        resp_dict["msg"] = "Updated successfully"
    except Exception as e:
        app.logger.error('dashboard_graph_order_change : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/calendar-list",methods=['POST'])
@auth.login_required()
def calender_list():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        start_dt = request.json.get("start_dt")
        end_dt = request.json.get("end_dt")

        query = "SELECT calendar_id, meeting_sub, meeting_start_dt, meeting_end_dt, meeting_type, meeting_status, TO_CHAR(meeting_start_dt,'HH:MI AM') AS meeting_start_time\
                FROM user_calendar WHERE user_id=%s AND status=%s AND DATE(meeting_start_dt)>=%s AND DATE(meeting_end_dt)<=%s"
        params = (auth.current_user().user_id, 'A', start_dt, end_dt)
        calenders = fetch_all(query, params)
        
        calender_list = []
        if calenders:
            for calender in calenders:
                calender_list.append({'calendar_id':calender[0],'meeting_sub':calender[1],'meeting_start_dt':calender[2],
                                      'meeting_end_dt':calender[3],'meeting_type':calender[4], 'meeting_status':calender[5], 'meeting_start_time': calender[6]})
        resp_dict["status"] = True
        resp_dict["object"] = calender_list
    except Exception as e:
        app.logger.error('user_profile : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/calendar-save",methods=['POST'])
@auth.login_required()
def calendar_save():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        meeting_sub = request.json.get("meeting_sub")
        meeting_code = request.json.get("meeting_code")
        meeting_start_dt = request.json.get("meeting_start_dt")
        meeting_end_dt = request.json.get("meeting_end_dt")

        query = "INSERT INTO user_calendar (user_id, meeting_sub, meeting_code, meeting_start_dt, meeting_end_dt, cr_dt, cr_by) \
                    VALUES(%s, %s, %s, %s, %s, NOW(), %s) RETURNING calendar_id"
        params = (auth.current_user().user_id, meeting_sub, meeting_code, meeting_start_dt, meeting_end_dt,auth.current_user().user_id)
        insert_status = execute_query(query, params)

        if insert_status[0]:
            resp_dict["msg"] = "Calendar created successfully"
            resp_dict["status"] = True
    except Exception as e:
        print(e)
        app.logger.error('calendar_save : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/get-calendar-info",methods=['POST'])
@auth.login_required()
def get_calendar_info():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        calendar_id = request.json.get("calendar_id")

        query = "SELECT calendar_id, meeting_sub, TO_CHAR(meeting_start_dt,'Mon DD, YYYY HH:MI AM'), meeting_summary FROM user_calendar WHERE calendar_id=%s AND status=%s"
        params = (calendar_id, 'A')
        calendar = fetch_one(query, params)

        if calendar:
            resp_dict["status"] = True
            resp_dict["object"] = {'calendar_id' : calendar[0], 'meeting_sub' : calendar[1], 'meeting_start_dt' : calendar[2], 'meeting_summary' : calendar[3]}
        else:
            resp_dict["msg"] = "Failed to fetch calender"
    except Exception as e:
        app.logger.error('get_calendar_info : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/calender-update",methods=['POST'])
@auth.login_required()
def calender_update():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        calendar_id = request.json.get("calendar_id")
        meeting_type = request.json.get("meeting_type")

        execute_query("UPDATE user_calendar set meeting_type=%s, up_dt=NOW(), up_by=%s WHERE calendar_id=%s", 
                      (meeting_type, auth.current_user().user_id, calendar_id))

        resp_dict["msg"] = "Calendar updated successfully"
        resp_dict["status"] = True
    except Exception as e:
        app.logger.error('calender_update : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/task-list",methods=['POST'])
@auth.login_required()
def task_list():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        input_date = request.json.get("input_date")

        query = "SELECT task_id, task_desc, TO_CHAR(task_dt,'HH:MI AM') AS task_dt, task_status FROM user_task WHERE user_id=%s AND status=%s AND DATE(task_dt)=%s"
        params = (auth.current_user().user_id, 'A', input_date)
        tasks = fetch_all(query, params)

        task_list = []
        if tasks:
            for task in tasks:
                task_list.append({'task_id':task[0],'task_desc':task[1],'task_dt':task[2],'task_status':task[3]})
        resp_dict["status"] = True
        resp_dict["object"] = task_list
    except Exception as e:
        app.logger.error('task_list : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

def task_save(task_desc):
    try:
        query = "INSERT INTO user_task (user_id, task_desc, task_dt, cr_dt, cr_by) \
                    VALUES(%s, %s, NOW(), NOW(), %s) RETURNING task_id"
        params = (auth.current_user().user_id, task_desc, auth.current_user().user_id)
        insert_status = execute_query(query, params)
        if insert_status[0]:
            app.logger.info("Task created successfully")
    except Exception as e:
        app.logger.error('task_save : exception :  %s', e)

def notification_save(notification):
    try:
        query = "INSERT INTO user_notification (user_id, notification, notification_desc, cr_dt) values(%s, %s, %s, now())"
        params = (auth.current_user().user_id, notification, notification)
        insert_status = execute_query(query, params)
        if insert_status[0]:
            app.logger.info("Notification created successfully")
    except Exception as e:
        app.logger.error('notification_save : exception :  %s', e)

@app.route("/api/task-delete",methods=['POST'])
@auth.login_required()
def task_delete():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        task_id = request.json.get("task_id")

        execute_query("UPDATE user_task set status=%s, up_dt=NOW(), up_by=%s WHERE task_id=%s", ("D", auth.current_user().user_id, task_id))

        resp_dict["msg"] = "Deleted successfully"
        resp_dict["status"] = True
    except Exception as e:
        app.logger.error('task_delete : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/notification-list",methods=['POST'])
@auth.login_required()
def notification_list():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        query = "SELECT notification_id, notification, notification_desc, TO_CHAR(cr_dt,'HH:MI AM') AS cr_dt FROM user_notification \
            WHERE user_id=%s AND status=%s ORDER BY notification_id DESC LIMIT 10"
        params = (auth.current_user().user_id, 'A')
        notifications = fetch_all(query, params)

        notification_list = []
        if notifications:
            for notification in notifications:
                notification_list.append({'notification_id':notification[0],'notification':notification[1],
                                          'notification_desc':notification[2],'cr_dt':notification[3]})
        resp_dict["status"] = True
        resp_dict["object"] = notification_list
    except Exception as e:
        app.logger.error('notification_list : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/configuration-list",methods=['POST'])
@auth.login_required()
def configuration_list():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        query = "SELECT C.config_id, C.config_data_type, TO_CHAR(C.cr_dt,'Mon DD, YYYY HH:MI AM') AS cr_dt, COUNT(M.dataset_id) AS map_record_count, \
                string_agg(M.dataset_name, ',') AS dataset_names \
                FROM \
                    user_data_config C \
                LEFT JOIN \
                    user_data_config_dataset_map M \
                ON \
                    C.config_id = M.config_id \
                WHERE \
                    M.status= %s AND C.status = %s AND C.user_id=%s \
                GROUP BY \
                    C.config_id, C.config_data_type, C.cr_dt"
        params = ('A', 'A', auth.current_user().user_id)
        configs = fetch_all(query, params)
        
        config_list = []
        if configs:
            for config in configs:
                config_list.append({'config_id':config[0],'config_data_type':config[1],'cr_dt':config[2],
                                    'record_count':config[3], 'dataset_names':config[4]})
        resp_dict["status"] = True
        resp_dict["object"] = config_list
    except Exception as e:
        app.logger.error('configuration_list : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/configuration-save-update",methods=['POST'])
@auth.login_required()
def configuration_save_update():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        config_id = request.json.get("config_id")
        config_data_type = request.json.get("config_data_type")
        config_user_login_id = request.json.get("config_user_login_id")
        config_user_password = request.json.get("config_user_password")

        config_maps = request.json.get("config_maps")

        if config_id==0:
            query = "INSERT INTO user_data_config (user_id, config_data_type, config_user_login_id, config_user_password, cr_dt, cr_by) \
                    VALUES(%s, %s, %s, %s, NOW(), %s) RETURNING config_id"
            params = (auth.current_user().user_id, config_data_type, config_user_login_id, config_user_password, auth.current_user().user_id)
            insert_status = execute_query(query, params)

            if insert_status[0]:
                config_id = insert_status[1]
                # Insert new map record
                user_data_config_dataset_map_insert(config_maps, config_id, auth.current_user().user_id)
            resp_dict["msg"] = "Config created successfully"
        else:
            execute_query("UPDATE user_data_config set up_dt=NOW(), up_by=%s WHERE config_id=%s", (auth.current_user().user_id, config_id))
            # Delete old record
            execute_query("DELETE FROM user_data_config_dataset_map WHERE config_id=%s", (config_id,))
            # Insert new map record
            user_data_config_dataset_map_insert(config_maps, config_id, auth.current_user().user_id)
            resp_dict["msg"] = "Config updated successfully"
        
        resp_dict["status"] = True
    except Exception as e:
        app.logger.error('get_configuration : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

def user_data_config_dataset_map_insert(config_maps, config_id, user_id):
    query = "INSERT INTO user_data_config_dataset_map (config_id, dataset_name, dataset_fetch_type, \
            dataset_fetch_from_date, dataset_run_time_type, dataset_run_time, cr_dt, cr_by) \
            VALUES(%s, %s, %s, %s, %s, %s, NOW(), %s)"
    data_to_insert = []
    for config_map in config_maps:
        data_to_insert.append(tuple([config_id, config_map['dataset_name'], config_map['dataset_fetch_type'],  
                    config_map['dataset_fetch_from_date'], config_map['dataset_run_time_type'], config_map['dataset_run_time'],user_id]))
    executemany(query, data_to_insert)

@app.route("/api/report-list",methods=['POST'])
@auth.login_required()
def report_list():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        resp_dict["status"] = True
        resp_dict["object"] = [
            "Item Sales Report",
            "Waiter Sales Report",
            "Order Flow Report",
            "Partner Sales Report",
            "Partner Order Report",
            "Unassigned Item Report",
            "Staging Report",
            "Cooking Report",
            "Cooking Consolidated Report",
            "Activity Report",
            "Order Activity Report",
            "Purchase Report",
            "Costing Report",
            "Item Costing Report"
        ]
    except Exception as e:
        app.logger.error('report_list : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/get-configuration",methods=['POST'])
@auth.login_required()
def get_configuration():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        config_id = request.json.get("config_id")

        query = "SELECT dataset_id, config_id, dataset_name, dataset_fetch_type, dataset_fetch_from_date, dataset_run_time_type, TO_CHAR(dataset_run_time,'HH:MI AM') \
            FROM user_data_config_dataset_map WHERE config_id=%s AND status=%s"
        params = (config_id, 'A')
        config_maps = fetch_all(query, params)

        config_map_list = []
        if config_maps:
            for config_map in config_maps:
                config_map_list.append({'dataset_id':config_map[0], 'config_id':config_map[1], 'dataset_name':config_map[2], 
                                        'dataset_fetch_type':config_map[3], 'dataset_fetch_from_date':(config_map[4] if config_map[4] else ''), 
                                        'dataset_run_time_type':config_map[5], 'dataset_run_time':config_map[6]})
        resp_dict["status"] = True
        resp_dict["object"] = config_map_list
    except Exception as e:
        app.logger.error('get_configuration : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/user-profile",methods=['POST'])
@auth.login_required()
def user_profile():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        query = "SELECT user_id, user_name, user_email, user_phone FROM user_account WHERE user_id=%s AND status=%s"
        params = (auth.current_user().user_id, 'A')
        user = fetch_one(query, params)
        if user:
            resp_dict["status"] = True
            resp_dict["object"] = {'user_id' : user[0], 'user_name' : user[1], 'user_email' : user[2], 'user_phone' : user[3]}
        else:
            resp_dict["msg"] = "Failed to fetch users"
    except Exception as e:
        app.logger.error('user_profile : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

# ChatGPT releated services
@app.route("/api/chatgpt-categories",methods=['POST'])
@auth.login_required()
def chatgpt_categories():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        prompt = request.json.get("prompt")
        resp_dict["object"] = find_category(prompt)
        resp_dict["status"] = True
    except Exception as e:
        app.logger.error('chatgpt_categories : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/chatgpt-search",methods=['POST'])
@auth.login_required()
def chatgpt_search():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        prompt = request.json.get("prompt")
        category = request.json.get("category")

        if category == 1:
            # Qns
            api_resps = chatgpt_postgres_query(prompt, 'chups_sales')
            query_id = 0
            if api_resps[1]:

                query = "INSERT INTO user_query (user_id, query, cr_dt ) VALUES(%s, %s, NOW()) RETURNING query_id"
                params = (auth.current_user().user_id, prompt)
                execute_query(query, params)
                
                query = "INSERT INTO chatgpt_search_log (query, code, cr_dt ) VALUES(%s, %s, NOW()) RETURNING query_id"
                params = (prompt, api_resps[2])
                
                insert_status = execute_query(query, params)
                query_id= insert_status[1] if insert_status[0] else 0

            resp_dict["status"] = True
            resp_dict["object"] = {
                'response': api_resps[0],
                'query_id': query_id
            }
        elif category == 2:
            # Mail
            resp = chatgpt_mail(prompt)
            if resp:
                resp_dict["status"] = True
                resp_dict["object"] = resp
            else:
                resp_dict["status"] = False
                resp_dict["msg"] = "Unable to generate the email."
        elif category == 3:
            # SMS
            resp = chatgpt_sms(prompt)
            if resp:
                resp_dict["status"] = True
                resp_dict["object"] = resp
            else:
                resp_dict["status"] = False
                resp_dict["msg"] = "Unable to generate the SMS."
        elif category == 4:
            # Opentable
            opentable_dict = opentable_data_extraction(prompt)
            resp_dict["status"] = True
            resp_dict["object"] = opentable_dict
        elif category == 5:
            # Meeting
            meeting_dict = meeting_data_list(prompt)
            resp_dict["status"] = True
            resp_dict["object"] = meeting_dict
        else:
            resp_dict["msg"] = "We are currently unable to process your query. Please try again later."
    except Exception as ex:
        app.logger.error('chatgpt_search : exception :  %s', ex)
    return jsonify(resp_dict)

@app.route("/api/chatgpt-graph-mail-search",methods=['POST'])
@auth.login_required()
def chatgpt_graph_mail_search():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        prompt = request.json.get("prompt")
        resp = chatgpt_graph_mail(prompt)
        if resp:
            resp_dict["status"] = True
            resp_dict["object"] = resp
        else:
            resp_dict["status"] = False
            resp_dict["msg"] = "Unable to generate the email."
    except Exception as ex:
        app.logger.error('chatgpt_graph_mail_search : exception :  %s', ex)
    return jsonify(resp_dict)
    
@app.route("/api/pin-to-dashboard",methods=['POST'])
@auth.login_required()
def pin_to_dashboard():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        query_id = request.json.get("query_id")
        graph_type = request.json.get("graph_type")
        
        query = "INSERT INTO user_dashboard_list (user_id, index_no, query, graph_type, code, cr_dt, cr_by) \
                (SELECT %s, (SELECT COALESCE(MAX(index_no), 0) + 1 FROM user_dashboard_list WHERE user_id=%s), query, %s, code, NOW(), %s \
                    FROM chatgpt_search_log WHERE query_id=%s) RETURNING list_id"
        params = (auth.current_user().user_id, auth.current_user().user_id, graph_type, auth.current_user().user_id, query_id)
        insert_status = execute_query(query, params)
        
        if insert_status[0]:
            resp_dict["msg"] = "Added successfully"
            resp_dict["status"] = True
    except Exception as e:
        app.logger.error('pin_to_dashboard : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route('/api/send-attachment-mail/<string:email>/<string:subject>/<string:message>', methods=['POST'])
@auth.login_required()
def send_attachment_mail(email, subject, message):
    # Check if the POST request contains a file
    if 'image' not in request.files:
        return "No image file found", 400

    file = request.files['image']

    # Check if the file has a valid filename
    if file.filename == '':
        return "No selected file", 400

    # Save the file to a designated folder
    file.save('images/' + file.filename)

    # Send an email
    send_email(email, message, subject, 'images/' + file.filename)
    task_save(f"Mail sent successfully, To:{email} and Subject:{subject}")
    notification_save(f"Mail sent successfully, To:{email} and Subject:{subject}")

    return "Mail Sent successfully"

@app.route("/api/send-mail",methods=['POST'])
@auth.login_required()
def send_mail():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        email = request.json.get("email")
        subject = request.json.get("subject")
        message = request.json.get("message")
        
        send_email(email,message,subject, None)
        task_save(f"Mail sent successfully, To:{email} and Subject:{subject}")
        notification_save(f"Mail sent successfully, To:{email} and Subject:{subject}")
        resp_dict["msg"] = "Mail sent successfully"
        resp_dict["status"] = True
    except Exception as e:
        app.logger.error('send_mail : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/send-sms",methods=['POST'])
@auth.login_required()
def send_sms():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        mobile = request.json.get("mobile")
        message = request.json.get("message")
        
        send_twilio_sms(mobile, message)
        task_save(f"SMS sent successfully, To:{mobile}")
        notification_save(f"SMS sent successfully, To:{mobile}")
        resp_dict["msg"] = "SMS sent successfully"
        resp_dict["status"] = True
    except Exception as e:
        app.logger.error('send_sms : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

@app.route("/api/opentable-booking",methods=['POST'])
@auth.login_required()
def opentable_booking():
    resp_dict={"status":False,"msg":"","object":None}
    try:
        restaurant_name = request.json.get("restaurant_name")
        number_of_people = request.json.get("number_of_people")
        time = request.json.get("time")

        user_account = fetch_one("SELECT user_id, user_name, user_email, user_phone FROM user_account WHERE user_id=%s", 
                                     (auth.current_user().user_id,))
        if user_account:
            time = time_extrator_formatter(time)
            if not time:
                time = datetime.datetime.now()
                if time.minute < 30:
                    time = datetime.time(time.hour, 30)
                else:
                    time = datetime.time((time.hour + 1) % 24, 0)
                time=time.strftime("%I:%M %p")
            open_table_booking(auth.current_user().user_id, restaurant_name.title(), time, number_of_people, 
                            user_account[1], user_account[1], user_account[2], user_account[3])

            resp_dict["status"] = True
            resp_dict["msg"] = "Opentable booking has been initiated."
        
    except Exception as e:
        app.logger.error('opentable_booking : exception :  %s', e)
        resp_dict["msg"] = "Internal Server Error"
    return jsonify(resp_dict)

def find_category(input_prompt):
    try:        
        prompt = (f"I want to categorize the following input:\n"
              f"{input_prompt}\n"
              f"Please provide me with the category number associated with the query, disregarding the context.\n"
              f"Please provide me with the category name and number.\n"
              f"Any questions related to finances will be considered as general questions.\n"
              f"Categories:\n"
              f"1. Question\n"
              f"2. Mail or Email\n"
              f"3. Message or SMS or Text\n"
              f"4. Table booking or OpenTable\n"
              f"5. Meeting or Calendar or Event\n"
              )

        completions = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=1024,
            n=1,
            stop=None,
            temperature=0.5
        )

        resp = completions.choices[0].text.strip()
        app.logger.info('category resp : %s', resp)

        if '1' in resp:
            return 1
        elif '2' in resp:
            return 2
        elif '3' in resp:
            return 3
        elif '4' in resp:
            return 4
        elif '5' in resp:
            return 5
        else:
            return 1
    except Exception as ex:
        app.logger.error('find_category : exception :  %s', ex)
    return 0

def chatgpt_api_call(qns, file_name):
    try:
        # Preprocessing
        df=pd.read_csv(file_name)
        df = df.rename(columns=lambda x: x.strip())
        df = df.rename(columns=lambda x: x.replace(' ', '_'))
        df.to_csv(file_name, index=False)
        
        # Read csv data
        df=pd.read_csv(file_name)
        columns = ','.join(df.columns.tolist())
        
        # propmt
        prompt=(f'''{qns} By pandas dataframe.
            csv sample data:{df.head()} 
            file name:{file_name}.
            columns name are:{columns}
            
            1. Import warnings to avoid user warnings.
            2. Make sure you are using a datetime-like object, such as a Pandas datetime series, datetime columns in a Pandas DataFrame, or datetime.datetime or pd.Timestamp objects. 
            3. If you are using a Pandas DataFrame or Series, ensure that the datetime column has been properly converted to datetime using pd.to_datetime() if needed. 
            4. Avoid using ".dt" accessor on objects that are not recognized as datetime-like values, as it will result in the mentioned error. 
            5. Double-check that you are using the correct datetime attributes or methods with the ".dt" accessor, such as .day, .month, .year, etc., depending on your requirements.
            6. Generate the output only with Python code.
            7. Float values should be rounded to 2 decimal places.
            8. The final output should be printed as detailed json format and convert to string.
            ''')

        completions = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=1024,
            n=1,
            stop=None,
            temperature=0.5
        )

        chatgpt_response = completions.choices[0].text.strip() 
        app.logger.info("chatgpt_response:\n"+chatgpt_response)

        # Extract Python code from the response
        lines = chatgpt_response.split("\n")
        i,start_index,end_index = 0,-1,-1
        
        for line in lines:
            if  start_index==-1 and (line == '```' or  line == '```python'):
                start_index=i
            elif  not start_index==-1 and line == '```':
                end_index=i
            if not start_index==-1 and not end_index==-1:
                break 
            i += 1
        
        python_codes= []
        if end_index>-1:
            python_codes = lines[start_index +1 : end_index ]
        else:
            python_codes = lines[start_index +1 : ]

        # Write a python code into .py file
        with open('python_code.py', 'w') as file:
             for code in python_codes:
               file.write("%s\n" % code.strip())

        # Execute the command and capture the output
        output = ""
        contents = ""
        try:
            output = subprocess.check_output('python python_code.py', shell=True, stderr=subprocess.STDOUT, text=True)
            app.logger.info("Command output:\n"+output)
        except Exception:
            pass
        
        if output:
            with open('python_code.py') as f:
                contents = f.read()

        # Remove python file
        os.remove('python_code.py')
        if contents:
            return output, True, contents
        else:
            return 'Failed to generate a response. Please try again later.', False, ''
    except Exception as ex:
        app.logger.error('chatgpt_api_call : exception :  %s', ex)
    return "I'm sorry, but an error has occurred. Please try again or contact support for assistance.", False, ""

def chatgpt_postgres_query(qns, table_name):
    try:
        query = "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name=%s"
        params = (table_name,)
        rows = fetch_all(query, params)
        meta_data=""
        for row in rows:
            meta_data = meta_data+f"{row[0]} {row[1]}\n"

        # propmt
        prompt=(f'''Postgres table: {table_name} and meta data: {meta_data}.
            Provide the PostgreSQL query for the bwlow question.
            {qns}''')

        completions = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=1024,
            n=1,
            stop=None,
            temperature=0
        )

        chatgpt_response = completions.choices[0].text.strip() 
        print("chatgpt_response:\n"+chatgpt_response)

        # Execute the command and capture the output
        select_query = query_extraction(chatgpt_response)
        if not select_query: return 'Failed to generate a response. Please try again later.', False, ''

        output = ""
        contents = ""
        conn = get_db_connection()
        cur = conn.cursor()
        # execute the query
        cur.execute(select_query)
        rows = cur.fetchall()

        if rows:
            # get the column names from the cursor description
            columns = [desc[0] for desc in cur.description]

            # create a list of dictionaries for each row in the result set
            results = []
            for row in rows:
                row_dict = dict(zip(columns, row))
                results.append(row_dict)

            # serialize the results as JSON
            output = json.dumps(results, default=str)
            contents = select_query
            app.logger.info("Command output:\n"+output)

        close_db_connection(conn, cur)
   
        if contents:
            return output, True, contents
        else:
            return 'Failed to generate a response. Please try again later.', False, ''
    except Exception as ex:
        app.logger.error('chatgpt_postgres_query : exception :  %s', ex)
    return "I'm sorry, but an error has occurred. Please try again or contact support for assistance.", False, ""

def send_email(recipient_email, message, subject, filename):
    try:
        # Sender and recipient email addresses
        sender_email = "****"

        # Sender and recipient email passwords
        sender_password = "*****"

        # Create the email message object
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = subject

        # Attach the image to the email
        if filename:
            attachment = open(filename, 'rb')
            image = MIMEBase('application', 'octate-stream')
            image.set_payload((attachment).read())
            encoders.encode_base64(image)
            image.add_header('Content-Disposition', "attachment; filename= %s" % filename)
            msg.attach(image)

        # Add body text to the email
        body = message
        msg.attach(MIMEText(body, 'plain'))

        # Convert the email message object to a string
        text = msg.as_string()

        # Connect to the SMTP server and send the email
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, text)
        server.quit()
        print("Mail sent successfully.")

    except Exception as ex:
        print("send_email - error occurred:", ex)

def send_twilio_sms(to_mobile, message):
    """
    Send twilio sms function
    """
    try:
        # Twilio
        ACCOUNT_SID = "*****"
        AUTH_TOKEN = "******"
        FROM_MOBILE = "******"

        to_mobile = to_mobile
        client = Client(ACCOUNT_SID, AUTH_TOKEN)
        message = client.messages.create(to=to_mobile, from_=FROM_MOBILE, body=message)
        logging.info("Sent Successfully : %s", (str(to_mobile),))
    except Exception as error:
        logging.exception("send_twilio_sms : Exception - %s : %s ", error, str(to_mobile))

def open_table_booking(user_id, restaurant_name, time, people, first_name, last_name, email, phone):
    try:
        process = Process(target=opentable_web_scraping, args=(user_id, restaurant_name, time, people, first_name, last_name, email, phone))
        process.start()
    except Exception as ex:
        app.logger.error('open_table_booking : exception :  %s', ex)
    return 0

def meeting_data_list(input_prompt):
    output_dict = {}
    try:        
        prompt=(f"Please extract the meeting name, meeting time, and the name of the person who scheduled the meeting from the following input:\n"
                f"{input_prompt}"
                f"If the meeting name is not available, then give it as an empty string.\n"
                f"If the meeting time is not available, then give it as an empty string.\n"
                f"If the person's name is not available, then give it as an empty string.\n")
       
        completions = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=1024,
                n=1,
                stop=None,
                temperature=0.5
            )

        input_string = completions.choices[0].text.strip() 
        app.logger.info('meeting_data_list : %s', input_string)
        
        is_create = False
        if 'create' in input_prompt.lower(): is_create=True
        
        lines = input_string.split('\n')
        meeting_info = {}
        for line in lines:
            if line:
                key, value = line.split(':',1)
                meeting_info[key.strip()] = value.strip()
        keys = list(meeting_info.keys())
        output_dict={'meeting_name':meeting_info[keys[0]],'meeting_time':meeting_info[keys[1]],'person_name':meeting_info[keys[2]]}
        
        if output_dict['meeting_time']: 
            output_dict['meeting_time']=time_extrator_formatter(output_dict['meeting_time'])

        if is_create: 
            contact = contact_list(output_dict['person_name'])
            output_dict['email'] = contact['email']
        else:
            query = '''
                SELECT calendar_id, meeting_sub, TO_CHAR(meeting_start_dt,'HH:MI AM') AS dt, meeting_code, meeting_type, \
                meeting_status FROM user_calendar WHERE status=%s AND user_id=%s
                AND DATE(meeting_start_dt)=DATE(NOW())'''

            params=''
            if output_dict['meeting_name']:
                query = query+" AND similarity(lower(meeting_sub), %s) > %s "
                params = ('A',auth.current_user().user_id, output_dict['meeting_name'],0.5)
            elif output_dict['meeting_time']:
                query = query+" AND TO_CHAR(meeting_start_dt,'HH:MI AM')=%s "
                params = ('A',auth.current_user().user_id, output_dict['meeting_time'].upper())

            briefings = fetch_all(query, params)

            briefing_list = []
            if briefings:
                for briefing in briefings:
                    briefing_list.append({'id':briefing[0],'sub':briefing[1],'time':briefing[2],
                            'meeting_code':briefing[3],'meeting_type':briefing[4],'meeting_status':briefing[5],
                            'email': 'kathiravan.rajendran@skoruz.com', 'name': 'Kathiravan'})

            output_dict=briefing_list
    except Exception as e:
      app.logger.error('meeting_data_list : exception :  %s', e)
    return output_dict

def opentable_data_extraction(input_prompt):
    output_dict = {}
    try:        
        prompt=(f"Please extract restaurant name and number of people and time from the following input:\n"
                f"{input_prompt}")
        completions = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=1024,
                n=1,
                stop=None,
                temperature=0.5
            )

        input_string = completions.choices[0].text.strip() 
        app.logger.info('opentable_data_extraction : %s', input_string)

        parameters = input_string.splitlines()
        for para in parameters:
            para = ((para.lower()).replace(" ", "_")).replace(".", "")
            parameter_dict = {"parameter3": "restaurant_name", "parameter2" : "number_of_people", "parameter1": "time"}
            for i in range(1,4):
                match=(re.search(parameter_dict["parameter{0}".format(i)], para))
                if match:
                    start, end = match.span()
                    text = para[end+1:].strip()
                    if text:
                        output_dict[parameter_dict["parameter{0}".format(i)]] = (text.replace("_"," ")).strip()
                        break
              
    except Exception as e:
      app.logger.error('opentable_data_extraction : exception :  %s', e)
    return output_dict

def chatgpt_mail(input_prompt):
    try:
        # Email
        prompt=(f"As an email application, please assist the user in composing an email message.\n"
                f"This is a professional work email.\n"
                f"Please include a signature at the end of the email that reads '{ auth.current_user().user_name}'."
                f"{input_prompt}")
        completions = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=1024,
                n=1,
                stop=None,
                temperature=0.5
            )

        email_content = completions.choices[0].text.strip() 
        app.logger.info('chatgpt_mail : %s', email_content)

        if '[Your Name]' in email_content:
            email_content = email_content.replace('[Your Name]', auth.current_user().user_name)
        if '[Name]' in email_content:
            email_content = email_content.replace('[Name]', '')
        if '[Recipient]' in email_content:
            email_content = email_content.replace('[Recipient]', '')

        app.logger.info('chatgpt_mail - email_content : %s', email_content)

        # Subject
        prompt=(f"As an email app, please assist the user in composing the email subject and provide a single subject:\n"
                f"{input_prompt}")
        completions = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=1024,
                n=1,
                stop=None,
                temperature=0.5
            )

        input_string = completions.choices[0].text.strip() 
        subject = "Eesa Email"
        try:
            subject = input_string.split(":")[1].replace('"','').strip()
        except:
            pass

        contact = contact_list(input_prompt)
        return {
            'name' : contact['name'],
            'email' : contact['email'],
            'subject' : subject,
            'message' : email_content
        }
    except Exception as e:
        app.logger.error('chatgpt_mail : exception :  %s', e)
    return dict()

def chatgpt_graph_mail(input_prompt):
    try:
        # Email
        prompt=(f"As an email application, please assist the user in composing an email message.\n"
                f"This is a professional work email.\n"
                f"This is an email sharing a graph as a attchament."
                f"Please include a signature at the end of the email that reads '{ auth.current_user().user_name}'."
                f"{input_prompt}")
        completions = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=1024,
                n=1,
                stop=None,
                temperature=0.5
            )

        email_content = completions.choices[0].text.strip() 
        app.logger.info('chatgpt_graph_mail : %s', email_content)

        if '[Your Name]' in email_content:
            email_content = email_content.replace('[Your Name]', auth.current_user().user_name)
        if '[Your Name]' in email_content:
            email_content = email_content.replace('[Your Name]', auth.current_user().user_name)
        if '[Name]' in email_content:
            email_content = email_content.replace('[Name]', '')
        if '[Recipient]' in email_content:
            email_content = email_content.replace('[Recipient]', '')

        app.logger.info('chatgpt_mail - email_content : %s', email_content)

        # Subject
        prompt=(f"As an email app, please assist the user in composing the email subject and provide a single subject:\n"
                f"{input_prompt}")
        completions = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=1024,
                n=1,
                stop=None,
                temperature=0.5
            )

        input_string = completions.choices[0].text.strip() 
        subject = "Eesa Email"
        try:
            subject = input_string.split(":")[1].replace('"','').strip()
        except:
            pass

        contact = contact_list(input_prompt)
        return {
            'name' : contact['name'],
            'email' : contact['email'],
            'subject' : subject,
            'message' : email_content
        }
    except Exception as e:
        app.logger.error('chatgpt_graph_mail : exception :  %s', e)
    return dict()

def chatgpt_sms(input_prompt):
    try:
        prompt=(f"As a text messaging app, please assist the user in composing a concise message.\n"
                f"This is a text message."
                f"{input_prompt}")
        completions = openai.Completion.create(
                engine="text-davinci-003",
                prompt=prompt,
                max_tokens=1024,
                n=1,
                stop=None,
                temperature=0.5
            )

        sms_msg = completions.choices[0].text.strip() 
        app.logger.info('chatgpt_sms : %s', sms_msg)

        contact = contact_list(input_prompt)
        return {
            'name' : contact['name'],
            'mobile' : contact['mobile'],
            'message' : sms_msg
        } 
    except Exception as e:
        app.logger.error('chatgpt_sms : exception :  %s', e)
    return dict()

def contact_list(input_prompt):
    contacts = [
    {'name': 'kathiravan', 'email': 'markbrown.eesa@gmail.com', 'mobile': '+19093741841'},
    {'name': 'raja', 'email': 'markbrown.eesa@gmail.com', 'mobile': '+19093741841'},
    {'name': 'prakash', 'email': 'markbrown.eesa@gmail.com', 'mobile': '+19093741841'},
    {'name': 'barnala', 'email': 'markbrown.eesa@gmail.com', 'mobile': '+19093741841'},
    {'name': 'jeeva', 'email': 'markbrown.eesa@gmail.com', 'mobile': '+19093741841'},
    {'name': 'pritwik', 'email': 'markbrown.eesa@gmail.com', 'mobile': '+19093741841'},
    {'name': 'mark brown', 'email': 'markbrown.eesa@gmail.com', 'mobile': '+19093741841'},
    {'name': 'swetha ', 'email': 'markbrown.eesa@gmail.com', 'mobile': '+19093741841'}] 

    contact_output = {}
    for contact in contacts:
        if contact['name'] in input_prompt.lower() or fuzz.ratio(contact['name'], input_prompt.lower())>=50:
                contact_output = contact
                break
    if not contact_output:
        contact_output = contacts[6]
    return contact_output

def time_extrator_formatter(input_string):
    try:
        result, first_half, second_half = "", "", ""
        input_string = input_string.lower()
        time_string = re.sub('[^A-Za-z0-9]+', '', input_string).strip()
        alpha,string=0,time_string
        for i in string:
            if (i.isalpha()):
                alpha+=1  
        if alpha == 0:
            if len(time_string) == 2 or len(time_string) == 1:
                final = time_string + ":00"
            elif len(time_string) == 3:
                final = time_string[0] + ":" + time_string[1:]
            elif len(time_string) == 4:
                final = time_string[0:2] + ":" + time_string[2:]
            a,status = railway_format(final)
            final = a
        else: 
            if len(time_string) - alpha == 3:
                first_half = time_string[0]+":"+time_string[1:3]
                second_half = " AM" if time_string[-2] == "a" else " PM"
            elif len(time_string) - alpha == 2 or len(time_string) - alpha == 1:
                first_half = time_string[:-2]+":00"
                second_half = " AM" if time_string[-2] == "a" else " PM"
            elif len(time_string) - alpha == 4:
                first_half = time_string[0:2]+":"+time_string[2:4]
                second_half = " AM" if time_string[-2] == "a" else " PM"
                final = first_half + second_half   
            final = first_half + second_half
            a,status = convert_12_to_24(final)
        if status:
            result = final
    except Exception as e :
        print('time_extrator_formatter : exception :  %s', e)    
    return result

def convert_12_to_24(time_string):
    status = False
    h, m = map(int, time_string[:-3].split(':'))
    suffix = time_string[-2:]
    offset = 0 if suffix == 'AM' else 12
    h = (h % 12) + offset
    if 5<= int(float(h)) <=23:
        status= True
        if int(h) == 23 and int(m) > 30:
            status = False
    return '{:02d}:{:02d}'.format(h, m), status

def railway_format(time_string):
    status = False
    h, m = map(int, time_string.split(':'))
    suffix = 'PM' if 12<h else 'AM'
    if 5<= int(float(h)) <=23:
        status= True
        if int(h) == 23 and int(m) > 30:
            status = False
        h = h if suffix == 'AM' else h-12    
    return '{:02d}:{:02d} {}'.format(h, m,suffix), status

def query_extraction(query):
    select_regex = r"(?i)\bSELECT\b.+?;"
    matches = re.findall(select_regex, query, re.DOTALL)
    if matches:
        select_statement = matches[0]
        return select_statement
    else:
        return ''
    
if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5025)
