from passlib.context import CryptContext
import requests
import urllib
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash(password: str):
    return pwd_context.hash(password)


def verify(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def send_sms_verification(phone_number: str, verification_code: int):
    print("234")
    username = "Hshortcode"
    password = "S0098gkr"
    source = "8743"
    message = urllib.parse.quote("Dear user, "+ str(verification_code) + " is your account verification code for JagahOnline.com that will expire in 60 minutes"
        )

    print("239")
    api_url = "http://sms.montymobile.com/API/SendSMS?username=" + username+"&apiId=" + \
        password + "&json=True&destination=" + \
        phone_number+"&source="+source+"&text="+message
    print(api_url)
    response = requests.get(api_url)
    print(response)

def generate_hashed_password(password: str) -> str:
    """
    Generate a hashed password using bcrypt.

    Args:
        password (str): The plain text password to hash.

    Returns:
        str: The hashed password.
    """
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed_password.decode('utf-8')