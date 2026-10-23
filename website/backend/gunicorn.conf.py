# Production server settings, picked up automatically by `gunicorn app:app` run from this folder.
import os

bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
workers = 1             # one copy of the TensorFlow model fits in a 512 MB instance
worker_class = "sync"   # requests run on the worker's main thread, where the model was loaded;
                        # TensorFlow calls from gthread request threads hung on Render's free instance
timeout = 180           # the first prediction on a 0.15-CPU instance can take a while
