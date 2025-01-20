import os
import time
from datetime import datetime
from celery import Celery

os.environ['TZ'] = 'UTC'
time.tzset()

app = Celery("tasks",
             broker="amqp://guest:guest@localhost:5672/",
             backend="redis://:w3ai-aioz_ai=2024@localhost:6379/0",)

@app.task(name="test", bind=True)
def add(self,x, y):
    print(x + y)
    return x + y