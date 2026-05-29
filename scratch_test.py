import asyncio
from app.services.email_service import send_reset_password_email

async def main():
    try:
        await send_reset_password_email("test@example.com", "123456")
        print("Success")
    except Exception as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")

asyncio.run(main())
