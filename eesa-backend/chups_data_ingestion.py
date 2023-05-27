import logging
import time

import psycopg2
import mysql.connector

logging.basicConfig(filename="ingestion.log", level=logging.DEBUG, format="%(asctime)s  %(name)s  %(levelname)s: %(message)s")

'''
CREATE TABLE chups_sales (
    cloud_kitchen VARCHAR(255), 
    platform VARCHAR(255), 
    brand VARCHAR(255), 
    order_id INT, 
    customer_name VARCHAR(255), 
    item_name VARCHAR(255), 
    quantity INT, 
    item_rate NUMERIC(10,2), 
    total_item_rate NUMERIC(10,2), 
    item_tax NUMERIC(10,2), 
    item_tips NUMERIC(10,2), 
    item_discount NUMERIC(10,2), 
    total_sales NUMERIC(10,2), 
    payment_source VARCHAR(255), 
    service_location VARCHAR(255), 
    order_date DATE,
    order_time TIME,
    day_name VARCHAR(255), 
    month_name VARCHAR(255), 
    week INT
    );
'''

chups_db_query = '''
    SELECT S.* FROM
        ((SELECT
            CK.cloud_kit_name AS cloud_kitchen,
            IFNULL(O.delivery_partner_type, (CASE WHEN (O.Entity_Type = 'CUSTOMER' AND (O.Mode_Of_Order = 'W' OR O.Mode_Of_Order = 'M' )) THEN 'Chups' WHEN (O.Entity_Type = 'CUSTOMER' AND O.Mode_Of_Order = 'K') THEN 'KIOSK' WHEN (O.Entity_Type = 'POS' AND (O.Mode_Of_Order = 'W' OR O.Mode_Of_Order = 'M' )) THEN 'Waiter POS' WHEN (O.Entity_Type = 'POS' AND O.Mode_Of_Order = 'P') THEN 'Phone Order POS' ELSE 'Chups' END)) AS platform,
            KM.Menu_Name AS brand,
            O.Order_Id AS order_id,
            O.contact_person AS customer_name,
            KI.Item_Name AS item_name,
            ROUND(OI.qty, 0) AS quantity,
            ROUND(OI.Cust_Rate+OI.Cumulative_Attr_Rate, 2) AS item_rate,
            ROUND((OI.qty *(OI.Cust_Rate + OI.Cumulative_Attr_Rate)), 2) AS total_item_rate,
            IF(OI.tax_amount IS NOT NULL AND OI.tax_amount>0,
            OI.tax_amount,
            IFNULL(ROUND(((OI.qty *(OI.Cust_Rate + OI.Cumulative_Attr_Rate))* (O.Total_Tax_Amount / O.Cust_Order_Amount)), 2), 0)) AS item_tax,
            IF(OI.tip_amount IS NOT NULL AND OI.tip_amount>0,
            OI.tip_amount,
            IFNULL(ROUND((OI.qty *(OI.Cust_Rate + OI.Cumulative_Attr_Rate)) *((O.Tips / O.Cust_Order_Amount)), 2), 0)) AS item_tips,
            ROUND(IFNULL((IF(OI.discount_amount IS NOT NULL AND OI.discount_amount>0, OI.discount_amount, 0)+ ((OI.qty *(OI.Cust_Rate + OI.Cumulative_Attr_Rate))*((O.Redeem_Amount / O.Cust_Order_Amount)))+ ((OI.qty *(OI.Cust_Rate + OI.Cumulative_Attr_Rate))*((O.Points_Amount / O.Cust_Order_Amount)))), 0), 2) AS item_discount,
            IFNULL(ROUND((((OI.qty *(OI.Cust_Rate + OI.Cumulative_Attr_Rate))+ IF(OI.tax_amount IS NOT NULL AND OI.tax_amount>0, OI.tax_amount,((OI.qty *(OI.Cust_Rate + OI.Cumulative_Attr_Rate))*(O.Total_Tax_Amount / O.Cust_Order_Amount))))-IFNULL((IF(OI.discount_amount IS NOT NULL AND OI.discount_amount>0, OI.discount_amount, 0)+ ((OI.qty *(OI.Cust_Rate + OI.Cumulative_Attr_Rate))*((O.Redeem_Amount / O.Cust_Order_Amount)))+ ((OI.qty *(OI.Cust_Rate + OI.Cumulative_Attr_Rate))*((O.Points_Amount / O.Cust_Order_Amount)))), 0)), 2), 0) AS total_sales,
            IFNULL(O.delivery_partner_type, (
            SELECT
                GROUP_CONCAT(DISTINCT CASE OO.ModeOfPay WHEN 'CAS' THEN 'Cash' WHEN 'CUP' THEN 'Gift' WHEN 'CHQ' THEN 'Cheque' WHEN 'SWP' THEN 'Swipe' WHEN 'APP' THEN 'Authorize Apple Pay' WHEN 'CRD' THEN 'Authorize Credit/Debit Card' WHEN 'TTP' THEN 'Authorize Credit/Debit Card' WHEN 'PRA' THEN 'Authorize Only' WHEN 'WCA' THEN ' ' WHEN 'PRO' THEN ' ' WHEN 'SSW' THEN 'Square' WHEN 'CCA' THEN 'CCAvenue' WHEN 'PPL' THEN 'Paypal' WHEN 'UPI' THEN 'Mosambee Upi' WHEN 'WAL' THEN 'Mosambee Wallet' WHEN 'MSW' THEN 'Mosambee Swipe' WHEN 'SCP' THEN 'Square Credit/Debit Card' WHEN 'SAP' THEN 'Square Apple Pay' ELSE '' END ORDER BY OO.Rec_No SEPARATOR ', ')
            FROM
                ord_receipts OO
            WHERE
                OO.Order_ID = O.Order_Id
                AND OO.ModeOfPay != 'WCA'
                AND OO.ModeOfPay != 'PRO'
                AND OO.ModeOfPay != 'PNT'))AS payment_source,
            CKL.city AS service_location,
            DATE_FORMAT(O.Order_Date, '%Y-%m-%d') AS order_date,
            DATE_FORMAT(O.Order_Date, '%H:%i:%S') AS order_time,
            DAYNAME(O.Order_Date) AS day_name,
            MONTHNAME(O.Order_Date) AS month_name,
            WEEK(O.Order_Date) AS week
        FROM
            ord_orders O
        LEFT JOIN ord_receipts OO ON
            (O.Order_Id = OO.Order_ID
                AND OO.ModeOfPay != 'WCA'
                AND OO.ModeOfPay != 'PRO'
                AND OO.ModeOfPay != 'PNT' ),
            tb_kit_cloud_kitchens CK,
            tb_kit_cloud_kitchen_entity_map CKEM,
            vnd_vendors V,
            kit_items KI,
            kit_categories KC,
            kit_menu KM,
            ord_order_items OI,
            ord_order_cloud_kitchen_timings OCKT,
            tb_kit_cloud_kitchen_locations CKL
        WHERE
            O.order_status != 'E'
            AND O.order_status != 'C'
            AND O.cloud_kitchen_id = CKEM.cloud_kit_id
            AND CKEM.cloud_kit_id = CK.cloud_kit_id
            AND O.Order_Id = OI.Order_ID
            AND OI.Item_Code = KI.Item_Code
            AND CKEM.status = 'A'
            AND CKEM.entity_id = V.Vendor_ID
            AND CKEM.entity_type = 'VENDOR'
            AND V.Status = 'A'
            AND V.Rst_ID = KI.Rst_ID
            AND KI.Cgy_Id = KC.Cgy_ID
            AND V.Rst_ID = KC.Rst_Id
            AND KC.Menu_Group_Id = KM.Menu_Group_Id
            AND KM.Entity_Name = 'CUSTOMER '
            AND V.Rst_ID = KM.Rst_ID
            AND IF(OI.menu_id>0,
            OI.menu_id = KM.Menu_id,
            1 = 1)
            AND (O.Entity_Type = 'CUSTOMER'
                OR O.Entity_Type = 'POS')
            AND O.Order_Id = OCKT.order_id
            AND OCKT.kit_location_id = CKL.kit_location_id
            AND O.Order_Id>%s
            AND DATE(Del_Date)>='2021-01-01'
            AND O.cloud_kitchen_id >0
        ORDER BY
            O.Order_Id)
        UNION 
        (SELECT
            CK.cloud_kit_name AS cloud_kitchen,
            IFNULL(O.delivery_partner_type, (CASE WHEN (O.Entity_Type = 'CUSTOMER' AND (O.Mode_Of_Order = 'W' OR O.Mode_Of_Order = 'M' )) THEN 'Chups' WHEN (O.Entity_Type = 'CUSTOMER' AND O.Mode_Of_Order = 'K') THEN 'KIOSK' WHEN (O.Entity_Type = 'POS' AND (O.Mode_Of_Order = 'W' OR O.Mode_Of_Order = 'M' )) THEN 'Waiter POS' WHEN (O.Entity_Type = 'POS' AND O.Mode_Of_Order = 'P') THEN 'Phone Order POS' ELSE 'Chups' END)) AS platform,
            '' AS brand,
            O.Order_Id AS order_id,
            O.contact_person AS customer_name,
            UI.item_name AS item_ame,
            ROUND(UI.item_qty, 0) AS quantity,
            ROUND(UI.rate, 2) AS item_rate,
            ROUND((UI.item_qty * UI.rate), 2) AS total_item_rate,
            IFNULL(ROUND(((UI.item_qty * UI.rate)* (O.Total_Tax_Amount / O.Cust_Order_Amount)), 2), 0) AS item_tax,
            IFNULL(ROUND((UI.item_qty * UI.rate)*((O.Tips / O.Cust_Order_Amount)), 2), 0) AS item_tips,
            0 AS item_discount,
            IFNULL(ROUND(((UI.item_qty * UI.rate)+((UI.item_qty * UI.rate)* (O.Total_Tax_Amount / O.Cust_Order_Amount))+(UI.item_qty * UI.rate)), 2), 0) AS total_sales,
            O.delivery_partner_type  AS payment_source,
            CKL.city AS service_location,
            DATE_FORMAT(O.Order_Date, '%Y-%m-%d') AS order_date,
            DATE_FORMAT(O.Order_Date, '%H:%i:%S') AS order_time,
            DAYNAME(O.Order_Date) AS day_name,
            MONTHNAME(O.Order_Date) AS month_name,
            WEEK(O.Order_Date) AS week
        FROM
            ord_orders O,
            ord_delivery_partner_unassigned_items UI,
            tb_kit_cloud_kitchens CK,
            ord_order_cloud_kitchen_timings OCKT,
            tb_kit_cloud_kitchen_locations CKL
        WHERE
            order_status != 'E'
            AND order_status != 'C'
            AND O.cloud_kitchen_id = CK.cloud_kit_id
            AND O.Order_Id = UI.Order_ID
            AND (O.Entity_Type = 'CUSTOMER'
                OR O.Entity_Type = 'POS')
            AND O.Order_Id = OCKT.order_id
            AND OCKT.kit_location_id = CKL.kit_location_id
            AND O.Order_Id>%s
            AND DATE(Del_Date)>='2021-01-01'
            AND O.cloud_kitchen_id >0
        ORDER BY
            O.Order_Id
    )) S ORDER BY S.order_id;
    '''

