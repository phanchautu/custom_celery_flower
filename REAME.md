# Flower

Flower is an open-source web application for monitoring and managing Celery clusters.
It provides real-time information about the status of Celery workers and tasks.

## Features
--------

- Real-time monitoring using Celery Events
    - View task progress and history
    - View task details (arguments, start time, runtime, and more)
- Remote Control
    - View worker status and statistics
    - Shutdown and restart worker instances
    - Control worker pool size and autoscale settings
    - View and modify the queues a worker instance consumes from
    - View currently running tasks
    - View scheduled tasks (ETA/countdown)
    - View reserved and revoked tasks
    - Apply time and rate limits
    - Revoke or terminate tasks
- Broker monitoring
    - View statistics for all Celery queues
- HTTP Basic Auth, Google, Github, Gitlab and Okta OAuth
- Prometheus integration
- API

## Installation with docker image
------------
Build a redis-sever database image for worker storage

```
redis:
    image: redis:alpine
    hostname: redis
    command: ["redis-server", "--requirepass", "w3ai-aioz_ai=2024"]
    ports:
      - 6379:6379
    volumes:
      - redis_data:/data
    environment:
      - REDIS_PASSWORD=w3ai-aioz_ai=2024
    networks:
      - flower-networks
    healthcheck:
      test: [ "CMD", "redis-cli","-a", "w3ai-aioz_ai=2024", "--raw", "incr", "ping" ]
      interval: 20s
      timeout: 10s
      retries: 5
      start_period: 20s

```

Build flower service from docker file

```
custom_flower:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: custom-flower-1
    
    ports:
      - 5555:5555
    environment:
      - BROKER_URL=amqp://guest:guest@rabbitmq:5672//
      - FLOWER_BROKER_API=http://guest:guest@rabbitmq:15672/api/
      - FLOWER_BASIC_AUTH=admin:admin
      - FLOWER_OPERATOR_AUTH=operator:operator
      - FLOWER_GUEST_AUTH=guest:guest
      - FLOWER_PERSISTENT=True
      - FLOWER_DB=/data/flower_db
      - FLOWER_ENABLE_EVENT=True
      - FLOWER_REDIS_PASSWORD=w3ai-aioz_ai=2024
      - FLOWER_REDIS_HOST=redis
      - FLOWER_REDIS_DATABASE_TABLE=1
    volumes:
      - flower:/data
    links:
      - redis
      - rabbitmq
    depends_on:
      rabbitmq:
        condition: service_healthy 
      redis:
        condition: service_healthy      
    networks:
      - flower-networks
```

From Docker hub :
```
custom_flower:
    image: phanchautu/w3ai-custom-flower:1.4
    container_name: custom-flower-1

```
-----

## Run flower from source

Clone repo:
```
http://git.aioz.io/W3AI-2024/custom-celery-flower.git
```

To run Flower from source, you need to provide the broker URL ::

```    
cd flower
python3 flower flower-aioz -A tasks -broker-api="http://guest:guest@localhost:15672/api/"

```

Config permission login with 3 level:

```
python3 flower flower-aioz -A tasks --basic-auth=admin:admin_pass --operator-auth=operator:operator_pass --guest-auth=guest:guest_pass


```

Config redis-server connection

```
python3 flower flower-aioz -A tasks --redis_host=redis --redis_database=0 --redis_password=w3ai-aioz_ai=2024

```

API
---

Flower API enables to manage the cluster via HTTP `REST API`.

For example you can restart worker's pool by: ::

    $ curl -X POST http://localhost:5555/api/worker/pool/restart/myworker

Or call a task by: ::

    $ curl -X POST -d '{"args":[1,2]}' http://localhost:5555/api/task/async-apply/tasks.add

Or terminate executing task by: ::

    $ curl -X POST -d 'terminate=True' http://localhost:5555/api/task/revoke/8a4da87b-e12b-4547-b89a-e92e4d1f8efd

For more info checkout [API Reference](https://flower.readthedocs.io/en/latest/api.html)

Documentation
-------------

Documentation is available at [Read the Docs](https://flower.readthedocs.io)

License
-------

Flower is licensed under BSD 3-Clause License.
See the [License](https://github.com/mher/flower/blob/master/LICENSE) file for the full license text.
