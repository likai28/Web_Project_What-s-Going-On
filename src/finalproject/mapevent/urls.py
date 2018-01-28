"""finalproject URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from django.conf.urls import url
from django.contrib import admin
from django.contrib.auth.views import login, logout_then_login
from mapevent import views

urlpatterns = [
    url(r'^home$', views.home,name='home'),

    url(r'^add-event$',views.add_event,name='add_event'),
    url(r'^show-event/(?P<id>\d+)$', views.show_event, name='show_event'),

    url(r'^event-list$', views.event_list, name='event_list'),
    url(r'^favorites-list$', views.favorites_list, name='favorites_list'),
    url(r'^event-list-get-changes/$', views.event_list_get_changes),
    url(r'^event-list-get-changes/(?P<time>.+)/$', views.event_list_get_changes),
    url(r'^edit-event/(?P<id>\d+)/$',views.edit_event, name='edit_event'),
    url(r'^delete-event/(?P<id>\d+)$',views.delete_event, name='delete_event'),
    
    url(r'^get-events/(?P<longitude>.+)/(?P<latitude>.+)$', views.get_events),
    url(r'^get-changes/(?P<longitude>.+)/(?P<latitude>.+)/(?P<time>.+)$', views.get_changes),

    url(r'^register$',views.register, name='register'),
    url(r'^login', login, {'template_name':'login.html'}, name='login'),
    url(r'^logout$', logout_then_login, name='logout'),

    url(r'^recommend$', views.recommend, name='recommend'),
    url(r'^edit-profile$', views.edit_profile, name='edit-profile'),
    url(r'^like/(?P<id>\d+)$', views.like, name='like'),
    url(r'^stop_like/(?P<id>\d+)$', views.stop_like, name='stop_like'),
    url(r'^timeline$', views.timeline, name='timeline'),
    url(r'^filtertime$', views.filtertime, name='filtertime'),
]
