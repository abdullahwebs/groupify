from django.shortcuts import render
from django.http import JsonResponse
from .models import User, Groups, Messages,IntrestNotifition 
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
import json
from datetime import datetime, timedelta
from django.utils.timezone import now, make_aware
from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from io import BytesIO
import requests
from django.core.files import File
import random
from decimal import Decimal
import jwt
from .jwt_middleware import jwt_required 
from django.utils import timezone

 
SECRET_KEY = 'django-insecure-5+lxe@-a@rg(x9unkh%ce)q=*qm*aj6h^d&-@^7=oz68s*@m3p'
DATETIME_FORMAT = "%Y-%m-%d %H:%M:%S.%f"  

# <--------------------------------Trending Groups------------------------------------------------->

def get_hot_group(request):
    limit = int(request.GET.get("limit", 6))  
    seven_days_ago = now() - timedelta(days=7)

    hot_groups = Groups.objects.all()  
    group_data = []

    for g in hot_groups:
        try:
            group_time = datetime.strptime(g.group_time, DATETIME_FORMAT)
            group_time = make_aware(group_time)
        except (ValueError, TypeError):
            continue   

        if group_time < seven_days_ago:
            continue  

        days_active = max((now() - group_time).total_seconds() / 86400, 1)
        growth_rate = g.user_quantity / days_active  

        group_data.append({
            "id": g.id,
            "category": g.group_category,
            "name": g.name,
            "image": g.group_image.name,
            "desc": g.group_desc,
            "growth_rate": growth_rate,
              "users_number":g.user_quantity
        })

    top_hot_groups = sorted(group_data, key=lambda x: x["growth_rate"], reverse=True)[:limit]

    return JsonResponse({"data": top_hot_groups}, safe=False)


# <--------------------------------Trending Groups End here-------------------------------------------------> 
#    

# <--------------------------------Calculation of user's Intrests Starts Here------------------------------------------------->
def calculate_intrest_ratios(data):
    category_time = {}
    for entry in data:
        category = entry["category"]
        time_spent = entry["time_spent"]
        category_time[category] = category_time.get(category, 0) + time_spent
    categories = list(category_time.keys())
    if len(categories) == 1:
        return [{"category": categories[0], "ratio": 100}]
    total_time = sum(category_time.values())
    return [{"category": cat, "ratio": round((time / total_time) * 100, 2)} for cat, time in category_time.items()]

# <--------------------------------Calculation of user's Intrests Ends Here------------------------------------------------->


# <--------------------------------Users with similar intrests Starts Here------------------------------------------------->

@csrf_exempt
def find_similar_users(request):
    data = json.loads(request.body)
    username = data['username']
    user = User.objects.get(username=username)
    user_time = {item["category"]: Decimal(item["time_spent"]) for item in user.time_spent}
    user_joined_groups = set(user.joined)  
    similarity_range = Decimal("0.2")
    all_similar_groups = [] 
    for other_user in User.objects.exclude(username=username):
        other_time = {item["category"]: Decimal(item["time_spent"]) for item in other_user.time_spent}
        other_joined_groups = set(other_user.joined) 
        if any(
            category in other_time and 
            user_time[category] * (1 - similarity_range) <= other_time[category] <= user_time[category] * (1 + similarity_range)
            for category in user_time
        ):
            new_groups = list(other_joined_groups - user_joined_groups)

            for group_id in new_groups:
                try:
                    group = Groups.objects.get(id=group_id)
                    group_data = {
                        'id': group.id,
                        'category': group.group_category,  
                        'name': group.name,
                        'image': group.group_image.name,
                        'desc': group.group_desc,
                        "users_number":group.user_quantity
                    }
                    if group_data not in all_similar_groups:
                        all_similar_groups.append(group_data)
                except Groups.DoesNotExist:
                    continue 
        if len(all_similar_groups) >= 100:
            break
    user.similar_users = json.dumps(all_similar_groups[:100]) 
    user.save()

    return JsonResponse({"data": all_similar_groups[:100]}, safe=False)

# <--------------------------------Users with similar intrests Ends Here------------------------------------------------->




