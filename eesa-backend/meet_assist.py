import os
import time
import subprocess
import warnings
import requests
import logging
import re

import pandas as pd
import openai
import psycopg2

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
from selenium.common.exceptions import StaleElementReferenceException
from pygame import mixer 

#https://medium.com/analytics-vidhya/google-meet-self-attendance-bot-sarvesh-wadi-a62978bb06f6
#https://github.com/Wadi-Sarvesh/Google-meet-self-attendance-bot/blob/main/openlink_meet.py

openai.api_key = "API KEY"

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

def google_meet_web_scraping(user_email, user_password, meeting_code, calendar_id):
    driver = None
    try:
        url = "https://accounts.google.com/signin/v2/identifier?ltmpl=meet&continue=https%3A%2F%2Fmeet.google.com%3Fhs%3D193&&flowName=GlifWebSignIn&flowEntry=ServiceLogin"
        
        warnings.filterwarnings('ignore')
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.165 Safari/537.36"
        options = Options()
        #options.headless = True
        options.add_argument(f'user-agent={user_agent}')
        options.add_argument('--no-sandbox')
        options.add_argument("--window-size=1920,1200")
        options.add_argument("--use-fake-ui-for-media-stream")
        options.add_argument("--disable-notifications")
        options.add_experimental_option('excludeSwitches', ['enable-logging'])

        driver = webdriver.Chrome(options=options, executable_path='/home/devuser02/chatgpt_easa/chromedriver')
        ignored_exceptions=(NoSuchElementException,StaleElementReferenceException)
        driver.get(url)
        driver.maximize_window()

        user_id = driver.find_element("xpath", "//input[@type='email']")
        user_id.send_keys(user_email)
        user_id.send_keys(Keys.ENTER)
        time.sleep(10)

        password = driver.find_element("xpath", "//input[@type='password']")
        password.send_keys(user_password)
        password.send_keys(Keys.ENTER)
        time.sleep(10)

        enter_code = driver.find_element("xpath", "//input[@type='text']")
        enter_code.send_keys(meeting_code)
        time.sleep(5)
        
        join = driver.find_element("xpath", "//span[contains(text(), 'Join')]")
        join.click()
        time.sleep(10)

        join_now = WebDriverWait(driver,35,ignored_exceptions=ignored_exceptions).until(EC.element_to_be_clickable((By.XPATH, "//span[contains(text(), 'Join now')]"))) 
        driver.find_element("xpath", "//div[@aria-label='Turn off microphone (ctrl + d)']").click()
        driver.find_element("xpath", "//div[@aria-label='Turn off camera (ctrl + e)']").click()
        join_now.click()

        time.sleep(10)
        driver.find_element("xpath", "//button[@aria-label='Turn on captions (c)']").click()
        time.sleep(10)

        guests=driver.find_element("xpath", "//div[@class='uGOf1d']")
        text = guests.text
        Total_numGuests = int(text)

        staleElement = True
        previous_text = ""
        summary_list = []
        loopplysound = True
        while staleElement :
            try :
                changed_numSuests = int(guests.text)
                if changed_numSuests > Total_numGuests :
                    Total_numGuests = changed_numSuests
                elif changed_numSuests < Total_numGuests :
                    if changed_numSuests <= 1:  
                        end_call = driver.find_element("xpath", "//i[contains(text(), 'call_end')]")
                        end_call.click()
                        break
                
                captions_element = driver.find_element("xpath", "//div[@class='iOzk7']")
                if captions_element.is_displayed() :
                    time.sleep(3)
                    captions_elements= driver.find_elements("xpath", "//div[@class='TBMuR bj4p3b']")
                    if len(captions_elements)==0: continue
                    captions_text = captions_elements[-1].text
                    summary_list.append(captions_text)

                    if previous_text != captions_text and loopplysound:
                        previous_text = captions_text                        
                        greeting_words=("hi eesa", "hi isha", "hi isa", "hi easter", "hi is a?", "hi esa", "hi issa", "hi asia",
                                        "hi, eesa", "hi, isha", "hi, isa", "hi, easter", "hi, is a?", "hi, esa", "hi, issa", "hi, asia",
                                        "hello eesa", "hello isha", "hello isa", "hello easter", "hello is a?", "hello esa", "hello issa", "hello asia",
                                        "hello, eesa", "hello, isha", "hello, isa", "hello, easter", "hello, is a?", "hello, esa", "hello, issa", "hello, asia")
                        words = ("eesa", "isha", "isa", "easter", "is a?", "esa", "issa", "asia")
                        audience_name= captions_text.split('\n')[0]
                        
                        if any(name in captions_text.lower() for name in greeting_words):
                            loopplysound = False 
                            text_mp3_conv_and_play(f"Hi {audience_name}", driver)
                            loopplysound = True
                        elif any(name in captions_text.lower() for name in words):
                            loopplysound = False                            
                            question=""
                            for name in words:
                                if name in captions_text.lower():
                                    question = (captions_text.lower().split(name)[1]).strip()
                            
                            if question != ',' and question != '.' and question != ' ' and question != '':
                                logging.info("Question: "+question)    
                                text_mp3_conv_and_play(f"{audience_name},Thank you for your patience, let me look into that for you.", driver)
                                chatgpt_postgres_query_search(question, driver)
                                loopplysound = True
                            else:
                                loopplysound = True
            except(StaleElementReferenceException):
                staleElement = True
            except(NoSuchElementException) :
                staleElement = True

        sumary_text = "Meeting summary not available!"        
        if summary_list:
            summary_set = set(summary_list)
            summary_unique_list = (list(summary_set))
            sumary_text = '\n'.join(summary_unique_list)
            sumary_text = chatgpt_summarize(sumary_text)

        execute_query("UPDATE user_calendar SET meeting_summary=%s, meeting_status=%s WHERE calendar_id=%s", 
                    (sumary_text, "C", calendar_id))
        driver.close()
    
    except Exception as e:
        logging.error("google_meet_web_scraping - exception -", e)
        execute_query("UPDATE user_calendar SET meeting_summary=%s, meeting_status=%s WHERE calendar_id=%s", 
                    ("Meeting summary not available!", "C", calendar_id))
        if driver:
            driver.close()
        
