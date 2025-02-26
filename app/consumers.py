import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

class ChatConsumer(WebsocketConsumer):
   def connect(self):
       self.accept()
       self.room_group = self.scope['url_route']['kwargs']['room_name']

       async_to_sync(self.channel_layer.group_add)(
           self.room_group,
           self.channel_name
       )

       self.send(text_data=json.dumps(
           {
               'Status':'Connection established',
               'Message':'User successfull connected with server'
           }
       ))

   def receive(self, text_data):
         data = json.loads(text_data)
         print(data['file'])
         
         async_to_sync(self.channel_layer.group_send)(
             self.room_group,
             {
                 'type':'server_chat',
                 'message':data['message'],
                 'username':data['username'],
                 'file':data['file']
             }
         )
    
   
   def server_chat(self,event):
       message=event['message']
       username=event['username']
       file=event['file']

       self.send(text_data=json.dumps({
           'type':'serverchat',
           'message':message,
           'username':username,
           'file':file
       }))



    