# <--------------------------------You Might Like Recommandations Starts Here------------------------------------------------->


def get_recommended_groups(username):
    try:
        user = get_object_or_404(User, username=username)
        time_spent_data = user.time_spent  
        if not time_spent_data:
            return JsonResponse({"error": "No activity data found for this user.",'time':False}, status=400)
        total_time = sum(entry["time_spent"] for entry in time_spent_data)
        if total_time == 0:
            return JsonResponse({"error": "User has no recorded activity time."}, status=400)
        percentage_data = {entry["category"]: round((entry["time_spent"] / total_time) * 100, 2) for entry in time_spent_data}
        return {'data':percentage_data}
    except Exception as e:
        return JsonResponse({"error": f"An error occurred: {str(e)}"}, status=500)

# <--------------------------------You Might Like Recommandations Starts Here------------------------------------------------->


# <--------------------------------Basic Renders Starts Here------------------------------------------------->

@csrf_exempt
def home(request):
    query = Groups.objects.all()
    return render(request, 'index.html',{'query':query})


def login(request):
        return render(request,'login.html')

def register(request):
        return render(request,'register.html')


def landing(request):
        return render(request,'landing.html')

# <--------------------------------Basic Renders Ends Here------------------------------------------------->


# <--------------------------------User Authentication Here---------------------------------------->

def create_tokens(username):
       access_payload = {
           "username": username,
           "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=15),
       }         
       refresh_payload = {
           "username": username,
           "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7),
       }
       access_payload = jwt.encode(access_payload, SECRET_KEY, algorithm="HS256")
       refresh_payload = jwt.encode(refresh_payload, SECRET_KEY, algorithm="HS256")

       return  access_payload,refresh_payload
       

@csrf_exempt
def user_save(request):
    if request.method=='POST':
        name=request.POST.get('name')
        username=request.POST.get('username')
        email=request.POST.get('email')
        password=request.POST.get('password')
        date= datetime.now()
        if User.objects.filter(username=username).exists() or  User.objects.filter(email=email).exists():
                return JsonResponse({'status': 400, 'error': 'User already exists'}) 
        query = User(name=name,username=username,email=email,password=password,date=date.strftime("%d-%B-%Y"))
        query.save()
        return JsonResponse({'status': 200, 'username':username})
    
    
@csrf_exempt   
def user_intrest(request):
   if request.method=='POST':
       data = json.loads(request.body)
       intrest = data['intrest']
       user = data['username']
       user = User.objects.get(username=user)
       time = []
       if user:
           for i in intrest:
              timeData = {
                 'category':i,
                 'time_spent':10.00
              }   
              time.append(timeData)
           user.intrest=intrest
           user.time_spent = time
           user.joined = []
           user.save()
       print({'intrest':intrest,'user':user})
       return render(request, 'intrests.html')    
   else:
       return render(request, 'intrests.html')  


@csrf_exempt
def login_user(request):
    if request.method == 'POST':  
        try:
            email = request.POST.get('email')
            password = request.POST.get('password')
            user = User.objects.get(email=email)

            if user and user.password == password:
                # Generate JWT Token
                refresh_token,access_token = create_tokens(user.username)
                
                response = JsonResponse({'status':True,'username':user.username})
                response.set_cookie(
                    key='access_token',
                    value=access_token,
                    secure=False,
                )
                response.set_cookie(
                    key='refresh_token',
                    value=refresh_token,
                    secure=False,
                )
                return response
            return JsonResponse({'status': False, 'error': 'Invalid credentials'})
        except Exception as e:   
            return JsonResponse({'status': False, 'error': str(e)})
        
def refresh_token_view(request):
        refresh_token = request.COOKIE.get('refresh_token')
        if not refresh_token:
              return JsonResponse({'status':False,'message':'refreshtoken not found'})
        decoded_token = jwt.decode(refresh_token, SECRET_KEY, algorithms=['HS256']) 
        access_token,_ =  create_tokens(decoded_token['username'])  
        response = JsonResponse({'status':True})
        response.set_cookie()
        response.set_cookie(
                    key='access_token',
                    value=access_token,
                    secure=False,
                )
        return response

