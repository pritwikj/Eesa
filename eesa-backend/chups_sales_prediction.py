import time, os

import psycopg2
import pandas as pd
import numpy as np
import shutil

import schedule

from sklearn.model_selection import train_test_split
from hyperts import make_experiment
from hyperts.utils.models import save_model
from hyperts.utils.models import load_model

def get_db_connection():
    try:
        conn = psycopg2.connect(
            database="******",
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

def ts_training(data):
    train_data, test_data = train_test_split(data, test_size=0.2, shuffle=False)
    model = make_experiment(train_data.copy(),
                        task='univariate-forecast',     
                        mode='stats',
                        timestamp='ds'
                    ).run()
    
    if os.path.exists('/home/bmani/GPT/sales_pred/ts_model'):
        shutil.rmtree('/home/bmani/GPT/sales_pred/ts_model')
    
    save_model(model=model, model_file="/home/bmani/GPT/sales_pred/ts_model")
    
    X_test, y_test = model.split_X_y(test_data.copy())
    y_pred = model.predict(X_test)
    scores = model.evaluate(y_test, y_pred)
    print("Model Score : "+str(scores))
    return model 

def load_pretrained_model():
    model_path = '/home/bmani/GPT/sales_pred/ts_model/stats_models'
    pretrained_model = load_model(model_file=model_path)
    return pretrained_model

def ts_prediction(model,start,steps):
    future_df = model.make_future_dataframe(periods=steps,start_date=start)
    forecasted_df = model.predict(future_df)
    return forecasted_df

def prediction_process():
    try:
        query="SELECT to_char(order_date, 'YYYY-MM-DD') AS ds, total_sales AS y FROM chups_sales WHERE order_date >= now() - interval '6 months' ORDER BY order_date;"
        orders=fetch_all(query)        
        df = pd.DataFrame(orders, columns=['ds', 'y'])

        # Data preprocessoing.
        df.dropna(inplace=True)
        df['y'] = df['y'].astype(np.float64)
        df.ds = pd.to_datetime(df.ds).dt.date
        df = df.groupby('ds')['y'].sum().reset_index()
        df.sort_values(by=['ds'], ascending=True)    
        
        # Calculate the first and third quartiles
        q1 = df['y'].quantile(0.25)
        q3 = df['y'].quantile(0.75)

        # Calculate the IQR
        iqr = q3 - q1

        # Set the lower and upper bounds for outliers
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        # Remove outliers from the DataFrame
        data_no_outliers = df[(df['y'] >= lower_bound) & (df['y'] <= upper_bound)]
        df = data_no_outliers

        # Training
        ts_training(df)
  
        # Load model
        pretrained_model = load_pretrained_model()

        # Prediction
        start = orders[-1][0]
        steps = 10 # Default 10 days
        forecasted_df = ts_prediction(pretrained_model,start,steps)   
        print(forecasted_df)

        # Delete old prediction
        execute_query("DELETE FROM sales_prediction;")

        # Insert new prediction
        old_data = [(row[0],row[1],'N') for row in df.values]
        executemany("INSERT INTO sales_prediction VALUES(%s,%s,%s)", old_data)
        
        new_data = [(row[0],row[1],'Y') for row in forecasted_df.values]
        executemany("INSERT INTO sales_prediction VALUES(%s,%s,%s)", new_data)

        print("Prediction completed")
    except Exception as ex:
        print("prediction_process :  exception :",ex)

schedule.every().day.at("00:00").do(prediction_process)

if __name__ == '__main__':
    while True:
       schedule.run_pending()
       time.sleep(1)