def chatgpt_search(question, driver):
    try:
        if question.strip() != ',' and question.strip() != '.' and question.strip() != ' ' and question.strip() != '':
            
            file_name = "Sales_Report_2023.csv"
            # Preprocessing
            df=pd.read_csv(file_name)
            df = df.rename(columns=lambda x: x.strip())
            df = df.rename(columns=lambda x: x.replace(' ', '_'))
            df.to_csv(file_name, index=False)
            
            # Read csv data
            df=pd.read_csv(file_name)
            columns = ','.join(df.columns.tolist())
            
            prompt=(f'''{question} By pandas dataframe.
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
            8. The final output should be printed as a string using 'to_string()
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
            logging.info("Chatgpt Response:\n"+chatgpt_response)

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
            with open('meeting_python_code.py', 'w') as file:
                for code in python_codes:
                    file.write("%s\n" % code.strip())

            # Execute the command and capture the output
            response = subprocess.check_output("python meeting_python_code.py", shell=True, stderr=subprocess.STDOUT, text=True)

            # Remove python file
            os.remove('meeting_python_code.py')
            
            if response:
                logging.info("response: "+str(response))
                text_mp3_conv_and_play(response, driver)
    except Exception as e:
        logging.error("chatgpt_search - exception -", e)
        text_mp3_conv_and_play("Apologies, please try again", driver)

def chatgpt_postgres_query_search(qns, driver):
    try:
        table_name='chups_sales'
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
        logging.info("chatgpt_postgres_query_search:\n"+chatgpt_response)

        output = ""
        conn = get_db_connection()
        cur = conn.cursor()

        select_query = query_extraction(chatgpt_response)
        if not select_query: text_mp3_conv_and_play(chatgpt_response, driver)

        cur.execute(select_query)
        rows = cur.fetchall()
        if rows:
            columns = [desc[0] for desc in cur.description]
            if len(rows)>1:
                results = []
                for row in rows:
                    row_dict = dict(zip(columns, row))
                    results.append(row_dict)
                output = str(results)
            else:
                output=str(dict(zip(columns, rows[0])))

            if output:
                prompt=(f'''my question was {qns} and answer is {output}.
                        Convert into natural language''')

                completions = openai.Completion.create(
                    engine="text-davinci-003",
                    prompt=prompt,
                    max_tokens=1024,
                    n=1,
                    stop=None,
                    temperature=0
                )

                chatgpt_response = completions.choices[0].text.strip() 
                logging.info("chatgpt_postgres_query_search:\n"+chatgpt_response)
                text_mp3_conv_and_play(chatgpt_response, driver)
        else:
            text_mp3_conv_and_play("No data found for your query as of now, please try with different question!", driver)

        close_db_connection(conn, cur)
    except Exception as ex:
        logging.error("chatgpt_postgres_query_search - exception -", ex)
        text_mp3_conv_and_play("Apologies, please try again", driver)

def split_text(text):
    max_tokens = 1024
    chunks = []
    current_chunk = ""
    for sentence in re.split(r'\n', text):
        if len(current_chunk) + len(sentence) + 1 <= max_tokens:
            current_chunk += sentence + "\n\n"
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence + "\n\n"
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def chatgpt_summarize(text):
    try:
        chunks = split_text(text)
        
        # Summarize each chunk
        summaries = []
        for chunk in chunks:
            response = openai.Completion.create(
                engine="text-davinci-002",
                prompt=("Please summarize the following text:\n" + chunk),
                temperature=0.5,
                max_tokens=1024,
                n = 1,
                stop=None
            )
            summary = response.choices[0].text.strip()
            summaries.append(summary)
        
        # Combine all summaries into final summary
        final_summary = "\n".join(summaries)
        
        return (chatgpt_summarize(final_summary) if len(summaries)>25 else final_summary)
    except Exception as e:
        logging.exception("chatgpt_summarize - exception -", e)
    return ""

def text_mp3_conv_and_play(text, driver):
    try:
        if(os.path.exists('prompt_response.mp3')):
            os.remove("prompt_response.mp3")

        ELEVENLABS_API_KEY = "62687151b1148c80ecf43e4d62fe4889"
        headers = {
            'accept': 'audio/mpeg',
            'xi-api-key': ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
        }
        json_data = {'text': str(text)}
        response_mp3 = requests.post('https://api.elevenlabs.io/v1/text-to-speech/U492qROBZhwf9PaK55jM', headers=headers, json=json_data)
        with open('prompt_response.mp3', 'wb') as f:
            f.write(response_mp3.content)

        driver.find_element("xpath", "//button[@data-is-muted='true']").click()
        mixer.init(devicename='CABLE Input (VB-Audio Virtual Cable)')
        mixer.music.load("prompt_response.mp3")
        mixer.music.play()
        while mixer.music.get_busy(): 
            pass
        mixer.music.unload()
        
        driver.find_element("xpath", "//button[@data-is-muted='false']").click()
        os.remove("prompt_response.mp3")
    except Exception as e:
       logging.exception("text_mp3_conv_and_play - exception -", e)
       text_mp3_conv_and_play("Apologies, please try again", driver)

def query_extraction(query):
    select_regex = r"(?i)\bSELECT\b.+?;"
    matches = re.findall(select_regex, query, re.DOTALL)
    if matches:
        select_statement = matches[0]
        return select_statement
    else:
        return ''