# <------------------------------Authentication Ends Here------------------------------------->


# <------------------------------Groups and chats save Starts Here------------------------------------->


def groups(request):
    if request.method == 'POST':    
      name = request.POST.get('group-name')
      desc = request.POST.get('group-description')
      category = request.POST.get('group-category')
      image = request.FILES['group-image']
      
      # user checkpoint
      group =  User.objects.filter(name=name).first()
      if Groups.objects.filter(name=name).exists():
                return JsonResponse({'status': 400, 'error': 'Group already exists'})
      time = datetime.now()
      default_storage.save(f'app/static/group_dp/{image.name}', image)
      query = Groups(name=name, group_desc=desc, group_category= category, group_image=image.name,user_quantity = 0, group_time=time)
      query.save()
      return JsonResponse({"Status":200, "message":"group saved"})
    else:
        return render(request, 'create_group.html')  
      

@csrf_exempt
def save_chats(request):
     if request.method == 'POST':
          # data = request.body
          sender = request.POST['sender']
          group = request.POST['group']
          message = request.POST.get('message')
          attachment = request.FILES.get('file',None)
          if attachment != None:
             default_storage.save(f'app/static/uploads/{attachment.name}', attachment)
             if message != '':
               query = Messages(sender=sender,groupname=group,message=message,attachfile=attachment.name)
             else:   
               query = Messages(sender=sender,groupname=group,message='null',attachfile=attachment.name)
                  
          else: 
                 query = Messages(sender=sender,groupname=group,message=message,attachfile='null')
          query.save()
          return JsonResponse({'status':200, 'message':'message saved'})
     else:
          return JsonResponse({'error':"method not allowed"})

# <------------------------------Groups and chats save Ends Here------------------------------------->


# <------------------------------Fetch Chats, Unsent Message, update message save Starts Here------------------------------------->


@csrf_exempt
def get_chats(request):
     if request.method == 'POST':
          data = json.loads(request.body)
          group = data['group']
          query = Messages.objects.filter(groupname=group)
          all_messages = []
          for i in query:
               attachedFile = 'null'
               if i.attachfile:
                   attachedFile=  i.attachfile
               messages = {
                    'id':i.id,
                    'message':i.message,
                    'sender':i.sender,
                    'group':i.groupname, 
                    'file': attachedFile,
                    'unsent':i.unsent
               }

               all_messages.append(messages)
          return JsonResponse(all_messages, safe=False)     
     else:
          return JsonResponse({'error':"method not allowed"})  

# Unsend Message 

@csrf_exempt
def unsend(request):
     data = json.loads(request.body)
     query = Messages.objects.filter(id=data['id']).first()
     if query:
          query.unsent=True
          query.save()
          return JsonResponse({'unsent':True})   
     else:
        return  JsonResponse({'unsent':False})    
     
# Update Message 

@csrf_exempt
def update_message(request):
     data = json.loads(request.body)
     message = data['message']
     query = Messages.objects.filter(id=data['id']).first()
     if query:
          query.edit=True
          query.message = message
          query.save()
          return JsonResponse({'edit':True})   
     else:
        return  JsonResponse({'edit':False})     

# <------------------------------Fetch Chats, Unsent Message, update message save Ends Here------------------------------------->


# <------------------------------Fetch groups, search groups Starts Here------------------------------------->


@csrf_exempt
def getGroup(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data['username']
            userQuery = User.objects.get(username=username)
            groups = []
            for interest in userQuery.intrest:
                groupQuery = Groups.objects.filter(group_category=interest)
                for group in groupQuery:
                    groups.append({
                        'id':group.id,
                        'name': group.name,
                        'category': group.group_category,
                        'image': group.group_image.name, 
                        'desc': group.group_desc,  
                    })
            return JsonResponse({"data": groups}, safe=False)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=400)
    

@csrf_exempt
def groupSearch(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name') 
            if not name:
                return JsonResponse({'error': 'Name parameter is required'}, status=400)
            query = Groups.objects.filter(name__startswith=name)
            groups = [{"id":group.id,"name": group.name, "image": getattr(group.group_image, "name", ""), "desc": group.group_desc} for group in query]
            return JsonResponse({'data': groups})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)

