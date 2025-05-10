# from django.shortcuts import render, redirect, get_object_or_404
# from django.contrib.auth.decorators import login_required
# from django.contrib.auth.forms import UserCreationForm
# from django.contrib import messages
# from django.db.models import Sum
# from .models import Group, Expense, ExpenseSplit, UserProfile, GroupMember
# from django.contrib.auth.models import User
# from decimal import Decimal
# from collections import defaultdict
# from django.db import IntegrityError
# from django.core.mail import send_mail
# from django.conf import settings
# from .models import Settlement
# from django.db import models


# def register(request):
#     if request.method == 'POST':
#         form = UserCreationForm(request.POST)
#         if form.is_valid():
#             user = form.save()
#             UserProfile.objects.get_or_create(user=user)
#             messages.success(request, 'Account created successfully!')
#             return redirect('login')
#     else:
#         form = UserCreationForm()
#     return render(request, 'expenses/register.html', {'form': form, 'hide_sidebar': True})

# @login_required
# def dashboard(request):
#     user_groups = Group.objects.filter(members=request.user)
#     recent_expenses = Expense.objects.filter(group__in=user_groups).order_by('-date')[:5]
#     balances = {}
#     for group in user_groups:
#         expenses = Expense.objects.filter(group=group)
#         for expense in expenses:
#             payer = expense.paid_by_user if expense.paid_by_user else expense.paid_by_external
#             for split in expense.splits.all():
#                 if split.user == request.user:
#                     balances[payer] = balances.get(payer, Decimal('0')) - split.amount
#                 elif payer == request.user:
#                     balances[split.user] = balances.get(split.user, Decimal('0')) + split.amount
#     context = {
#         'groups': user_groups,
#         'recent_expenses': recent_expenses,
#         'balances': balances,
#     }
#     return render(request, 'expenses/dashboard.html', context)

# @login_required
# def profile(request):
#     if request.method == 'POST':
#         profile = request.user.userprofile
#         if 'profile_picture' in request.FILES:
#             profile.profile_picture = request.FILES['profile_picture']
#         profile.phone = request.POST.get('phone', '')
#         profile.save()
#         messages.success(request, 'Profile updated successfully!')
#         return redirect('profile')
#     total_paid = Expense.objects.filter(paid_by_user=request.user).aggregate(total=Sum('amount'))['total'] or 0
#     user_groups = Group.objects.filter(members=request.user)
#     expenses_paid = Expense.objects.filter(paid_by_user=request.user).count()
#     context = {
#         'total_paid': total_paid,
#         'user_groups': user_groups,
#         'expenses_paid': expenses_paid,
#         'hide_sidebar': False,
#     }
#     return render(request, 'expenses/profile.html', context)

# @login_required
# def group_list(request):
#     groups = Group.objects.filter(members=request.user)
#     return render(request, 'expenses/group_list.html', {'groups': groups})

# from .models import Group, GroupMember  # Make sure GroupMember is imported

# @login_required
# def group_create(request):
#     if request.method == 'POST':
#         name = request.POST.get('name')
#         description = request.POST.get('description')
#         if name:
#             group = Group.objects.create(
#                 name=name,
#                 description=description,
#                 created_by=request.user
#             )
#             group.members.add(request.user)
#             # Handle external members
#             usernames = request.POST.getlist('member_username[]')
#             emails = request.POST.getlist('member_email[]')
#             for username, email in zip(usernames, emails):
#                 if username and email:
#                     GroupMember.objects.create(group=group, username=username, email=email)
#             messages.success(request, 'Group created successfully!')
#             return redirect('group_detail', pk=group.pk)
#     return render(request, 'expenses/group_form.html')

# @login_required
# def group_detail(request, pk):
#     group = get_object_or_404(Group, pk=pk, members=request.user)
#     expenses = Expense.objects.filter(group=group).order_by('-date')
#     settlements = Settlement.objects.filter(group=group)

#     # Build member list (registered + external)
#     members = []
#     for user in group.members.all():
#         members.append({'type': 'user', 'obj': user, 'name': user.username, 'email': user.email})
#     for ext in group.external_members.all():
#         members.append({'type': 'external', 'obj': ext, 'name': ext.username, 'email': ext.email})

