# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

# Create your models here.

from django.contrib.gis.db import models as gis_models
from django.contrib.gis import geos

from urllib2 import URLError
from django.db.models import Max
from django.utils.html import escape
import googlemaps
from django.utils import timezone

from django.contrib.auth.models import User

class Tag(models.Model):
    name = models.CharField(max_length=20)

    def __unicode__(self):
        return self.name

class Event(models.Model):
    user = models.ForeignKey(User)
    # The name of an event, which is used to show on the map
    brief = models.CharField(max_length=200)

    # The detail information of an event, which is used to show when user click
    # "learn more"
    detail = models.TextField(max_length=1000)
    tag = models.ForeignKey(Tag)
    contact = models.CharField(max_length=50)

    last_changed = models.DateTimeField(auto_now=True)

    address = models.CharField(max_length=400)
    location = gis_models.PointField(u"longitude/latitude",
                                     geography=True, blank=True, null=True)
    gis = gis_models.GeoManager()
    objects = models.Manager()

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __unicode__(self):
        return self.brief


    # Returns all recent additions and deletions to the to-do list.
    @staticmethod
    def get_changes(time="1970-01-01T00:00+00:00"):
        return Event.objects.filter(last_changed__gt=time).distinct()

    @staticmethod
    def get_max_time():
        return Event.objects.all().aggregate(Max('last_changed'))['last_changed__max'] or "1970-01-01T00:00+00:00"

    def save(self, **kwargs):
        
        address = u'%s' % (self.address)
        gmaps = googlemaps.Client(key='AIzaSyAbjKQTG3KAxa9lEuBHShJ8cA9H7VtCZFQ')
        address = address.encode('utf-8')
        georesult = gmaps.geocode(address)[0]['geometry']['location']
        
        point = "POINT(%s %s)" % (georesult['lng'],georesult['lat'] )
        self.location = geos.fromstr(point)
        super(Event, self).save()
    
    def is_finished(self):
        if self.start_time < timezone.now():
            return True
        else:
            return False

class Profile(models.Model):
    user = models.OneToOneField(User)
    tags = models.ManyToManyField(Tag)
    favorites = models.ManyToManyField(
        Event,
        related_name='+',
    )
    
    def __unicode__(self):
        return self.user
