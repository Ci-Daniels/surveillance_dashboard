import os
class Config:
    # set the sectret key
    secret_key = os.getenv('SECRET_KEY')
    
    # define the access fields
    user = os.getenv('CONTABO_USER')
    password = os.getenv('DB_PASSWORD')
    server = os.getenv('CONTABO_SERVER')
    db1 = os.getenv('CONTABO_NAME')
    port = os.getenv('DB_PORT')

    # for the database connection
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = f'postgresql://{user}:{password}@{server}:{port}/{db1}' 

    

