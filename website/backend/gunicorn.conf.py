# Production server settings, picked up automatically by `gunicorn app:app` run from this folder.
import os

bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
workers = 1          # one copy of the TensorFlow model fits in a 512 MB instance
threads = 4
timeout = 120        # model loading and the first prediction can take a while on small instances
