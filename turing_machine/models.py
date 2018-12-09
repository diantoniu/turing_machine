from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User

class Turing_algorithms(models.Model):
    """
    Saves alorithm to user Algorithms
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
    title = models.TextField()
    algorithm = models.TextField()

    def __str__(self):
        return '%s (%s)' \
               % (self.title, self.user.username)

class Markov_algorithms(models.Model):
    """
    Saves alorithm to user Algorithms
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, default=None)
    title = models.TextField()
    algorithm = models.TextField()

    def __str__(self):
        return '%s (%s)' \
               % (self.title, self.user.username)