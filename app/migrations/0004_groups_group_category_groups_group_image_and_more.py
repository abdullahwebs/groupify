# Generated by Django 5.1.4 on 2025-01-30 10:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0003_groups_group_desc'),
    ]

    operations = [
        migrations.AddField(
            model_name='groups',
            name='group_category',
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='groups',
            name='group_image',
            field=models.CharField(max_length=100, null=True),
        ),
        migrations.AddField(
            model_name='groups',
            name='group_time',
            field=models.CharField(max_length=100, null=True),
        ),
    ]
