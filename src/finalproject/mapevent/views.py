# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate

# Create your views here.

from urllib2 import URLError

from django.contrib.gis import geos
from django.contrib.gis import measure
from django.shortcuts import render_to_response, render, redirect, get_object_or_404
from django.template import RequestContext
from django.template.loader import render_to_string


# from mapevent import forms

from mapevent.forms import *
from mapevent import models
from mapevent.models import *

import googlemaps

import datetime
import json

@login_required
def geocode_address(address):
    gmaps = googlemaps.Client(key='AIzaSyAbjKQTG3KAxa9lEuBHShJ8cA9H7VtCZFQ')
    address = address.encode('utf-8')
    georesult = gmaps.geocode(address)[0]['geometry']['location']
    return georesult

# get nearby events
@login_required
def get_events(request,longitude,latitude):
    current_point = geos.fromstr("POINT(%s %s)" % (longitude, latitude))
    distance_from_point = {'km': 10}
    events = Event.gis.filter(location__distance_lte=(current_point, measure.D(**distance_from_point)))
    events = events.distance(current_point).order_by('distance')
    ##return events.distance(current_point)
    max_time = Event.get_max_time()
    context = {"max_time":max_time, "events":events}
    return render(request, 'events.json', context, content_type='application/json')

# get newly updated nearby events
@login_required
def get_changes(request,longitude,latitude,time="1970-01-01T00:00+00:00"):
    max_time = Event.get_max_time()
    
    current_point = geos.fromstr("POINT(%s %s)" % (longitude, latitude))
    distance_from_point = {'km': 10}
    
    # first filter by distance
    events = Event.gis.filter(location__distance_lte=(current_point, measure.D(**distance_from_point)))
    
    # then filter by last_changed time
    events = events.filter(last_changed__gt=time).distinct()
    
    #order by distance
    events = events.distance(current_point).order_by('distance')
    
    context = {"max_time":max_time, "events":events}
    return render(request, 'events.json', context, content_type='application/json')

@login_required
def home(request):
    form = AddressForm()
    events = []
    if request.POST:
        form = AddressForm(request.POST)
        if form.is_valid():
            address = form.cleaned_data['address']
            location = geocode_address(address)
            if location:
                latitude, longitude = location['lat'], location['lng']
                events = get_events(longitude, latitude)

    return render(request, 'home.html',{'form':form, 'events':events})

@login_required
def add_event(request):
    context = {}
    if request.method == 'GET':
        context['res'] = "fail"
        return render(request, 'result.json', context, content_type='application/json')

    body = json.loads(request.body)

    tag_obj, created = Tag.objects.get_or_create(name=body['tag'])
    new_event = Event(brief=body['brief'],
                    detail=body['detail'],
                    tag=tag_obj,
                    address=body['address'],
                    contact=body['contact'],
                    user=request.user,
                    start_time=datetime.datetime.combine(datetime.datetime.strptime(body['start_date'], "%m/%d/%Y"), datetime.datetime.strptime(body['start_time'], "%I:%M%p").time()),
                    end_time=datetime.datetime.combine(datetime.datetime.strptime(body['end_date'], "%m/%d/%Y"), datetime.datetime.strptime(body['end_time'], "%I:%M%p").time()))
    new_event.save()
    context['res']="success"
    return render(request, 'result.json', context, content_type='application/json')

# Edit a event.
@login_required
def edit_event(request, id):
    context = {}
    if request.method == 'GET':
        context['res'] = "fail"
        return render(request, 'result.json', context, content_type='application/json')

    event = get_object_or_404(Event, id=id)

    body = json.loads(request.body)

    if 'brief' in body and body['brief'] != "":
        event.brief = body['brief']
        event.save()
    if 'detail' in body and body['detail'] != "":
        event.detail = body['detail']
        event.save()
    if 'tag' in body:
        tag_obj, created = Tag.objects.get_or_create(name=form.cleaned_data['tag'])
        event.tag=tag_obj
        event.save()
    if 'address' in body and body['address'] != "":
        event.address = body['address']
        event.save()
    if 'contact' in body and body['contact'] != "":
        event.contact = body['contact']
        event.save()
    if ('start_date' in body and body['start_date'] != ""):
        event.start_time = datetime.datetime.combine(datetime.datetime.strptime(body['start_date'], "%m/%d/%Y"), event.start_time.time())
        event.save()
    if ('start_time' in body and body['start_time'] != ""):
        event.start_time = datetime.datetime.combine(event.start_time.date(), datetime.datetime.strptime(body['start_time'], "%I:%M%p").time())
        event.save()
    if ('end_date' in body and body['end_date'] != ""):
        event.end_time = datetime.datetime.combine(datetime.datetime.strptime(body['end_date'], "%m/%d/%Y"), event.end_time.time())
        event.save()
    if ('end_time' in body and body['end_time'] != ""):
        event.end_time = datetime.datetime.combine(event.end_time.date(), datetime.datetime.strptime(body['end_time'], "%I:%M%p").time())
        event.save()

    context['res']="success"
    return render(request, 'result.json', context, content_type='application/json')

@login_required
def delete_event(request,id):
    errors =[]
    # Deletes post if the logged-in user has a post matching the id
    try:
        event_to_delete = Event.objects.get(id=id, user=request.user)
        event_to_delete.delete()
    except ObjectDoesNotExist:
        errors.append('The event did not exist in your event list.')
    events = Event.objects.filter(user = request.user)

    return redirect('/timeline')

