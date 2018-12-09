from django.shortcuts import render
from django.http import HttpResponse
import json
from markov_algorithm_app.helper import *
from markov_algorithm_app.run_markov_algorithm import *
from turing_machine.models import *

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


def load_handler(request):  # return is_ended_correctly (T/F), cycled(T/F), exeeded_am_of_steps(T/F), satates
    input = json.loads(request.GET['input']);
    states = json.loads(request.GET['states']);
    result_states = run_code(states, input);
    result_states_json = json.dumps(result_states)
    return HttpResponse(result_states_json)


def send_markov(request):
    email = json.loads(request.GET['mail']);
    topic = json.loads(request.GET['topic']);
    code_str = json.loads(request.GET['code']);
    try:
        send_mail(topic, code_str, "Sinceraly, MA",
                  [email], fail_silently=False)
        return HttpResponse("True")
    except Exception:
        return HttpResponse("False")


def save(request):
    try:
        title_str = json.loads(request.GET['title']);
        code_str = json.loads(request.GET['code']);
        Markov_algorithms.objects.update_or_create(
            user=request.user,
            algorithm=code_str,
            title=title_str
        )
    except Exception as e:
        pass;

    return HttpResponse("")


def get(request):
    res = Markov_algorithms.objects.filter(
        user=request.user,
    ).values('id', 'title', 'algorithm')
    res_list = list(res)
    res_json = json.dumps(res_list)
    return HttpResponse(res_json)

def remove_from_examples(request):
    example = json.loads(request.GET['example']);
    print(example)
    Markov_algorithms.objects.filter(title=example).delete()
    return HttpResponse('True')