# <------------------------------Fetch groups, search groups Ends Here------------------------------------->


# <------------------------------Join groups and left groups here start Here------------------------------------->
        

@csrf_exempt
def joined(request):
  if request.method=='POST':  
    data = json.loads(request.body)
    username = data['username']
    group_id = data['group_id']
    userQuery = User.objects.get(username=username)
    grouQuery = Groups.objects.get(id=group_id)
    if grouQuery.user_quantity != None:
         grouQuery.user_quantity = grouQuery.user_quantity+1
    else: 
        grouQuery.user_quantity = 1
    grouQuery.save()
    saving_id = []
    saving_intrest=[]   

    if userQuery.joined == None:
        saving_id.append(group_id)
        userQuery.joined = saving_id
        userQuery.save()
    else:
        if userQuery.joined != []: 
         for x in userQuery.joined:
            saving_id.append(x)
        saving_id.append(group_id)
        userQuery.joined=saving_id
        userQuery.save()   

    if userQuery.intrest == None:
          saving_intrest.append(grouQuery.group_category)
          userQuery.intrest=saving_intrest
          userQuery.save()
    else:
           for i in userQuery.intrest:
             saving_intrest.append(i)
           saving_intrest.append(grouQuery.group_category)
           userQuery.intrest=saving_intrest
           userQuery.save()      

    return JsonResponse({'data':"data"})
  

@csrf_exempt
def leaveGroup(request):
  if request.method=='POST':  
    data = json.loads(request.body)
    username = data['username']
    group_id = data['group_id']
    userQuery = User.objects.get(username=username)
    grouQuery = Groups.objects.get(id=group_id)
    result=False
    saving_id = []
    for i in userQuery.joined:
         saving_id.append(i)
    if group_id in saving_id:
        saving_id.remove(group_id)
        userQuery.joined=saving_id
        userQuery.save()    
        if grouQuery.user_quantity != None or 0:
            grouQuery.user_quantity = grouQuery.user_quantity-1
        else: 
            grouQuery.user_quantity = 0
        grouQuery.save()    
        return JsonResponse({"result":True}) 
    return JsonResponse({'result':False})
  

@csrf_exempt
def renderJoined(request):
   if request.method=='POST':
    data = json.loads(request.body)
    username = data['username']
    userQuery = User.objects.get(username=username) 
    joined_data=[]
    if userQuery.joined == None:
      return JsonResponse({'status':False})
    else: 
      for i in userQuery.joined:
        groupQuery=Groups.objects.get(id=i)
        group_data = {"id":groupQuery.id,"category":groupQuery.group_category,"name": groupQuery.name, "image": getattr(groupQuery.group_image, "name", ""), "desc": groupQuery.group_desc,  "users_number":groupQuery.user_quantity}
        joined_data.append(group_data)
      return JsonResponse(joined_data, safe=False)  

# <------------------------------Join groups and left groups here Ends Here------------------------------------->


# <------------------------------Join groups and left groups here Ends Here------------------------------------->

