# AIOZ Flower
AIOZ Flower is a custom version from [flower github repository](https://github.com/mher/flower.git) that is an open-source web application for monitoring and managing Celery clusters.
It provides real-time information about the status of Celery workers, tasks, broker ,node version and user management.

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
- User management
- AIOZ node version managment :
    - View node version list
    - Change node version status
    - Upload source code to W3S, create new version

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
      - FLOWER_NODE_API_ENDPOINT=http://10.0.0.30:8089/
      - FLOWER_USER_DATABASE_TABLE= 10
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
    image: phanchautu/w3ai-custom-flower:1.6
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
--basic-auth=admin:admin_pass --operator-auth=operator:operator_pass --guest-auth=guest:guest_pass


```

Config redis-server connection

```
--redis_host=redis --redis_database=0 --redis_password=w3ai-aioz_ai=2024

```

Config redis-server for user database

```
 --user_database_table=10

```

Config node version api endpoint

```
 --node_api_endpoint="http://10.0.0.30:8089/"
```

Config logging file path:

```
 -- logging-path=flower.log
```



## Development :

### Add new options:
Open file ```~/flower/options.py ``` add new option like this :
```
define("user_database_table", type=int, default=10, multiple=False, help="user database table")

```
Get value of options :

```
self.options.user_database_table

```
Get/Set options value from flower application : Open file ```~/flower/app.py ```

Set new options to app
```
self.new_option = self.options.new_option
```
Get new options from app

```
option = self.application.new_option
```

### Add item on menu bar

Open file ```~/flower/templates/navbar.html```

```
  <li class="nav-item">
        <a class="nav-link text-dark" href="{{ reverse_url('new_menu') }}">New menu</a>
  </li>
```
Create new url for menu:

```
handlers = [
    # App
    url(r"/", WorkersView, name='main'),
    url(r"/workers", WorkersView, name='workers'),
    url(r"/worker/(.+)", WorkerView, name='worker'),
    url(r"/task/(.+)", TaskView, name='task'),
    url(r"/tasks", TasksView, name='tasks'),
    url(r"/tasks/datatable", TasksDataTable),
    url(r"/broker", BrokerView, name='broker'),
    url(r"/node-version", NodeVersionView, name='node-version'),
    url(r"/settings", RegisterView, name='settings'),
    url(r"/new_menu", NewMenuView, name='new_menu')
]
```

Create backend python script: Creat a new python script in folder ```~flower/views/new_menu_file.py```
```
from tornado import web
from utils.broker import Broker
from views import BaseHandler

class NewMenuView(BaseHandler):
    @web.authenticated
    async def get(self):
        self.render("new_menu.html",queues=queues,permission=self.access_level, user_name = self.application.user_name)

```

Create new html file at ```~/flower/templetes/

```
{% extends "base.html" %}

{% block navbar %}
{% module Template("navbar.html", permission=permission, user_name = user_name) %}
{% end %}

{% block container %}
<div class="container-fluid">
  
</div>
{% end %}
```
Html script with node js at file ```~/flower/static/js/flower.js```

### Transfer html variable to JS Script

```
<script type="text/javascript">
  var node_url ="{{node_url}}"
</script>

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
