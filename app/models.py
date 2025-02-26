from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100,null=True)
    username = models.CharField(max_length=100,null=True)
    email = models.CharField(max_length=100,null=True)
    password = models.CharField(max_length=100,null=True)
    date = models.CharField(max_length=20,null=True)
    intrest=models.JSONField(max_length=300, null=True)
    joined = models.JSONField(max_length=500, null=True)
    time_spent=models.JSONField(max_length=500, null=True)
    rank_data = models.CharField(max_length=500, null=True)
    points = models.CharField(max_length=200, null=True)

    
class Groups(models.Model):
    name=models.CharField(max_length=100)
    group_desc = models.CharField(max_length=100, null=True)    
    group_category = models.CharField(max_length=100, null=True)    
    group_image = models.ImageField(upload_to="static/group_dp/", null=True)    
    group_time = models.CharField(max_length=100, null=True)    
    group_desc = models.CharField(max_length=100, null=True) 
    user_quantity = models.IntegerField(null=True) 
    creator = models.CharField(max_length=500,null=True) 
    weekly_data = models.JSONField(max_length=500, null=True)

       

class Messages(models.Model):
    sender=models.CharField(max_length=100)
    message=models.CharField(max_length=1000)
    groupname= models.CharField(max_length=100)
    unsent=models.BooleanField(null=True)
    edit=models.BooleanField(null=True)
    attachfile=models.CharField(max_length=300, null=True)
 
     
class IntrestNotifition(models.Model):
    groups = models.JSONField(max_length=500)
    users_recived = models.JSONField(max_length=500)
 


 