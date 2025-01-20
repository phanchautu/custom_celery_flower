from celery import Celery
from celery.result import AsyncResult
import time
from celery_app import app

for x in range(5):
    task = app.send_task(
        name="test",
        args=[100,65 ],
        queue="celery"
    )
    time.sleep(0.1)  
    result = app.AsyncResult(task.id).result
    print(result)
else :
    print("Finish")