#     member_balances = []
#     for member in members:
#         # Expenses this member owes
#         owed_expenses = []
#         total_owed = 0
#         for expense in expenses:
#             for split in expense.splits.all():
#                 if (member['type'] == 'user' and split.user == member['obj']) or (member['type'] == 'external' and split.external_member == member['obj']):
#                     owed_expenses.append({'amount': split.amount, 'description': expense.description})
#                     total_owed += split.amount
#         # Settlements
#         if member['type'] == 'user':
#             settled = settlements.filter(member_user=member['obj']).aggregate(total=models.Sum('amount'))['total'] or 0
#         else:
#             settled = settlements.filter(member_external=member['obj']).aggregate(total=models.Sum('amount'))['total'] or 0
#         member_balances.append({
#             'name': member['name'],
#             'email': member['email'],
#             'type': member['type'],
#             'id': member['obj'].id,
#             'total_owed': total_owed - settled,
#             'owed_expenses': owed_expenses,
#             'settled': settled,
#         })

#     context = {
#         'group': group,
#         'expenses': expenses,
#         'member_balances': member_balances,
#     }
#     return render(request, 'expenses/group_detail.html', context)

# @login_required
# def group_edit(request, pk):
#     group = get_object_or_404(Group, pk=pk, created_by=request.user)
#     if request.method == 'POST':
#         group.name = request.POST.get('name', group.name)
#         group.description = request.POST.get('description', group.description)
#         group.save()

#         # Update external members
#         # Remove all existing external members and re-add from form
#         group.external_members.all().delete()
#         usernames = request.POST.getlist('member_username[]')
#         emails = request.POST.getlist('member_email[]')
#         for username, email in zip(usernames, emails):
#             if username and email:
#                 GroupMember.objects.create(group=group, username=username, email=email)

#         messages.success(request, 'Group updated successfully!')
#         return redirect('group_detail', pk=group.pk)

#     # Prepare existing external members for the form
#     external_members = group.external_members.all()
#     context = {
#         'group': group,
#         'external_members': external_members,
#     }
#     return render(request, 'expenses/group_form.html', context)

# @login_required
# def group_delete(request, pk):
#     group = get_object_or_404(Group, pk=pk, created_by=request.user)
#     if request.method == 'POST':
#         group.delete()
#         messages.success(request, 'Group deleted successfully!')
#         return redirect('group_list')
#     return render(request, 'expenses/group_confirm_delete.html', {'group': group})

# @login_required
# def expense_create(request, group_pk):
#     group = get_object_or_404(Group, pk=group_pk, members=request.user)
#     if request.method == 'POST':
#         description = request.POST.get('description')
#         amount = Decimal(request.POST.get('amount'))
#         due_date = request.POST.get('due_date')
#         split_type = request.POST.get('split_type')
#         paid_by_value = request.POST.get('paid_by')
#         split_with_users = request.POST.getlist('split_with_users')
#         split_with_external = request.POST.getlist('split_with_external')

#         paid_by_user = None
#         paid_by_external = None
#         if paid_by_value and paid_by_value.startswith('user_'):
#             paid_by_user = User.objects.get(id=paid_by_value.split('_')[1])
#         elif paid_by_value and paid_by_value.startswith('ext_'):
#             paid_by_external = GroupMember.objects.get(id=paid_by_value.split('_')[1])
#         # If 'none', both remain None

#         expense = Expense.objects.create(
#             description=description,
#             amount=amount,
#             group=group,
#             paid_by_user=paid_by_user,
#             paid_by_external=paid_by_external,
#             due_date=due_date,
#             split_type=split_type
#         )
#         expense.split_with_users.set(User.objects.filter(id__in=split_with_users))
#         expense.split_with_external.set(group.external_members.filter(id__in=split_with_external))

#         # Calculate equal split
#         total_split = expense.split_with_users.count() + expense.split_with_external.count()
#         if total_split > 0:
#             split_amount = amount / total_split
#             for user in expense.split_with_users.all():
#                 ExpenseSplit.objects.create(expense=expense, user=user, amount=split_amount)
#             for ext in expense.split_with_external.all():
#                 ExpenseSplit.objects.create(expense=expense, external_member=ext, amount=split_amount)
#         messages.success(request, 'Expense added successfully!')
#         return redirect('group_detail', pk=group_pk)
#     return render(request, 'expenses/expense_form.html', {'group': group})