@csrf_exempt
def renderIntrest(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        try:
            userQuery = User.objects.get(username=username)
        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        joined_groups = set(map(int, userQuery.joined)) if userQuery.joined else set()
        joined_data = []
        total_groups = 12 
        recommended_groups = get_recommended_groups(username=username)
        time_based_groups = recommended_groups.get('time', None)
        if time_based_groups:
            for group in time_based_groups:
                joined_data.append({
                    "id": group["id"],
                    "category": group["category"],
                    "name": group["name"],
                    "image": group.get("image", ""),
                    "desc": group["desc"],
                      "users_number":group['users_number']
                })
        if len(joined_data) < total_groups:
            interest_percentages = recommended_groups.get('data', {})
            category_group_counts = {
                category: max(1, round((percentage / 100) * total_groups))
                for category, percentage in interest_percentages.items()
            }
            for category, count in category_group_counts.items():
                groupQuery = Groups.objects.filter(group_category=category).exclude(id__in=joined_groups)[:count]
                for group in groupQuery:
                    joined_data.append({
                        "id": group.id,
                        "category": group.group_category,
                        "name": group.name,
                        "image": getattr(group.group_image, "name", ""),
                        "desc": group.group_desc,
                          "users_number":group.user_quantity
                    })
        random.shuffle(joined_data)
        return JsonResponse({"data": joined_data[:total_groups]}, safe=False)
    
    
# check joined group

@csrf_exempt
def checkJoined(request):
    if request.method=='POST':
       data = json.loads(request.body)
       username = data['username']
       group_id = data['group_id']
       userQuery = User.objects.get(username=username)
       result=False
       if userQuery.joined == None:
         return JsonResponse({'result':False})
       else:
         for i in userQuery.joined:
           if i in group_id:
               result = True
         return JsonResponse({'result':result})   
       
# <------------------------------Intrests render here Ends Here------------------------------------->

 
# <------------------------------User screen time analyze here------------------------------------->


@csrf_exempt
def time_user_spent(request):
    if request.method == 'POST':  
        data = json.loads(request.body)
        username = data.get('username')
        group_id = data.get('group_id')
        new_time_spent = data.get('time_spent')
        groupQuery=Groups.objects.get(id=group_id)
        try:
            query = User.objects.get(username=username)
            timeData = query.time_spent if query.time_spent else []

            updated = False
            for x in timeData:
                if x['category'] == groupQuery.group_category:
                    x['time_spent'] += new_time_spent
                    updated = True
                    break

            if not updated:
                timeData.append({"category":groupQuery.group_category, "time_spent": new_time_spent})

            query.time_spent = timeData   
            query.save()
            return JsonResponse({'message': 'Time spent updated successfully'})

        except ObjectDoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
            
    return JsonResponse({'error': 'Invalid request'}, status=400)


@csrf_exempt
def requestGroupData(request):
    if request.method=='POST':
        data = json.loads(request.body)
        group_id=data['group_id']
        groupQuery = Groups.objects.get(id=group_id)
        if groupQuery:
            return JsonResponse({"name":groupQuery.name,"desc":groupQuery.group_desc,"image":groupQuery.group_image.name,"id":groupQuery.id})
        else:
            return JsonResponse([],safe=False)
    else:
      return  JsonResponse({'status':'invalid request'})
    
# <------------------------------User screen time analyze Ends here------------------------------------->



# ---------------------------------------- Recommendation Notification Handler--------------------------------------
 
def convert_to_percentage(time_data):
    if not time_data:
        return []
    
    total_time = sum(item.get('time_spent', 0) for item in time_data)
    if total_time == 0:
        return []

    return [{**item, 'time_spent': round((item['time_spent'] / total_time) * 100, 2)} for item in time_data]

def get_significant_interests(time_data, threshold=60):
    return [item['category'] for item in convert_to_percentage(time_data) if item['time_spent'] >= threshold]

def get_hot_groups(interests):
    try:
        response = requests.get('http://localhost:8000/getHot/')
        response.raise_for_status()  
        hot_data = response.json().get('data', [])
        return [group for group in hot_data if group.get('category') in interests]
    except (requests.RequestException, KeyError, json.JSONDecodeError):
        return []

 

@csrf_exempt
def top_interest_notification(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    try:
        data = json.loads(request.body)
        username = data.get('username')
        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)
        user = User.objects.get(username=username)
        user_interests = get_significant_interests(user.time_spent)
        if not user_interests:
            return JsonResponse({'notify': False, 'hot_group': None})
        hot_groups = get_hot_groups(user_interests)
        if not hot_groups:
            return JsonResponse({'notify': False, 'hot_group': None})
        top_hot_group = max(hot_groups, key=lambda g: g.get('growth_rate', 0))
        notification, created = IntrestNotifition.objects.get_or_create(
            groups=top_hot_group['id'], 
            defaults={'users_recived': json.dumps([user.id])}
        )
        if not created:
            users_received = json.loads(notification.users_recived or '[]')
            if user.id in users_received:
                return JsonResponse({'notify': False, 'hot_group': None})
            users_received.append(user.id)
            notification.users_recived = json.dumps(users_received)
            notification.save()
        return JsonResponse({'notify': True, 'hot_group': top_hot_group})
    except ObjectDoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ---------------------------------------- Recommendation Notification Ends--------------------------------------

    
    
# ----------------------------------------ProFile Managment Section Here--------------------------------------


@csrf_exempt
def profile(request):
    return render(request, 'profile.html')


@csrf_exempt
def profile_Handling(request):
   if request.method=='POST':
       data = json.loads(request.body)
       username = data['username']
       query = User.objects.get(username=username)
       data = {'name':query.name,'email':query.email,'password':query.password}
       return JsonResponse({'user':data})
   else: 
       return JsonResponse({'user':'False'})
   

@csrf_exempt
def update_profile(request):
   data = json.loads(request.body)
   username = data.get('username')
   name = data.get('name')          
   email = data.get('email')          
   password = data.get('password') 
   user = User.objects.get(username=username)
   if user:
       user.name = name
       user.email =email
       user.password=password
       user.save()
   else:
       return JsonResponse({'user':False})    
   print(name)         
   return JsonResponse({'user':False})    
  
  


@csrf_exempt
def user_intrest_category(request):
   data = json.loads(request.body)
   username = data.get('username')
   user = User.objects.get(username=username)
   ratio_data = calculate_intrest_ratios(user.time_spent)
   print(ratio_data)
   return JsonResponse({'data':ratio_data})


@csrf_exempt
def update_user_intrest_category(request):
    data = json.loads(request.body)
    username = data['username']
    ratio_data = data['data']

    user = User.objects.get(username=username)
    time_spent_data = user.time_spent   
    total_time = sum(entry["time_spent"] for entry in time_spent_data)

    updated_time_data = [
        {"category": entry["category"], "time_spent": round((entry["ratio"] / 100) * total_time, 3)}
        for entry in ratio_data
    ]

    user.time_spent = updated_time_data
    user.save()

    return JsonResponse({"updated_data": updated_time_data}, status=200)


@csrf_exempt
def my_creations(request):
    data = json.loads(request.body)
    username = data['username']
    groupQuery = Groups.objects.filter(creator=username)
    group_data=[]
    for x in groupQuery:
       data= {
      'category': x.group_category,
      'name': x.name,
      'desc': x.group_desc,
      'id': x.id,
      'image': x.group_image.name,
    }
       group_data.append(data)
    return JsonResponse(group_data,safe=False)   

# ----------------------------------------ProFile Managment Section Ends Here--------------------------------------



# ----------------------------------------Update and Delete operations for Groups Here--------------------------------------


@csrf_exempt
def update_groups(request):
    id = request.POST.get('id')
    name = request.POST.get('name')
    desc = request.POST.get('desc')
    image = request.FILES['image']
    default_storage.save(f'app/static/group_dp/{image.name}', image)
    groupQuery = Groups.objects.get(id=id)
    groupQuery.name = name
    groupQuery.group_desc = desc
    groupQuery.group_image = image.name
    groupQuery.save()
    return JsonResponse({'status':True})
  
  
@csrf_exempt
def delete_groups(request):
    data = json.loads(request.body)
    id = data['id']
    creator=data['creator']
    group = Groups.objects.get(id=id)
    group.delete()
    other_groupsQuery = Groups.objects.filter(creator=creator)
    other_groups=[]
    for x in other_groupsQuery:
         data= {
      'category': x.group_category,
      'name': x.name,
      'desc': x.group_desc,
      'id': x.id,
      'image': x.group_image.name,
    }
         other_groups.append(data)
    return JsonResponse(other_groups, safe=False)     

# ----------------------------------------Update and Delete operations for Groups Ends Here--------------------------------------



# ----------------------------------------Rank System Handlers Here--------------------------------------

def collect_user_groups(username):
    try:
        username = username
        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)
        groups = Groups.objects.filter(creator=username)
        all_groups = []
        grouped_data = {}
        for x in groups:
            category = x.group_category
            group_info = {
                'id': x.id,
                'category': category,
                'user_quantity': x.user_quantity,
                'group_date': x.group_time,
                'weekly_progress':x.weekly_data,
                'creator':x.creator
            }
            all_groups.append(group_info)
            if category not in grouped_data:
                grouped_data[category] = {
                    'category': category,
                    'data': []
                }
            grouped_data[category]['data'].append(group_info)
        return {'data':list(grouped_data.values())}
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
  

