import requests
import logging
import asyncio
import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

async def send_reset_password_email(to_email: str, token: str):
    if not settings.EMAILJS_PUBLIC_KEY or not settings.EMAILJS_SERVICE_ID or not settings.EMAILJS_TEMPLATE_ID:
        logger.warning(f"EmailJS is not fully configured. Would have sent reset token {token} to {to_email}")
        return

    expire_time = (datetime.datetime.now() + datetime.timedelta(minutes=15)).strftime("%H:%M")

    data = {
        "service_id": settings.EMAILJS_SERVICE_ID,
        "template_id": settings.EMAILJS_TEMPLATE_ID,
        "user_id": settings.EMAILJS_PUBLIC_KEY,
        "accessToken": settings.EMAILJS_PRIVATE_KEY,
        "template_params": {
            "email": to_email,
            "passcode": token,
            "time": expire_time
        }
    }

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None, 
            lambda: requests.post("https://api.emailjs.com/api/v1.0/email/send", json=data)
        )
        response.raise_for_status()
        logger.info(f"Sent password reset email to {to_email} via EmailJS")
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via EmailJS: {e}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"EmailJS Response: {e.response.text}")
        raise e
