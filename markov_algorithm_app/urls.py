from django.conf.urls import url, include
from turing_machine_app import views
from django.views.generic import TemplateView
from markov_algorithm_app import views
import json

urlpatterns = [
    url(r'^$', TemplateView.as_view(template_name='markov_algorithm/index.html'), name="markov_algorithm"),
    url(r'^code_handler$', views.code_handler, name='code_handler'),
    url(r'^load_handler', views.load_handler, name='load_handler'),
    url(r'^save', views.save, name='save'),
    url(r'^get', views.get, name='get'),
    url(r'^remove_from_examples', views.remove_from_examples, name='remove_from_examples'),
    url(r'^send_markov', views.send_markov, name='send_markov'),
]
