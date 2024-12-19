import redis
import time
import json

redis_server = redis.StrictRedis(host='localhost', port=6379, password='w3ai-aioz_ai=2024', db=10)
# Set user
# redis_server.set('user1',json.dumps({'level':'admin', 'password':'user1'}))
# redis_server.set('user2',json.dumps({'level':'operator', 'password':'user2'}))
# redis_server.set('user3',json.dumps({'level':'guest', 'password':'user3'}))

redis_server.flushall()
while True :
    recovery_workers = {}
    recovery_worker_keys = redis_server.keys('*')
    for key in recovery_worker_keys:
        recovery_worker_value = json.loads(redis_server.get(key))
        recovery_workers[key.decode("utf-8")] = recovery_worker_value
    print(recovery_workers)
    time.sleep(1)