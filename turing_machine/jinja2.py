"""Jinja2 Environment for Joovie

Settings of Jinja2 Environment to resolve some Django features

For more information about Jinja2 environments and usage of it with Django
see links below:
    http://jinja.pocoo.org/docs/2.9/api/#basics
    https://docs.djangoproject.com/en/1.11/topics/templates/#django.template.backends.jinja2.Jinja2
    http://stackoverflow.com/questions/30701631/how-to-use-jinja2-as-a-templating-engine-in-django-1-8
"""
from jinja2 import Environment
from jinja2_pluralize import pluralize_dj
from django.contrib.staticfiles.storage import staticfiles_storage
from django.core.urlresolvers import reverse


def environment(**options):
    """
    Constructs Jinja2 Environment for Joovie 
    """
    env = Environment(**options)

    # global functions
    env.globals.update({
        'static': staticfiles_storage.url,
        'url_for': url_for,
    })

    # custom filter
    env.filters['attrs'] = custom_attributes
    env.filters['attributes'] = custom_attributes
    env.filters['pluralize'] = pluralize_dj

    # staticfiles sugar
    env.globals.update({
        'css': lambda url: staticfiles_storage.url('css/' + url),
        'js': lambda url: staticfiles_storage.url('js/' + url),
    })

    # TMDb URLs resolvers
    env.globals.update({
        'tmdb_image': tmdb_image,
    })

    # Helper functions
    env.globals.update({
        'video_url': video_url,
    })

    return env


# Functions

def url_for(view_name, *args, **kwargs):
    """
    Resolves Django URL to named view  
    """
    return reverse(view_name, args=args, kwargs=kwargs)


def tmdb_image(file_path, file_size='original'):
    """
    Resolves TMDb image URLs
    
    :param file_size can be string according to pattern 'w<size>',
    where <size> is integer pixel size of image, or just an integer width
    of image in pixels
    
    By default `file_size` is set to 'original', what means maximal (original)
    size of image
    
    If `file_size` assigned to 'set', returns complete src-set attribute result
    """

    # url constructor shortcut
    def get_url(base, size, path):
        if str(path) == '':
            return ''
        return ''.join((base, size, str(path)))

    base_url = 'https://image.tmdb.org/t/p/'

    # process set
    if file_size == 'set':
        src_set = ', '.join(map(
            (lambda size: get_url(base_url, size, file_path) + ' ' + size),
            ['w92', 'w154', 'w185', 'w342', 'w500', 'w780']))

        src_set += get_url(base_url, 'original', file_path)

        return src_set

    # fix integer sizes
    if type(file_size) is int:
        file_size = 'w' + str(file_size)

    # regular result
    return get_url(base_url, file_size, file_path)


def video_url(video):
    if video.site == 'YouTube':
        return 'https://youtube.com/watch?v=%s' % video.key


# Filters

def custom_attributes(value, **kwargs):
    """
    Pass widget attributes to form field
    such a class, placeholder and so on
    """

    return value.as_widget(attrs=kwargs)
