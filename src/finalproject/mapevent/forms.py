from django import forms
from django.forms import ModelForm
from django.forms import Select

from django.contrib.auth.models import User
from models import *

TAG_CHOICES = (
    ("Study", "Study"),
    ("Sports", "Sports"),
    ("Entertainment", "Entertainment"),
    ("Dating", "Dating"),
)

# Create the form class.
class AddressForm(forms.Form):
    address = forms.CharField()

class EditEventForm(ModelForm):
    class Meta:
        model = Event
        fields = ['brief','detail','address','contact']
    tag = forms.CharField(max_length=50, required=True)
    start_date = forms.DateField(input_formats=['%m/%d/%Y'], required=True)
    start_time = forms.TimeField(input_formats=['%I:%M%p'], required=True)
    end_date = forms.DateField(input_formats=['%m/%d/%Y'], required=True)
    end_time = forms.TimeField(input_formats=['%I:%M%p'], required=True)

class LoginForm(forms.Form):
    username = forms.CharField(max_length=40, label='Username', required=True)
    password = forms.CharField(max_length=40, label='Password', widget=forms.PasswordInput, required=True)

class RegistrationForm(forms.Form):
    username = forms.CharField(max_length=40, label='Username', required=True)
    password = forms.CharField(max_length=40, label='Password', widget=forms.PasswordInput, required=True)
    password_again = forms.CharField(max_length=40, label='Re-enter Password', widget=forms.PasswordInput, required=True)
    email = forms.CharField(max_length=40, label='Email', required=True)
    tags = forms.MultipleChoiceField(required=True, label='Tags', widget=forms.CheckboxSelectMultiple(), choices=TAG_CHOICES)

    def __init__(self, *args, **kwargs):
        super(RegistrationForm, self).__init__(*args, **kwargs)
        self.fields['tags'].error_messages = {'required': 'Interests are required.'}
        
    def clean_password_again(self):
        password = self.cleaned_data.get('password')
        password_again = self.cleaned_data.get('password_again')
        if password != password_again:
            raise forms.ValidationError("Passwords don\'t match.")  
        return password_again
        
    def clean_email(self):
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email):
            raise forms.ValidationError("A user with that email already exists.")
        return email

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if User.objects.filter(username=username):
            raise forms.ValidationError("A user with that username already exists.")
        return username

class FilterTimeForm(forms.Form):
    start_date = forms.DateField(input_formats=['%m/%d/%Y'], required=True)
    start_time = forms.TimeField(input_formats=['%I:%M%p'], required=True)
    end_date = forms.DateField(input_formats=['%m/%d/%Y'], required=True)
    end_time = forms.TimeField(input_formats=['%I:%M%p'], required=True)

    def clean(self):
        cleaned_data = super(FilterTimeForm, self).clean()

        start_date = cleaned_data.get('start_date')
        start_time = cleaned_data.get('start_time')
        end_date = cleaned_data.get('end_date')
        end_time = cleaned_data.get('end_time')

        return cleaned_data