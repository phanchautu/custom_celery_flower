import redis
import time
import json

redis_server = redis.StrictRedis(host='localhost', port=6379, password='w3ai-aioz_ai=2024', db=10)
# Set user
redis_server.set('admin1',json.dumps({'level':'admin', 'password':'q', 'status':'enable'}))
redis_server.set('operator1',json.dumps({'level':'operator', 'password':'q', 'status':'disable'}))
redis_server.set('guest1',json.dumps({'level':'guest', 'password':'q', 'status':'enable'}))
redis_server.set('admin2',json.dumps({'level':'admin', 'password':'q', 'status':'enable'}))
redis_server.set('operator2',json.dumps({'level':'operator', 'password':'q', 'status':'disable'}))
redis_server.set('guest2',json.dumps({'level':'guest', 'password':'q', 'status':'enable'}))

# redis_server.flushall()
while True :
    recovery_workers = {}
    recovery_worker_keys = redis_server.keys('*')
    for key in recovery_worker_keys:
        recovery_worker_value = json.loads(redis_server.get(key))
        recovery_workers[key.decode("utf-8")] = recovery_worker_value
    print(recovery_workers)
    time.sleep(1)