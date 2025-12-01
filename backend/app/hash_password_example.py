from app.utils.utils import generate_hashed_password

plain_password = "my_secure_password"
hashed_password = generate_hashed_password(plain_password)
print("Hashed Password:", hashed_password)