# This analyze data from collected user groups and convert to Points
 
@csrf_exempt
def data_to_points(username):
    username = username
    data = collect_user_groups(username)['data']
    if not isinstance(data, list) or not data:
        return JsonResponse({'error': 'Invalid input format'}, status=400)
    user_points = {}
    for group in data:
        for entry in group.get('data', []):
            creator = entry.get('creator')
            if not creator:
                continue
            user_quantity = entry.get('user_quantity', 0)
            weekly_progress = entry.get('weekly_progress', [])
            if not weekly_progress:
                continue
            last_week_users = weekly_progress[-1]
            difference = user_quantity - last_week_users
            points_earned = difference * 10 if difference > 0 else difference * 15
            user_points[creator] = user_points.get(creator, 0) + points_earned
    final_results = []
    for creator, points in user_points.items():
        user = User.objects.filter(username=creator).first()
        if user and user.points not in [None, 0]:
            final_points = max(0, user.points + points)
            user.points = final_points
            user.save()
            final_results.append({'user': creator, 'points': final_points})        
    return JsonResponse(final_results, safe=False)

# ----------------------------------------Rank System Handlers Ends Here--------------------------------------



# ----------------------------------------Rank System Handlers Starts Here--------------------------------------

# Define rank thresholds
RANK_THRESHOLDS = {
    'newcomer': {'min': 0, 'max': 15000},
    'elite': {'min': 15000, 'max': 30000},
    'trend raiser': {'min': 30000, 'max': 100000},
    'trend master': {'min': 100000, 'max': float('inf')}  
}

