import warnings
import time
import logging

from selenium.webdriver.chrome.options import Options
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.select import Select

import psycopg2

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
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)
        conn.commit()
        return True
    except psycopg2.Error as e:
        print("Error executing query:", e)
        return False
    finally:
        close_db_connection(conn, cur)

def opentable_web_scraping(user_id, restaurant_name, reserve_time, people, first_name, last_name, email, mobile):
    try:
        warnings.filterwarnings('ignore')
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.165 Safari/537.36"
        options = Options()
        options.headless = True
        options.add_argument(f'user-agent={user_agent}')
        options.add_argument('--no-sandbox')
        options.add_argument("--window-size=1920,1200")
        options.add_experimental_option('excludeSwitches', ['enable-logging'])

        driver = webdriver.Chrome(options=options, executable_path='/home/devuser02/chatgpt_easa/chromedriver')
        driver.get('https://www.opentable.com/all-metros')    
        driver.maximize_window()
        print(driver.title)
        time.sleep(5)
        
        wait = WebDriverWait(driver, 20)

        #location
        driver.find_element("xpath", "//div[contains(text(), 'United States')]").click()
        driver.execute_script("window.scrollTo(1500,1800);")
        time.sleep(5)
        city1 = wait.until(EC.presence_of_element_located(("xpath", "/html/body/div[1]/div/div/main/section/div/div/section/ul/li[2]/ul[2]/li[21]/section/article/ul/li[45]/a")))
        city2 = wait.until(EC.presence_of_element_located(("xpath", "/html/body/div[1]/div/div/main/section/div/div/section/ul/li[2]/ul[2]/li[21]/section/article/ul/li[44]/a")))
        time.sleep(5)
        if city1.text == 'Los Angeles':
            wait.until(EC.presence_of_element_located(("xpath", "/html/body/div[1]/div/div/main/section/div/div/section/ul/li[2]/ul[2]/li[21]/section/article/ul/li[45]/a"))).click()
        if city2.text == 'Los Angeles':
            wait.until(EC.presence_of_element_located(("xpath", "/html/body/div[1]/div/div/main/section/div/div/section/ul/li[2]/ul[2]/li[21]/section/article/ul/li[44]/a"))).click()
        time.sleep(8)
        
        print(driver.title)
        #Date
        '''driver.find_element("xpath", "//div[@aria-label='Date selector']").click()
        time.sleep(1) 
        date = wait.until(EC.presence_of_all_elements_located(("xpath", "//td/button[contains(text(), '28')]")))
        if len(date) == 1:
            date.click()
            time.sleep(1)
        else:
            date[1].click()
            time.sleep(1) '''
        #Time
        driver.find_element("xpath", "//select[@aria-label='Time selector']").click() 
        time.sleep(1)
        driver.find_element("xpath", "//option[contains(text(), '{}')]".format(reserve_time)).click()
        time.sleep(1)
        
        # No of people
        driver.find_element("xpath", "//select[@aria-label='Party size selector']").click() 
        time.sleep(1)
        driver.find_element("xpath", "//option[contains(text(), '{} people')]".format(people)).click()
        time.sleep(1)
        
        #Search Restaurant
        input = driver.find_element("xpath", "//input[@aria-label='Please input a Location, Restaurant or Cuisine']")
        input.send_keys(restaurant_name) 
        input.send_keys(Keys.ENTER)
        time.sleep(5)
        #Open restaurant
        driver.find_element("xpath", "//h6[@class='tfljo0SQq0JS3FOxpvxL']").click()
        print(driver.title)
        
        driver.switch_to.window(driver.window_handles[1])
        time.sleep(5)
        
        driver.execute_script("window.scrollTo(100,300);")
        time.sleep(2)
        time_slots = ""
        try:
            driver.find_element("xpath", "//span[@data-test='icNegative']") 
            time_slots = 'Not Available'
        except:
            time_slots = 'Available'
            
        if time_slots == 'Available':
            print('Time slots available') 
            available_time_slots = wait.until(EC.presence_of_all_elements_located(("xpath", "//li[@class='rcyV5cZx6cPOnmm9n16p']")))
            time_slot_list=[]
            for time_slot in available_time_slots:
                time_slot = time_slot.text
                if time_slot:
                    time_slot = time_slot.split("*")
                    time_slot_list.append(time_slot[0])
            button = driver.find_element("xpath", "//a[contains(text(), '{}')]".format(time_slot_list[0])) 
            driver.execute_script("arguments[0].click();", button)
            time.sleep(5)
           
            #Details
            first = driver.find_element("xpath", "//input[@id='firstName']")
            first.send_keys(first_name)
            time.sleep(2)
            last = driver.find_element("xpath", "//input[@id='lastName']")
            last.send_keys(last_name)
            time.sleep(2)
            
            sel = Select(driver.find_element("xpath", "//select[@id='phoneNumberCountryCode']"))
            sel.select_by_value("US")
            time.sleep(3)

            phone = driver.find_element("xpath", "//input[@id='phoneNumber']")
            phone.send_keys(mobile)
            time.sleep(2)
            
            email_id = driver.find_element("xpath", "//input[@id='email']")
            email_id.send_keys(email) 
            time.sleep(2)
            driver.execute_script("window.scrollTo(300,500);")
            time.sleep(2)
            element = driver.find_element("xpath", "//button[@id='complete-reservation']")
            driver.execute_script("arguments[0].click();", element)
            time.sleep(5)
            
            print("Booking completed..")
            try:
                driver.find_element("xpath", "//span[@data-test='icClose']").click()
            except:
                pass
            time.sleep(5)
                
            print(driver.title)
            restaurant = driver.find_element("xpath", "//h2[@data-test='restaurant-name']")
            print('restaurant_name :', restaurant.text)
            reservation_status = driver.find_element("xpath", "//div[@data-test='reservation-state']")
            print('reservation_status :', reservation_status.text)
            persons = driver.find_element("xpath", "//section[@data-test='reservation-party-size']")
            print('people :', persons.text)
            reservation_date_time = driver.find_element("xpath", "//section[@data-test='reservation-date-time']")
            print('reservation_date_time :', reservation_date_time.text)
            
            #cancel Reservation
            driver.find_element("xpath", "//a[@data-test='cancel-reservation']").click()
            time.sleep(5)
            driver.find_element("xpath", "//button[@data-test='continue-cancel-button']").click()
            print("Reservation cancelled")

            query = "INSERT INTO user_notification (user_id, notification, notification_desc, cr_dt) values(%s, %s, %s, now())"
            desc = f"Opentable booking completed, Restaurant - {restaurant.text}, no of people - {persons.text}, time - {reservation_date_time.text}"
            params = (user_id, "Opentable booking completed", desc)
            execute_query(query, params)
            
        elif time_slots == 'Not Available':
            print('Time slots not available') 
            query = "INSERT INTO user_notification (user_id, notification, notification_desc, cr_dt) values(%s, %s, %s, now())"
            params = (user_id, "Opentable booking - Time slots not available", "Opentable booking - Time slots not available")
            execute_query(query, params)       
            
        driver.close()
    except Exception as e:
        logging.error("opentable_web_scraping : error :", e)
        query = "INSERT INTO user_notification (user_id, notification, notification_desc, cr_dt) values(%s, %s, %s, now())"
        params = (user_id, "OpenTable booking error occurred due to a timeout.", "OpenTable booking error occurred due to a timeout.")
        execute_query(query, params) 
