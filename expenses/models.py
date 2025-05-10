from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Group(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    members = models.ManyToManyField(User, related_name='expense_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')

    def __str__(self):
        return self.name
    
class GroupMember(models.Model):
    group = models.ForeignKey(Group, related_name='external_members', on_delete=models.CASCADE)
    username = models.CharField(max_length=150)
    email = models.EmailField()
    # Optionally: add a flag if this is a registered user or not

    def __str__(self):
        return f"{self.username} ({self.email})"

class Expense(models.Model):
    SPLIT_CHOICES = [
        ('EQUAL', 'Split Equally'),
        ('EXACT', 'Exact Amounts'),
        ('PERCENT', 'By Percentage'),
    ]

    group = models.ForeignKey('Group', on_delete=models.CASCADE, related_name='expenses')
    description = models.CharField(max_length=200)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_by_user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='expenses_paid')
    paid_by_external = models.ForeignKey('GroupMember', null=True, blank=True, on_delete=models.SET_NULL, related_name='expenses_paid_external')
    split_type = models.CharField(max_length=10, choices=SPLIT_CHOICES, default='EQUAL')
    date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    split_with_users = models.ManyToManyField(User, blank=True, related_name='split_expenses')
    split_with_external = models.ManyToManyField('GroupMember', blank=True, related_name='split_expenses_external')

    def __str__(self):
        return f"{self.description} - {self.amount}"

class ExpenseSplit(models.Model):
    expense = models.ForeignKey('Expense', on_delete=models.CASCADE, related_name='splits')
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    external_member = models.ForeignKey('GroupMember', null=True, blank=True, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        if self.user:
            return f"{self.user.username} - {self.amount}"
        elif self.external_member:
            return f"{self.external_member.username} - {self.amount}"
        return f"Split - {self.amount}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True)

    def __str__(self):
        return self.user.username

class Settlement(models.Model):
    group = models.ForeignKey('Group', on_delete=models.CASCADE)
    member_user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE)
    member_external = models.ForeignKey('GroupMember', null=True, blank=True, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateTimeField(auto_now_add=True)

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.userprofile.save()
