from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import  views

urlpatterns=[
# <----------------------------------------Main Endpoints here-------------------------------------->
    path('home/', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('user_save/', views.user_save, name='user_save'),
    path('notify/', views.top_interest_notification, name='top_interest_notification'),
    path('group_save/', views.groups, name='group_save'),
    path('save_chats/', views.save_chats, name='save_chats'),
    path('get_chats/', views.get_chats, name='get_chats'),
    path('login/', views.login, name='login'),
    path('unsend_message/', views.unsend, name='unsend'),
    path('update_message/', views.update_message, name='update_message'),
    path('user_intrest/', views.user_intrest, name='user_intrest'),
    path('getGroup/', views.getGroup, name='getGroup'),
    path('groupSearch/', views.groupSearch, name='groupSeach'),
    path('groupJoined/', views.joined, name='joined'),
    path('renderJoined/', views.renderJoined, name='renderJoined'),
    path('renderIntrest/', views.renderIntrest, name='renderIntrest'),
    path('checkJoined/', views.checkJoined, name='checkJoined'),
    path('leaveGroup/', views.leaveGroup, name='leaveGroup'),
    path('landing/', views.landing, name='landing'),
    path('time_user_spent/', views.time_user_spent, name='time_user_spent'),
    path('requestGroupData/', views.requestGroupData, name='requestGroupData'),
    path('find_similar_users/', views.find_similar_users, name='find_similar_users'),
    path('getHot/', views.get_hot_group, name='get_hot_group'),
    path('login_user/', views.login_user, name='login_user'),
    
# <----------------------------------------Profile Managment Urls-------------------------------------->
 
    path('profile/', views.profile, name='profile'),
    path('profile_handling/', views.profile_Handling, name='profile_Handling'),
    path('update_profile/', views.update_profile, name='update_profile'),
    path('user_intrest_category/', views.user_intrest_category, name='user_intrest_category'),
    path('update_user_intrest_category/', views.update_user_intrest_category, name='update_user_intrest_category'),
    path('my_creations/', views.my_creations, name='my_creations'),

# <----------------------------------------Update and Delete operations for Groups-------------------------------------->
 
    path('update_groups/', views.update_groups, name='update_groups'),
    path('delete_groups/', views.delete_groups, name='delete_groups'),

# <----------------------------------------Rank System Endpoints-------------------------------------->

    path('points_to_rank/', views.points_to_rank, name='points_to_rank'),

# <----------------------------------------JWT endpoints Endpoints-------------------------------------->

    path("refresh_token_view/", views.refresh_token_view, name="refresh_token_view"),

    

] 