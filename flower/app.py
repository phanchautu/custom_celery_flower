import sys
import logging
from concurrent.futures import ThreadPoolExecutor
import celery
import tornado.web
import redis
from tornado import ioloop
from tornado.httpserver import HTTPServer
from tornado.web import url
from urls import handlers as default_handlers
from events import Events
from inspector import Inspector
from options import default_options
from logging.handlers import RotatingFileHandler
logger = logging.getLogger(__name__)

if sys.version_info[0] == 3 and sys.version_info[1] >= 8 and sys.platform.startswith('win'):
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

def rewrite_handler(handler, url_prefix):
    if isinstance(handler, url):
        return url("/{}{}".format(url_prefix.strip("/"), handler.regex.pattern),
                   handler.handler_class, handler.kwargs, handler.name)
    return ("/{}{}".format(url_prefix.strip("/"), handler[0]), handler[1])

class Flower(tornado.web.Application):
    pool_executor_cls = ThreadPoolExecutor
    max_workers = None
    def __init__(self, options=None, capp=None, events=None,
                 io_loop=None, **kwargs):
        handlers = default_handlers
        if options is not None and options.url_prefix:
            handlers = [rewrite_handler(h, options.url_prefix) for h in handlers]
        kwargs.update(handlers=handlers)
        super().__init__(**kwargs)
        self.options = options or default_options
        self.io_loop = io_loop or ioloop.IOLoop.instance()
        self.ssl_options = kwargs.get('ssl_options', None)
        self.capp = capp or celery.Celery()
        self.capp.loader.import_default_modules()
        self.executor = self.pool_executor_cls(max_workers=self.max_workers)
        self.io_loop.set_default_executor(self.executor)
        self.inspector = Inspector(self.io_loop, self.capp, self.options.inspect_timeout / 1000.0)
        self.events = events or Events(
            self.capp,
            db=self.options.db,
            persistent=self.options.persistent,
            state_save_interval=self.options.state_save_interval,
            enable_events=self.options.enable_events,
            io_loop=self.io_loop,
            max_workers_in_memory=self.options.max_workers,
            max_tasks_in_memory=self.options.max_tasks)
        self.started = False
        self.option_admin_user = self.options.basic_auth
        self.option_operator_user = self.options.operator_auth
        self.option_guest_user = self.options.guest_auth
        self.current_admin_user = self.options.basic_auth
        self.current_operator_user = self.options.operator_auth
        self.current_guest_user = self.options.guest_auth
        self.login_status = True
        self.redis_server = redis.StrictRedis(host=str(self.options.redis_host), port=6379, password= str(self.options.redis_password), db=int(self.options.redis_database_table))
        self.user_redis_server = redis.StrictRedis(host=str(self.options.redis_host), port=6379, password= str(self.options.redis_password), db=int(self.options.user_database_table))
        self.user_name = ""
        self.logging_path = self.options.logging_path

        logging.basicConfig(filename= self.logging_path, format="%(asctime)-27s %(name)-8s %(levelname)-3s %(message)s")
        formatter = logging.Formatter("%(asctime)-27s %(name)-18s %(levelname)-8s %(message)s")
        self.main_logger = logging.getLogger("User")
        handler = RotatingFileHandler(
                self.options.logging_path,
                maxBytes = 5242880,
                backupCount = 100,
                encoding = None,
                delay = False
            )
        handler.setFormatter(formatter)
        self.main_logger.addHandler(handler)
        logger.addHandler(handler)

    def start(self):
        self.events.start()

        if not self.options.unix_socket:
            self.listen(self.options.port, address=self.options.address,
                        ssl_options=self.ssl_options,
                        xheaders=self.options.xheaders)
        else:
            from tornado.netutil import bind_unix_socket
            server = HTTPServer(self)
            socket = bind_unix_socket(self.options.unix_socket, mode=0o777)
            server.add_socket(socket)

        self.started = True
        self.update_workers()
        self.io_loop.start()

    def stop(self):
        if self.started:
            self.events.stop()
            logging.debug("Stopping executors...")
            self.executor.shutdown(wait=False)
            logging.debug("Stopping event loop...")
            self.io_loop.stop()
            self.started = False

    @property
    def transport(self):
        return getattr(self.capp.connection().transport, 'driver_type', None)

    @property
    def workers(self):
        return self.inspector.workers

    def update_workers(self, workername=None):
        return self.inspector.inspect(workername)