def chups_db_fetch_all(query, params=None):
    conn = None
    cur = None
    try:
        conn =  mysql.connector.connect(
            dbname="*****",
            user="*****",
            password="******",
            host="*******",
            port="3306"
        )
        cur = conn.cursor()
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)
        return cur.fetchall()
    except psycopg2.Error as e:
        logging.error("chups_db_fetch_all: Error connecting to database:", e)
        return None
    finally:
        close_db_connection(conn, cur)

def get_db_connection():
    try:
        conn = psycopg2.connect(
            dbname="******",
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
        logging.error("Error fetching data:", e)
        return None
    finally:
        close_db_connection(conn, cur)

def process():
    try:
        # Get last row order id
        last_inserted_order_id=0
        query = "SELECT MAX(order_id) FROM chups_sales;"
        order = fetch_one(query)
        if order:
            last_inserted_order_id = (order[0] if order[0] else 0)
        logging.info(f"Max order id {str(last_inserted_order_id)}")

        orders = chups_db_fetch_all(chups_db_query, (last_inserted_order_id, last_inserted_order_id))
        batches = [orders[i:i+100] for i in range(0, len(orders), 100)]
        for batche in batches:
            executemany(f"INSERT INTO chups_sales VALUES({', '.join(['%s']*20)})", batche) 
        logging.info(f"New record inserted :{str(len(orders))}")
    except Exception as ex:
        logging.exception("process : exception", ex)

if __name__ == "__main__":
    while True:
        process()
        time.sleep(3600)
