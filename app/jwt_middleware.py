import jwt
from django.http import JsonResponse
from django.conf import settings

def jwt_required(view_func):
    def wrapper(request, *args, **kwargs):
        token = request.COOKIES.get("access_token") 
        
        if not token:
            print("No token found in cookies!")  
            return JsonResponse({"error": "Unauthorized"}, status=401)

        print("Token Found:", token) 

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])  
            print("Token Decoded Successfully:", payload) 
            request.user = payload  
        except jwt.ExpiredSignatureError:
            print("Token Expired!")
            return JsonResponse({"error": "Token expired"}, status=401)
        except jwt.InvalidTokenError as e:
            print("Invalid Token Error:", str(e))
            return JsonResponse({"error": "Invalid token"}, status=401)

        return view_func(request, *args, **kwargs)
    return wrapper
