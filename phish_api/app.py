import numpy as np
from flask import Flask, request, jsonify, render_template, url_for, redirect, flash, session
import pickle
from urllib.parse import urlparse,urlencode
import ipaddress
import re
from bs4 import BeautifulSoup
import urllib
import urllib.request
from datetime import datetime
import requests
import numpy as np
import whois
import tldextract
import string
from datetime import datetime
from dateutil.relativedelta import relativedelta
from csv import reader
from flask_cors import CORS
from flask_pymongo import PyMongo
from urllib.parse import urljoin
import controller
import json
import model
import html
from bson import ObjectId
import csv

import joblib
import torch
from transformers import BertTokenizer, BertModel
from dotenv import load_dotenv
import warnings


warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")


app = Flask(__name__)
CORS(app)

app.config['MONGO_URI'] = "mongodb://localhost:27017/phish"
mongo = PyMongo(app)

# Load environment variables from .env file
load_dotenv()

# extension *****************************************************************************

model = joblib.load('saved_models/phishing_svm_model.pkl')

bert_model = BertModel.from_pretrained('bert-base-uncased', output_hidden_states=True)
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')

def extract_features(url):
    input_ids = torch.tensor([tokenizer.encode(url, max_length=512, truncation=True, add_special_tokens=True)])
    with torch.no_grad():
        outputs = bert_model(input_ids)
        hidden_states = outputs[2]
    token_vecs = []
    for layer in range(-4, 0):
        token_vecs.append(hidden_states[layer][0])
    features = []
    for token in token_vecs:
        features.append(torch.mean(token, dim=0))
    return torch.stack(features)

# class FeatureExtraction:
#     def __init__(self, url):
#         self.url = url
#         self.features = [] 

#     def extract_bert_features(self):
#         tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
#         model = BertModel.from_pretrained('bert-base-uncased')

#         inputs = tokenizer(self.url, return_tensors="pt")
#         with torch.no_grad():
#             outputs = model(**inputs)
        
#         embeddings = outputs.last_hidden_state.mean(dim=1).squeeze().numpy()

#         return embeddings.tolist()

#     def get_features_list(self):

#         # Add the BERT-based feature extraction
#         bert_features = self.extract_bert_features()

#         mean_bert_feature = np.mean(bert_features)
#         self.features.append(mean_bert_feature)

#         return self.features


def prob(features):
    pred = np.reshape(features, (1, 3072))
    res = model.predict(pred)
    # predict
    # probability = model.predict(features)[0]

    return res


def get_class(prob):
    if prob == 1:
        return 'PHISHING'
    elif prob == 0:
        return 'SAFE'

@app.route('/',methods=["GET","POST"])
def home():
    title = 'Phishing - Home'
    return render_template('index.html', title=title)

@app.route('/check_url', methods=['POST'])
def check_url():
    data = request.json
    url = data['url']
    print("URL : ", url)

    # Process the URL
    features = extract_features(url).numpy()
    probability = prob(features)

    decision = get_class(probability)
    print("Result : ", decision)

    return jsonify({"decision": decision})


# browser **********************************************************************************

@app.route('/report',methods=["GET","POST"])
def report():
    title = 'Phishing - Report URL'
    return render_template('report.html', title=title)

@app.route('/download',methods=["GET","POST"])
def download():
    title = 'Phishing - Downloads'
    return render_template('download.html', title=title)

@ app.route('/user_query')
def user_query():
    title = 'User Queries'
    return render_template('user_query.html', title=title)



# url prediction*****************************************************************************
@app.route('/inspect',methods=["GET","POST"])
def checkurl():
    title = 'Phishing - URL'
    try:
        url = request.form['url']
        result = controller.main(url)
        output = result
    except:
        output = 'NA'

    return render_template('predict.html', title=title, output=output)


    return render_template('user_predict.html', title=title, output=output)

@app.route('/preview', methods=['POST'])
def preview():
    title = 'Website Preview'
    try:
        url = request.form.get('url')
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')

        # inject external resources into HTML
        for link in soup.find_all('link'):
            if link.get('href'):
                link['href'] = urljoin(url, link['href'])
        
        # Uncomment this if you want to enable script
        # for script in soup.find_all('script'):
        #     if script.get('src'):
        #         script['src'] = urljoin(url, script['src'])

        for img in soup.find_all('img'):
            if img.get('src'):
                img['src'] = urljoin(url, img['src'])

        return render_template('preview.html', title=title, content=soup.prettify())
    except Exception as e:
        return  f"Error: {e}"


@app.route('/source-code', methods=['GET','POST'])
def view_source_code():

    try:
        url = request.form.get('url')
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        formatted_html = soup.prettify()
        
        return render_template('source_code.html', formatted_html = formatted_html, url = url)
    
    except Exception as e:
        return  f"Error: {e}"


# login ...............................................................................

username = "admin"
password = "admin123"
app.secret_key = 'phishing_key'

@app.route('/login', methods=['GET','POST'])
def login():
    if request.method == 'POST':
        uname = request.form['username']
        pwd = request.form['password']
        if uname == username and pwd == password:
            return redirect(url_for('admin'))
        else:
            # Incorrect credentials - redirect back to login page with a flash message
            flash('Invalid credentials. Please try again.', 'error')
            return redirect(url_for('login'))

    return render_template('login.html', title='Login')


# Checking IP................................................................................

VIRUSTOTAL_API_KEY = "f8ac9ce92ab42328d06c176a681bccb6d231bf03b8b684ea056fbbce32ee644a"

