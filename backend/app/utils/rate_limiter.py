"""Rate limiting utility for authentication endpoints."""

import time
from collections import defaultdict
from threading import Lock
from typing import Dict, Tuple

from fastapi import HTTPException, status


class RateLimiter:
    """
    Simple in-memory rate limiter for login attempts.

    Tracks failed login attempts per IP address and implements
    exponential backoff with lockout after max attempts.
    """

    def __init__(
        self,
        max_attempts: int = 5,
        lockout_duration: int = 900,  # 15 minutes in seconds
        window_duration: int = 300     # 5 minute window for counting attempts
    ):
        self.max_attempts = max_attempts
        self.lockout_duration = lockout_duration
        self.window_duration = window_duration

        # Store: {ip_address: [(timestamp, success), ...]}
        self._attempts: Dict[str, list] = defaultdict(list)
        # Store: {ip_address: lockout_until_timestamp}
        self._lockouts: Dict[str, float] = {}
        self._lock = Lock()

    def _cleanup_old_attempts(self, ip_address: str) -> None:
        """Remove attempts older than the window duration."""
        current_time = time.time()
        cutoff = current_time - self.window_duration
        self._attempts[ip_address] = [
            (ts, success) for ts, success in self._attempts[ip_address]
            if ts > cutoff
        ]

    def _get_failed_attempts(self, ip_address: str) -> int:
        """Get the number of failed attempts within the window."""
        self._cleanup_old_attempts(ip_address)
        return sum(1 for _, success in self._attempts[ip_address] if not success)

    def check_rate_limit(self, ip_address: str) -> None:
        """
        Check if the IP address is rate limited.

        Raises HTTPException with 429 if rate limited.
        """
        with self._lock:
            current_time = time.time()

            # Check if IP is locked out
            if ip_address in self._lockouts:
                lockout_until = self._lockouts[ip_address]
                if current_time < lockout_until:
                    remaining = int(lockout_until - current_time)
                    minutes = remaining // 60
                    seconds = remaining % 60
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail=f"Too many failed login attempts. Please try again in {minutes} minutes and {seconds} seconds."
                    )
                else:
                    # Lockout expired, remove it
                    del self._lockouts[ip_address]
                    self._attempts[ip_address] = []

    def record_attempt(self, ip_address: str, success: bool) -> None:
        """
        Record a login attempt.

        Args:
            ip_address: The IP address making the attempt
            success: Whether the login was successful
        """
        with self._lock:
            current_time = time.time()

            if success:
                # On successful login, clear attempt history for this IP
                self._attempts[ip_address] = []
                if ip_address in self._lockouts:
                    del self._lockouts[ip_address]
            else:
                # Record failed attempt
                self._attempts[ip_address].append((current_time, False))

                # Check if we've exceeded max attempts
                failed_count = self._get_failed_attempts(ip_address)
                if failed_count >= self.max_attempts:
                    # Lock out the IP
                    self._lockouts[ip_address] = current_time + self.lockout_duration

    def get_remaining_attempts(self, ip_address: str) -> int:
        """Get the number of remaining attempts before lockout."""
        with self._lock:
            failed_count = self._get_failed_attempts(ip_address)
            return max(0, self.max_attempts - failed_count)


# Global rate limiter instance for auth endpoints
auth_rate_limiter = RateLimiter(
    max_attempts=5,
    lockout_duration=900,  # 15 minutes
    window_duration=300    # 5 minute window
)
