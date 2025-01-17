import logging
from functools import total_ordering
import json
from redis.commands.json.path import Path

from tornado import web
from utils.tasks import as_dict, get_task_by_id, iter_tasks
from views import BaseHandler
logger = logging.getLogger(__name__)

class RegisterView(BaseHandler):
    access_user_json_list = []
    
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
                'level': user_data['level'],
                'status': user_data['status']
            }
            if self.access_level == 'admin':
                if user_data['level'] == 'operator' or user_data['level'] == 'guest' :
                    users.append(user)
            elif self.access_level == 'operator' :
                if user_data['level'] == 'guest':
                    users.append(user)
        global access_user_json_list
        access_user_json_list = users.copy()
        
        self.render(
            "register.html",
            nodes=[],
            users=users,
            columns=app.options.node_version_column,
            time=time, permission = self.access_level, user_name = self.application.user_name
        )
    
    async def post(self):
        available_user = True
        delete_success = False
        request_data = json.loads(self.request.body.decode('utf-8'))
        database_user_list = self.get_user_from_database()
        if request_data["action"] == "create":
            self.application.main_logger.info(f"{self.application.user_name}: Create new user")
            for user in database_user_list:
                if request_data["name"] == user.decode('utf-8') :
                    message = {'result':'failed', 'message':'User name is exist'}
                    self.write(message)
                    available_user = False
                    break
            if available_user:
                try:
                    self.application.user_redis_server.set(request_data["name"],json.dumps({'level':request_data["level"], 'password':request_data["pass"], 'status':'disable'}))
                    self.application.main_logger.info(f"{self.application.user_name}: Add user {request_data['name']} successfully")
                    message = {'result':'sucess', 'message': 'Add new user successfully'}
                    self.write(message)
                except:
                    message = {'result':'failed','message':'Failed update database'}
                    self.write(message)

        elif request_data["action"] == "change":
            name = request_data["name"].encode('utf-8')
            change_status = False

            if name not in database_user_list :
                message = {'result':'failed', 'message': 'User is not exist'}
                self.write(message)
                return
            for user in database_user_list:
                user_info = json.loads(self.application.user_redis_server.get(user).decode('utf-8'))
                if user.decode('utf-8') == request_data["name"] and user_info["password"] == request_data["pass"]:
                    user_info['password'] = request_data["new_password"]
                    logger.info(user_info)
                    self.application.user_redis_server.set(user,json.dumps(user_info))
                    change_status = True
                    self.application.main_logger.info(f"{self.application.user_name}: Change password user {request_data['name']} successfully")
                    message = {'result':'sucess', 'message': 'Change password successfully'}
                    self.write(message)
                    break
            if not change_status:    
                message = {'result':'failed', 'message': 'Change password failed'}
                self.write(message)

        elif request_data["action"] == "set_pass":
            name = request_data["name"].encode('utf-8')
            if name not in database_user_list :
                message = {'result':'failed', 'message': 'User is not exist'}
                self.write(message)
                return

            access_user_list = []
            for access_user_json in access_user_json_list :
                access_user_list.append(access_user_json['name'])
            
            if name.decode('utf-8') not in access_user_list:
                message = {'result':'failed', 'message': 'Not permission to change'}
                self.write(message)
                return

            user_info = json.loads(self.application.user_redis_server.get(name).decode('utf-8'))
            user_info['password'] = request_data['pass']
            self.application.user_redis_server.set(name,json.dumps(user_info))
            self.application.main_logger.info(f"{self.application.user_name}: set password of user {request_data['name']} successfully")
            message = {'result':'success', 'message': 'Set new password successfully'}
            self.write(message)
            return

        elif request_data["action"] == "disable":
            name = request_data["name"].encode('utf-8')
            if request_data["name"].encode('utf-8') not in database_user_list :
                message = {'result':'failed', 'message': 'User is not exist'}
                self.write(message)
                return  
            user_info = json.loads(self.application.user_redis_server.get(name).decode('utf-8'))
            user_info['status'] = "disable"
            self.application.user_redis_server.set(name,json.dumps(user_info))
            self.application.main_logger.info(f"{self.application.user_name}: Disable user {request_data['name']} successfully")
            message = {'result':'sucess', 'message': 'Disable user successfully'}
            self.write(message)

        elif request_data["action"] == "enable":
            name = request_data["name"].encode('utf-8')
            if request_data["name"].encode('utf-8') not in database_user_list :
                message = {'result':'failed', 'message': 'User is not exist'}
                self.write(message)
                return  
            user_info = json.loads(self.application.user_redis_server.get(name).decode('utf-8'))
            user_info['status'] = "enable"
            self.application.user_redis_server.set(name,json.dumps(user_info))
            message = {'result':'sucess', 'message': 'Enable user successfully'}
            self.write(message)

        else :
            for user in database_user_list:
                if request_data["name"] == user.decode('utf-8') :
                    exist_user = request_data["name"]
                    self.application.user_redis_server.delete(user.decode('utf-8'))
                    self.application.main_logger.info(f"{self.application.user_name}: Delete user {exist_user} successfully")
                    message = {'result':'success', 'message':f'Delete user : {exist_user} successfully'}
                    delete_success = True
                    self.write(message)
                    break

            if not delete_success:
                message = {'result':'failed', 'message':'Delete user failed'}
                self.write(message)