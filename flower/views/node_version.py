import copy
import logging
from functools import total_ordering


from tornado import web

from utils.tasks import as_dict, get_task_by_id, iter_tasks
from views import BaseHandler

logger = logging.getLogger(__name__)



class NodeVersionView(BaseHandler):
    @web.authenticated
    def get(self):
        app = self.application
        capp = self.application.capp

        time = 'natural-time' if app.options.natural_time else 'time'
        if capp.conf.timezone:
            time += '-' + str(capp.conf.timezone)

        self.render(
            "node_version.html",
            nodes=[],
            node_url = self.application.options.node_api_endpoint,
            columns=app.options.node_version_column,
            time=time, permission = self.access_level
        )