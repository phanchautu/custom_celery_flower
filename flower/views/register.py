import copy
import logging
from functools import total_ordering
import json


from tornado import web
from utils.tasks import as_dict, get_task_by_id, iter_tasks
from views import BaseHandler
logger = logging.getLogger(__name__)

class RegisterView(BaseHandler):
    @web.authenticated
    def get(self):
        app = self.application
        capp = self.application.capp

        time = 'natural-time' if app.options.natural_time else 'time'
        if capp.conf.timezone:
            time += '-' + str(capp.conf.timezone)
        users = []
        database_user_list = self.application.user_redis_server.keys('*')
        for user in database_user_list:
            user_data = json.loads(self.application.user_redis_server.get(user.decode('utf-8')))
            user = {
                'name': user.decode('utf-8'),
                'level': user_data['level']
            }
            users.append(user)

        self.render(
            "register.html",
            nodes=[],
            users=users,
            columns=app.options.node_version_column,
            time=time, permission = self.access_level
        )

    async def post(self):
        available_user = True
        delete_success = False
        request_data = json.loads(self.request.body.decode('utf-8'))
        if request_data["action"] == "create":
        # Check exist user
            database_user_list = self.application.user_redis_server.keys('*')
            for user in database_user_list:
                if request_data["name"] == user.decode('utf-8') :
                    message = {'result':'failed', 'message':'User name is exist'}
                    available_user = False
                    self.write(message)
                    break
                    # 
            if available_user:
                try:
                    self.application.user_redis_server.set(request_data["name"],json.dumps({'level':request_data["level"], 'password':request_data["pass"]}))
                    message = {'result':'sucess', 'message': 'sucess'}
                    self.write(message)
                except:
                    message = {'result':'failed','message':'Failed update database'}
                    self.write(message)

        else :
            database_user_list = self.application.user_redis_server.keys('*')
            
            for user in database_user_list:
                if request_data["name"] == user.decode('utf-8') :
                    exist_user = request_data["name"]
                    self.application.user_redis_server.delete(user.decode('utf-8'))
                    message = {'result':'success', 'message':f'Delete user : {exist_user} successfully'}
                    delete_success = True
                    self.write(message)
                    break

            if not delete_success:
                message = {'result':'failed', 'message':'Delete user failed'}
                self.write(message)