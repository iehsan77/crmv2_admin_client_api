import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import smtplib, ssl

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart



SENDER_EMAIL = "iehsan77@gmail.com"

RECEIVER_EMAIL = "noreply@prontowebssolution.com"
EMAIL_HOST = "prontowebssolution.com"
USER_ID = "noreply@prontowebssolution.com"
PASSWORD = "_An$=~9k8%dT"
PORT = 465



message = Mail(from_email=SENDER_EMAIL,to_emails=RECEIVER_EMAIL) 
           
message = MIMEMultipart("alternative")
message["Subject"] = "Contact Form Inquiry"
message["From"] = SENDER_EMAIL
message["To"] = RECEIVER_EMAIL

attached_message = "Test Message Sent"
        
message.attach(MIMEText(attached_message, "html"))

context = ssl.create_default_context()
        
try:

    with smtplib.SMTP_SSL(EMAIL_HOST, PORT, context=context) as server:
    
        server.ehlo()  # Can be omitted
        print("Line : 47")
        server.ehlo()  # Can be omitted
        print("Line : 49")
        server.login(USER_ID, PASSWORD)
        response = server.sendmail (SENDER_EMAIL,RECEIVER_EMAIL, message.as_string() )   
        print("Line : 52")
        print(response)
        server.quit()

    
            
except Exception as e:
        
        print(e)
        