def calculate_rank_progress(points):
    """Calculate rank and progress based on points."""
    try:
        points = int(points)
        current_rank = 'newcomer'
        for rank, threshold in RANK_THRESHOLDS.items():
            if threshold['min'] <= points < threshold['max']:
                current_rank = rank
                break
        if current_rank == "trend master":
            return current_rank, 100.0  
        thresholds = RANK_THRESHOLDS[current_rank]
        range_size = thresholds['max'] - thresholds['min']
        points_in_range = points - thresholds['min']
        progress = min(round((points_in_range / range_size) * 100, 1), 99.9)
        return current_rank, progress
    except (ValueError, TypeError):
        return 'newcomer', 0.0



@csrf_exempt
def points_to_rank(request):
    """Calculate and return user's rank based on their points."""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        if not username:
            return JsonResponse({'error': 'Username is required'}, status=400)
        groups_data = collect_user_groups(username)
        if 'error' in groups_data:
            return JsonResponse({'error': groups_data['error']}, status=groups_data.get('status', 500))
        groups = groups_data.get('data', [])
        if not groups:
            return JsonResponse({'error': 'No groups found for user'}, status=404)
        total_points = 0
        for group in groups:
            for entry in group.get('data', []):
                creator = entry.get('creator')
                if creator != username:
                    continue
                try:
                    user_quantity = int(entry.get('user_quantity', 0))
                    weekly_progress = entry.get('weekly_progress', [])
                    if not weekly_progress:
                        continue
                    last_week_users = int(weekly_progress[-1])
                    difference = user_quantity - last_week_users
                    points = difference * 10 if difference > 0 else difference * -15
                    total_points += points
                except (ValueError, TypeError, IndexError):
                    continue
        user = User.objects.filter(username=username).first()
        if not user:
            return JsonResponse({'error': 'User not found'}, status=404)
        try:
            current_points = int(user.points) if user.points is not None else total_points
        except (ValueError, TypeError):
            current_points = total_points
        rank, progress = calculate_rank_progress(current_points)
        result = [{
            'user': username,
            'rank': rank.capitalize(),
            'progress': progress,
            'points': current_points
        }]
        user_data = User.objects.get(username=username)
        user_data.rank_data=rank.capitalize()
        user_data.points=current_points
        user_data.save()
        return JsonResponse({"data":result})

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)