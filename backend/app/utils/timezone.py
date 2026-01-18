from datetime import datetime
import pytz

SRI_LANKA_TZ = pytz.timezone('Asia/Colombo')


def get_current_time():
    """Get current time in Sri Lanka timezone (Asia/Colombo, UTC+5:30)

    Returns datetime without tzinfo for database storage.
    """
    return datetime.now(SRI_LANKA_TZ).replace(tzinfo=None)