# @login_required
# def expense_edit(request, pk):
#     expense = get_object_or_404(Expense, pk=pk)
#     group = expense.group
#     if request.method == 'POST':
#         expense.description = request.POST.get('description', expense.description)
#         expense.amount = Decimal(request.POST.get('amount', expense.amount))
#         expense.due_date = request.POST.get('due_date', expense.due_date)
#         expense.save()
#         messages.success(request, 'Expense updated successfully!')
#         return redirect('group_detail', pk=group.pk)
#     return render(request, 'expenses/expense_form.html', {'expense': expense, 'group': group})

# @login_required
# def expense_delete(request, pk):
#     expense = get_object_or_404(Expense, pk=pk)
#     group_pk = expense.group.pk
#     if request.method == 'POST':
#         expense.delete()
#         messages.success(request, 'Expense deleted successfully!')
#         return redirect('group_detail', pk=group_pk)
#     return render(request, 'expenses/expense_confirm_delete.html', {'expense': expense})

# @login_required
# def settlement(request, pk):
#     group = get_object_or_404(Group, pk=pk, members=request.user)
#     settlements = []
    
#     # Calculate who owes whom
#     balances = {}
#     expenses = Expense.objects.filter(group=group)
#     for expense in expenses:
#         for split in expense.splits.all():
#             if (split.user and split.user == expense.paid_by_user) or (split.external_member and split.external_member == expense.paid_by_external):
#                 continue
#             key = (split.user, expense.paid_by)
#             balances[key] = balances.get(key, Decimal('0')) + split.amount
    
#     # Convert balances to settlements
#     for (debtor, creditor), amount in balances.items():
#         if amount > 0:
#             settlements.append({
#                 'from_user': debtor,
#                 'to_user': creditor,
#                 'amount': amount
#             })
    
#     return render(request, 'expenses/settlement.html', {
#         'group': group,
#         'settlements': settlements
#     })

# @login_required
# def mark_settlement_settled(request, pk):
#     # This is a placeholder for actual settlement marking logic
#     if request.method == 'POST':
#         messages.success(request, 'Settlement marked as complete!')
#     return redirect('settlement', pk=pk)

# @login_required
# def send_reminder(request, pk):
#     group = get_object_or_404(Group, pk=pk, members=request.user)
#     if request.method == 'POST':
#         message = request.POST.get('message', '')
#         subject = f"Payment Reminder from SplitMate: {group.name}"
#         # Collect all emails (registered and external)
#         emails = [user.email for user in group.members.all() if user.email]
#         emails += [ext.email for ext in group.external_members.all() if ext.email]
#         # Compose message
#         full_message = f"Hi, this is a reminder from SplitMate to settle your balances in the group '{group.name}'.\n\n"
#         if message:
#             full_message += f"Message from {request.user.username}: {message}\n\n"
#         full_message += "Please log in or contact the group admin for details."
#         # Send email
#         send_mail(subject, full_message, settings.DEFAULT_FROM_EMAIL, emails, fail_silently=False)
#         messages.success(request, 'Reminders sent!')
#     return redirect('group_detail', pk=pk)

# @login_required
# def send_individual_reminder(request, group_pk, member_type, member_id):
#     group = get_object_or_404(Group, pk=group_pk, members=request.user)
#     if member_type == "user":
#         member = get_object_or_404(User, pk=member_id)
#         email = member.email
#         name = member.username
#     else:
#         member = get_object_or_404(GroupMember, pk=member_id)
#         email = member.email
#         name = member.username

#     if request.method == "POST":
#         message = request.POST.get('message', '')
#         subject = f"Payment Reminder from SplitMate: {group.name}"
#         full_message = f"Hi {name}, this is a reminder from SplitMate to settle your balances in the group '{group.name}'.\n\n"
#         if message:
#             full_message += f"Message from {request.user.username}: {message}\n\n"
#         full_message += "Please log in or contact the group admin for details."
#         send_mail(subject, full_message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
#         messages.success(request, f'Reminder sent to {name}!')
#     return redirect('group_detail', pk=group_pk)

# @login_required
# def settle_member(request, group_pk, member_type, member_id):
#     group = get_object_or_404(Group, pk=group_pk, members=request.user)
#     if request.method == 'POST':
#         amount = Decimal(request.POST.get('amount'))
#         if member_type == 'user':
#             member_user = get_object_or_404(User, pk=member_id)
#             Settlement.objects.create(group=group, member_user=member_user, amount=amount)
#         else:
#             member_external = get_object_or_404(GroupMember, pk=member_id)
#             Settlement.objects.create(group=group, member_external=member_external, amount=amount)
#         messages.success(request, 'Settlement recorded!')
#     return redirect('group_detail', pk=group_pk)

