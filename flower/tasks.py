from celery import Celery
from kombu import Queue
import os
import time

celery_app = Celery(
        "tasks",
        backend="redis://:w3ai-aioz_ai=2024@localhost:6379/0",
        broker="amqp://guest:guest@localhost:5672//",
    )

celery_app.conf.update(
    task_track_started=True,
    result_expires = 60,
    )
# celery_app.conf.timezone = 'Asia/Ho_Chi_Minh'
# celery_app.conf.enable_utc = True
# celery_app.conf.update(worker_enable_clock_sync = False)

@celery_app.task(name="test", bind=True)
def task(self,x,y):
    time.sleep(5)
    return x + y