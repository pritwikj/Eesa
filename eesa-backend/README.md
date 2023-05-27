Flask Deployment README
This README provides instructions on how to deploy a Flask application to a production server.

Prerequisites
Before proceeding with the deployment, ensure that the following prerequisites are met:

Python installed on the server
Pip (Python package manager) installed on the server
Git installed on the server (optional, if deploying from a Git repository)
Basic understanding of Flask framework and application structure
Deployment Steps
Follow these steps to deploy your Flask application:

Clone the repository (optional): If your application is stored in a Git repository, clone it to the deployment server using the following command:

git clone https://github.com/Skoruz/eesa-backend.git
Alternatively, you can manually copy your Flask application code to the server.

Create a virtual environment: It is recommended to use a virtual environment to isolate your application's dependencies. Navigate to the project directory and create a virtual environment by running the following command:
python -m venv venv

Activate the virtual environment:
source venv/bin/activate

Install dependencies: Install the required dependencies for your Flask application using pip. Make sure you have a requirements.txt file in your project directory listing all the dependencies. Install them by running the following command:

pip install -r requirements.txt
Configure the application: Set up any necessary configurations for your Flask application. This may include setting environment variables, database connections, or other application-specific settings. Update the necessary configuration files according to your needs.

Run the application: Start the Flask development server to test if your application runs correctly in the deployment environment. Run the following command:

flask run
Your Flask application should now be accessible at http://localhost:5025.

Congratulations! You have successfully deployed your Flask application to a production server.