def register(request):
    context = {}
    if request.method == 'GET':
        context['form'] = RegistrationForm()
        return render(request, 'register.html', context)

    form = RegistrationForm(request.POST)
    context['form'] = form
    if not form.is_valid():
        return render(request, 'register.html', context)
    
    user = User.objects.create_user(username=form.cleaned_data['username'], \
                                    email=form.cleaned_data['email'], \
                                    password=form.cleaned_data['password'])
    user.save()
    profile=Profile(user=user)
    profile.save()

    for tag in form.cleaned_data['tags']:
        tag_obj, created = Tag.objects.get_or_create(name=tag)
        profile.tags.add(tag_obj)
        profile.save()

    user = authenticate(username=form.cleaned_data['username'],\
                        password=form.cleaned_data['password'])

    login(request, user)
    return redirect('/')

@login_required
def edit_profile(request):
    context = {}
    if request.method == 'GET':
        context['res'] = "fail"
        return render(request, 'result.json', context, content_type='application/json')

    body = json.loads(request.body)
    tags = body['tags']

    profile = get_object_or_404(Profile, user=request.user)
    profile.tags.clear()
    profile.save()

    if tags == "Sports" or tags == "Study" or tags == "Entertainment" or tags == "Dating":
        save_tag(profile, tags)
    else:  
        for tag in tags:
            save_tag(profile, tag)
    context['res']="success"
    return render(request, 'result.json', context, content_type='application/json')

def save_tag(profile, tag):
    tag_obj, created = Tag.objects.get_or_create(name=tag)
    profile.tags.add(tag_obj)
    profile.save()

@login_required
def recommend(request):
    profile = get_object_or_404(Profile, user=request.user)
    tags = profile.tags.all()
    context = {}
    context['events'] = []
    ranked_events = Event.objects.all().filter(tag__in=tags).order_by('-start_time')[:10]
    for event in ranked_events:
        if event in profile.favorites.all():
            context['events'].append((event, 1))
        else:
            context['events'].append((event, 0))
    return render(request, 'recommendation.html', context)

# Show events in the side bar.
@login_required
def show_event(request, id):
    context = {}
    event = get_object_or_404(Event, id=id)
    context['event'] = event
    return render(request, 'event.json', context, content_type='application/json')

# Show all events in a new page. May be deleted.
@login_required
def event_list(request):
    context = {}
    # events = get_object_or_404(Event, user = request.user)
    events = Event.objects.filter(user = request.user).order_by('-last_changed')[:10]
    #return render(request, 'event_list.html', {'events' : events})
    return render(request, 'events.json', {'events' : events}, content_type='application/json')

def favorites_list(request):
    context = {}
    profile = get_object_or_404(Profile, user=request.user)
    events = profile.favorites.all().order_by('-start_time')
    return render(request, 'events.json', {'events' : events}, content_type='application/json')


def event_list_get_changes(request, time="1970-01-01T00:00+00:00"):
    if time == 'undefined':
        time="1970-01-01T00:00+00:00"
    max_time = Event.get_max_time()
    events = Post.get_changes(time)
    context = {"max_time":max_time, "events":events}
    return render(request, 'events.json', context, content_type='application/json')

def like(request, id):
    context = {}
    event = get_object_or_404(Event, id=id)
    profile = get_object_or_404(Profile, user=request.user)
    if not event in profile.favorites.all():
        profile.favorites.add(event)
        profile.save()
    context['res'] = "success"
    return render(request, 'result.json', context, content_type='application/json')

def stop_like(request, id):
    context = {}
    event = get_object_or_404(Event, id=id)
    profile = get_object_or_404(Profile, user=request.user)
    if event in profile.favorites.all():
        profile.favorites.remove(event)
        profile.save()
    context['res'] = "success"
    return render(request, 'result.json', context, content_type='application/json')

############################
# timeline related functions
############################
# Display all the events by start time.
@login_required
def timeline(request):
    profile = get_object_or_404(Profile, user=request.user)
    context = {}
    # events = get_object_or_404(Event, user = request.user)
    # events = Event.objects.filter(user = request.user).order_by('-start_time')[:10]
    context['events'] = []
    events = Event.objects.all().order_by('-start_time')
    for event in events:
        if event in profile.favorites.all():
            context['events'].append((event, 1))
        else:
            context['events'].append((event, 0))
    return render(request, 'timeline.html', context)

# Filter all the events by start time and end time.
@login_required
def filtertime(request):
    profile = get_object_or_404(Profile, user=request.user)
    context = {}
    context['events'] = []
    events = Event.objects.all().order_by('-start_time');

    if request.method == 'GET':
        context['form'] = FilterTimeForm()
        for event in events:
            if event in profile.favorites.all():
                context['events'].append((event, 1))
            else:
                context['events'].append((event, 0))
        return render(request, 'timeline.html', context)

    form = FilterTimeForm(request.POST)
    context['form'] = form
    if not form.is_valid():
        for event in events:
            if event in profile.favorites.all():
                context['events'].append((event, 1))
            else:
                context['events'].append((event, 0))
        return render(request, 'timeline.html', context)

    # start = datetime.datetime.combine(datetime.datetime.strptime(form.cleaned_data['start_date'], "%m/%d/%Y"), 
                                      # datetime.datetime.strptime(form.cleaned_data['start_time'], "%I:%M%p").time())
    # end = datetime.datetime.combine(datetime.datetime.strptime(form.cleaned_data['end_date'], "%m/%d/%Y"), 
                                    # datetime.datetime.strptime(form.cleaned_data['end_time'], "%I:%M%p").time())
    start = datetime.datetime.combine(form.cleaned_data['start_date'], form.cleaned_data['start_time'])
    end = datetime.datetime.combine(form.cleaned_data['end_date'], form.cleaned_data['end_time'])

    events = events.filter(start_time__gte = start).filter(end_time__lte = end).order_by('-start_time')
    for event in events:
        if event in profile.favorites.all():
            context['events'].append((event, 1))
        else:
            context['events'].append((event, 0))
    return render(request, 'timeline.html', context)