from django.urls import re_path
from .consumers import ChatConsumer

# <----------------------------------------Main Chat Route Endpoints-------------------------------------->


websocket_urlpatterns = [
    re_path(r'ws/websocket-server/(?P<room_name>\w+)/$', ChatConsumer.as_asgi())
]
