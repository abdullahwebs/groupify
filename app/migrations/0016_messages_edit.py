# Generated by Django 5.1.4 on 2025-02-18 20:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0015_delete_timespent_user_time_spent'),
    ]

    operations = [
        migrations.AddField(
            model_name='messages',
            name='edit',
            field=models.BooleanField(null=True),
        ),
    ]
