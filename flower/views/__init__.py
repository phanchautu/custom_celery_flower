import re
import inspect
import traceback
import copy
import logging
from logging.handlers import RotatingFileHandler
import hmac
import json
from base64 import b64decode
import tornado
from utils import template, bugreport, strtobool
logger = logging.getLogger(__name__)

class BaseHandler(tornado.web.RequestHandler):
    
    def set_default_headers(self):
        if not (self.application.options.basic_auth or self.application.options.auth):
            self.set_header("Access-Control-Allow-Origin", "*")
            self.set_header("Access-Control-Allow-Headers",
                            "x-requested-with,access-control-allow-origin,authorization,content-type")
            self.set_header('Access-Control-Allow-Methods',
                            ' PUT, DELETE, OPTIONS, POST, GET, PATCH')

    def options(self, *_, **__):
        self.set_status(204)
        self.finish()

    def render(self, *args, **kwargs):
        app_options = self.application.options
        functions = inspect.getmembers(template, inspect.isfunction)
        assert not set(map(lambda x: x[0], functions)) & set(kwargs.keys())
        kwargs.update(functions)
        kwargs.update(url_prefix=app_options.url_prefix)
        super().render(*args, **kwargs)

    def write_error(self, status_code, **kwargs):
        if status_code in (404, 403):
            message = ''
            if 'exc_info' in kwargs and kwargs['exc_info'][0] == tornado.web.HTTPError:
                message = kwargs['exc_info'][1].log_message
            self.render('404.html', message=message)
        elif status_code == 500:
            error_trace = "".join(traceback.format_exception(*kwargs['exc_info']))

            self.render('error.html',
                    debug = self.application.options.debug,
                    status_code = status_code,
                    error_trace = error_trace,
                    bugreport = bugreport())
        elif status_code == 401:
            self.set_status(status_code)
            self.set_header('WWW-Authenticate', 'Basic realm="flower"')
            self.finish('Access denied')
        else:
            message = ''
            if 'exc_info' in kwargs and kwargs['exc_info'][0] == tornado.web.HTTPError:
                message = kwargs['exc_info'][1].log_message
                self.set_header('Content-Type', 'text/plain')
                self.write(str(message))
            self.set_status(status_code)
            self.finish()

    def get_current_user(self):
        basic_auth = []
        operator_auth = []
        guest_auth = []

        if self.application.login_status:
            basic_auth = self.application.options.basic_auth.copy()
            operator_auth = self.application.options.operator_auth.copy()
            guest_auth = self.application.options.guest_auth.copy()
            user_list_keys = self.application.user_redis_server.keys('*')

            for user in user_list_keys:
                user_data = self.application.user_redis_server.get(user)
                user_data_json = json.loads(user_data.decode('utf-8'))
                if user_data_json['level'] == 'admin' and user_data_json['status'] == 'enable':
                    user_name = user.decode('utf-8')
                    password = user_data_json['password']
                    basic_auth.append(f'{user_name}:{password}')
                elif user_data_json['level'] == 'operator' and user_data_json['status'] == 'enable':
                    user_name = user.decode('utf-8')
                    password = user_data_json['password']
                    operator_auth.append(f'{user_name}:{password}')
                elif user_data_json['level'] == 'guest'and user_data_json['status'] == 'enable':
                    user_name = user.decode('utf-8')
                    password = user_data_json['password']
                    guest_auth.append(f'{user_name}:{password}')

        if self.application.login_status == False:
            self.application.login_status = True

        if basic_auth or operator_auth or guest_auth :
            auth_header = self.request.headers.get('Authorization', '')
            try:
                basic, credentials = auth_header.split()
                credentials = b64decode(credentials.encode()).decode()
                admin_login_success = True
                operator_login_success = True
                guest_login_success = True
                
                if basic != 'Basic':
                    raise tornado.web.HTTPError(401) 
                for stored_credential in basic_auth:
                    if hmac.compare_digest(stored_credential, credentials):
                        self.access_level = 'admin'
                        self.application.user_name = credentials.split(':')[0]
                        admin_login_success = True
                        break
                else:
                    admin_login_success = False

                for stored_credential in operator_auth:
                    if hmac.compare_digest(stored_credential, credentials):
                        self.access_level = 'operator'
                        self.application.user_name = credentials.split(':')[0]
                        operator_login_success = True
                        break
                else:
                    operator_login_success = False

                for stored_credential in guest_auth:
                    if hmac.compare_digest(stored_credential, credentials):
                        self.access_level = 'guest'
                        self.application.user_name = credentials.split(':')[0]
                        guest_login_success = True
                        break
                else:
                    guest_login_success = False

                if not admin_login_success and not operator_login_success and not guest_login_success:
                    raise tornado.web.HTTPError(401)
                basic_auth.pop()
                operator_auth.pop()
                guest_auth.pop()

            except ValueError as exc:
                if basic_auth:
                    basic_auth.pop()
                if operator_auth:
                    operator_auth.pop()
                if guest_auth:
                    guest_auth.pop()
                raise tornado.web.HTTPError(401) from exc
        
        else:
            raise tornado.web.HTTPError(401)
     
        # OAuth2
        if not self.application.options.auth:
            return True
        user = self.get_secure_cookie('user')
        if user:
            if not isinstance(user, str):
                user = user.decode()
            if re.match(self.application.options.auth, user):
                return user
        return None

    def get_argument(self, name, default=[], strip=True, type=None):
        arg = super().get_argument(name, default, strip)
        
        if arg and isinstance(arg, str):
            arg = tornado.escape.xhtml_escape(arg)
        if type is not None:
            try:
                if type is bool:
                    arg = strtobool(str(arg))
                else:
                    arg = type(arg)
            except (ValueError, TypeError) as exc:
                if arg is None and default is None:
                    return arg
                raise tornado.web.HTTPError(
                        400,
                        f"Invalid argument '{arg}' of type '{type.__name__}'") from exc
        return arg

    @property
    def capp(self):
        "return Celery application object"
        return self.application.capp

    def format_task(self, task):
        custom_format_task = self.application.options.format_task
        if custom_format_task:
            try:
                task = custom_format_task(copy.copy(task))
            except Exception:
                logger.exception("Failed to format '%s' task", task.uuid)
        return task

    def get_active_queue_names(self):
        queues = set([])
        for _, info in self.application.workers.items():
            for queue in info.get('active_queues', []):
                queues.add(queue['name'])

        if not queues:
            queues = set([self.capp.conf.task_default_queue]) |\
                {q.name for q in self.capp.conf.task_queues or [] if q.name}
        return sorted(queues)

    def ping_to_redis(redis_server):
        try:
            redis_server.ping()
            return True
        except Exception:
            return False
        
    def get_user_from_database(self):
        return self.application.user_redis_server.keys('*')