from django.conf.urls import url, include
from turing_machine_app import views
from django.views.generic import TemplateView
from turing_machine_app import views
import json
from turing_machine_app.views import *

urlpatterns = [
    url(r'^$', TemplateView.as_view(template_name='turing_machine/index.jinja2'), name='turing_machine'),
    url(r'^code_handler$', views.code_handler, name='code_handler'),
    url(r'^save', views.save, name='save'),
    url(r'^get', views.get, name='get'),
    url(r'^remove_from_examples', views.remove_from_examples, name='remove_from_examples'),
    url(r'^send_turing', views.send_turing, name='send_turing'),

]
