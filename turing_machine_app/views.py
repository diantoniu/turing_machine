from django.shortcuts import render
from django.http import HttpResponse
from django.views import View
import json
from turing_machine_app.helper import *
from turing_machine.models import *
from django.shortcuts import redirect
from django.core import serializers
import django
from django.conf import settings
from django.core.mail import send_mail


def code_handler(request):
    code_str = json.loads(request.GET['code']);
    states = code_parser(code_str);  # it could return or [states_from, states_to] or [False, line that caused error]
    if (states[0] == False):
        response = HttpResponse("Invalid syntax in line: " + str(states[1]) + ".")
        response.status_code = 403
        return response
    states_json = json.dumps(states)
    return HttpResponse(states_json)


def save(request):
    title_str = json.loads(request.GET['title']);
    code_str = json.loads(request.GET['code']);
    Turing_algorithms.objects.update_or_create(
        user=request.user,
        algorithm=code_str,
        title=title_str
    )
    return HttpResponse("success")


def send_turing(request):
    email = json.loads(request.GET['mail']);
    topic = json.loads(request.GET['topic']);
    code_str = json.loads(request.GET['code']);
    try:
        send_mail(topic, code_str, "Sinceraly, TM",
                  [email], fail_silently=False)
        return HttpResponse("True")
    except Exception:
        return HttpResponse("False")


def get(request):
    res = Turing_algorithms.objects.filter(
        user=request.user,
    ).values('id', 'title', 'algorithm')
    res_list = list(res)
    res_json = json.dumps(res_list)
    return HttpResponse(res_json)


def remove_from_examples(request):
    example = json.loads(request.GET['example']);
    print(example)
    Turing_algorithms.objects.filter(title=example).delete()
    return HttpResponse('True')