def check_ip_reputation(ip_address):
    url = f"https://www.virustotal.com/api/v3/ip_addresses/{ip_address}"
    headers = {"x-apikey": VIRUSTOTAL_API_KEY}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        result = response.json()
        return result
    else:
        return None

@app.route('/checkip')
def checkip():
    title = "Phishing - IP"
    return render_template('checkip.html', title=title)

@app.route('/check_ip', methods=['POST'])
def check_ip():
    ip_address = request.form['ip_address']
    ip_reputation_result = check_ip_reputation(ip_address)

    if ip_reputation_result:
        return jsonify(ip_reputation_result)
    else:
        return jsonify({"error": "Failed to retrieve IP reputation information."}), 500



#submit user query..............................................................................

@app.route('/submit_query', methods=['POST'])
def submit_query():
    data = {
        'name': request.form.get('Name'),
        'email': request.form.get('Email'),
        'message': request.form.get('Message'),
        'timestamp': datetime.now()
    }
    mongo.db.user_query.insert_one(data)
    return render_template('user_query.html')

# admin view query .............................................................................

@app.route('/view_query')
def display_data():
    data = list(mongo.db.user_query.find().sort('timestamp', -1))
    for index, query in enumerate(data, start=1):
        query['serial'] = index
    # Get the current date and time
    current_datetime = datetime.now()
    # Format the current date and time as a string
    formatted_current_datetime = current_datetime.strftime('%Y-%m-%d %H:%M:%S')
    # Format the timestamp in your query data with a space between date and time
    for query in data:
        query['date'] = query['timestamp'].strftime('%Y-%m-%d')
        query['time'] = query['timestamp'].strftime('%H:%M:%S')

    return render_template('view_query.html', title = 'User Queries', data=data, current_datetime=formatted_current_datetime)

@app.route('/view_query')
def view_query():
    
    title = 'User Queries'
    return render_template('view_query.html', title=title)


# admin view reports .............................................................................

def read_csv_file(file_path):
    result = []
    type_counts = {'IP': 0, 'URL': 0, 'Domain': 0}

    with open(file_path, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            result.append(row)

            # Count occurrences based on type
            if row['type'] == 'IP':
                type_counts['IP'] += 1
            elif row['type'] == 'URL':
                type_counts['URL'] += 1
            elif row['type'] == 'Domain':
                type_counts['Domain'] += 1

    return result[::-1], type_counts, len(result)

@app.route('/admin')
def display_report():

    # display csv data
    data_csv, type_counts, csv_row_count = read_csv_file(csv_file_path)

    # display report requests
    data = list(mongo.db.report_url.find().sort('timestamp', -1))
    count = mongo.db.report_url.count_documents({})
    current_datetime = datetime.now()
    formatted_current_datetime = current_datetime.strftime('%Y-%m-%d %H:%M:%S')

    for report in data:
        report['date'] = report['timestamp'].strftime('%Y-%m-%d')
        report['time'] = report['timestamp'].strftime('%H:%M:%S')

    title = 'Admin - Home'
    return render_template('admin_home.html', title=title, data=data, count=count, current_datetime=formatted_current_datetime, data_csv=data_csv, type_counts=type_counts, csv_row_count=csv_row_count)



@ app.route('/admin')
def admin():
    title = 'Admin - Home'
    return render_template('admin_home.html', title=title)



# view history .................................................................................

@app.route('/history',methods=["GET","POST"])
def history():

    data_csv, type_counts, csv_row_count = read_csv_file(csv_file_path)
    title = 'Phishing - History'
    return render_template('history.html', title=title, data_csv=data_csv, type_counts=type_counts)

#submit report url..............................................................................

@app.route('/submit_reporturl', methods=['POST'])
def submit_reporturl():
    title = 'Report Url'
    data = {
        'name': request.form.get('Name'),
        'email': request.form.get('Email'),
        'url': request.form.get('Url'),
        'type': request.form.get('Type'),
        'category': request.form.get('Category'),
        'timestamp': datetime.now()
    }
    mongo.db.report_url.insert_one(data)
    return render_template('report.html', title=title)



# delete reports ..............................................................................

csv_file_path = 'today.csv'

@app.route('/delete/<item_id>', methods=['POST'])
def delete_item(item_id):
    collection = mongo.db.report_url

    # Convert item_id to ObjectId
    item_id_obj = ObjectId(item_id)

    # Delete item from MongoDB
    collection.delete_one({'_id': item_id_obj})
    return redirect(url_for('admin'))


# confirm reports .............................................................................

@app.route('/confirm/<item_id>', methods=['POST'])
def confirm_item(item_id):
    if request.method == 'POST':
        data = {
            'date': request.form['timestamp'],
	    'type': request.form['type'],
	    'value': request.form['url'],
	    'category': request.form['category']
        }

        # Fetch data from MongoDB based on the query criteria
        collection = mongo.db.report_url

        # Insert data into CSV file
        write_data_to_csv(data)

        # Delete item from MongoDB
        item_id_obj = ObjectId(item_id)
        collection.delete_one({'_id': item_id_obj})

        return redirect(url_for('admin'))


def write_data_to_csv(data):
    # Write data to CSV file
    with open(csv_file_path, 'a', newline='') as csv_file:
        fieldnames = list(data.keys())
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

        if csv_file.tell() == 0:
            writer.writeheader()

        # Write data to CSV
        writer.writerow(data)



# Logout ......................................................................................

@app.route('/')
def logout():
	# Clear session data
    session.clear()
    # Redirect to the login page or any other page after logout
    return redirect(url_for('home'))


if __name__ == "__main__":
    app.run(debug=True, port=5000)
