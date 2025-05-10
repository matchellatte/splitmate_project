from rest_framework import viewsets
from .models import Group, Expense, GroupMember, Settlement, UserProfile, ExpenseSplit
from .serializers import GroupSerializer, ExpenseSerializer, GroupMemberSerializer, SettlementSerializer
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from decimal import Decimal
from django.core.mail import send_mail
from django.conf import settings
import json
from django.core.mail import send_mail
from django.utils.html import format_html

print("group_create_api CALLED")

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

    def create(self, request, *args, **kwargs):
        name = request.data.get('name')
        description = request.data.get('description')
        external_members = request.data.get('external_members', [])
        if isinstance(external_members, str):
            try:
                external_members = json.loads(external_members)
            except Exception:
                external_members = []
        if not name:
            return Response({'detail': 'Name is required.'}, status=400)
        group = Group.objects.create(
            name=name,
            description=description,
            created_by=request.user
        )
        group.members.add(request.user)
        for member in external_members:
            username = member.get('username')
            email = member.get('email')
            if username and email:
                GroupMember.objects.create(group=group, username=username, email=email)
        serializer = self.get_serializer(group)
        return Response(serializer.data, status=201)

    def update(self, request, *args, **kwargs):
        group = self.get_object()
        group.name = request.data.get('name', group.name)
        group.description = request.data.get('description', group.description)
        group.save()

        # Update external members SAFELY
        external_members = request.data.get('external_members', [])
        if isinstance(external_members, str):
            try:
                external_members = json.loads(external_members)
            except Exception:
                external_members = []

        # Build a set of emails for new members
        new_emails = set(m['email'] for m in external_members if m.get('email'))

        # Remove only those external members not in the new list and with no expense history
        for member in group.external_members.all():
            if member.email not in new_emails:
                has_expense = Expense.objects.filter(split_with_external=member).exists()
                if not has_expense:
                    member.delete()
                # else: optionally mark as inactive, or just leave them

        # Add new external members that don't already exist
        existing_emails = set(m.email for m in group.external_members.all())
        for member in external_members:
            username = member.get('username')
            email = member.get('email')
            if username and email and email not in existing_emails:
                GroupMember.objects.create(group=group, username=username, email=email)

        serializer = self.get_serializer(group)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        group = self.get_object()
        group.delete()
        return Response({'detail': 'Group deleted successfully!'})

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        group_id = data.get('group')
        group = get_object_or_404(Group, pk=group_id, members=request.user)
        description = data.get('description')
        amount = Decimal(data.get('amount'))
        due_date = data.get('due_date')
        split_type = data.get('split_type')
        paid_by_user = data.get('paid_by_user')
        paid_by_external = data.get('paid_by_external')
        split_with_users = data.get('split_with_users', [])
        split_with_external = data.get('split_with_external', [])

        paid_by_user_obj = User.objects.get(id=paid_by_user) if paid_by_user else None
        paid_by_external_obj = GroupMember.objects.get(id=paid_by_external) if paid_by_external else None

        expense = Expense.objects.create(
            description=description,
            amount=amount,
            group=group,
            paid_by_user=paid_by_user_obj,
            paid_by_external=paid_by_external_obj,
            due_date=due_date,
            split_type=split_type
        )
        expense.split_with_users.set(User.objects.filter(id__in=split_with_users))
        expense.split_with_external.set(group.external_members.filter(id__in=split_with_external))

        # Calculate equal split
        total_split = expense.split_with_users.count() + expense.split_with_external.count()
        if total_split > 0:
            split_amount = amount / total_split
            for user in expense.split_with_users.all():
                ExpenseSplit.objects.create(expense=expense, user=user, amount=split_amount)
            for ext in expense.split_with_external.all():
                ExpenseSplit.objects.create(expense=expense, external_member=ext, amount=split_amount)

        serializer = self.get_serializer(expense)
        return Response(serializer.data, status=201)

class GroupMemberViewSet(viewsets.ModelViewSet):
    queryset = GroupMember.objects.all()
    serializer_class = GroupMemberSerializer

class SettlementViewSet(viewsets.ModelViewSet):
    queryset = Settlement.objects.all()
    serializer_class = SettlementSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_api(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    if not username or not email or not password:
        return Response({'detail': 'All fields are required.'}, status=400)
    if User.objects.filter(username=username).exists():
        return Response({'username': ['Username already exists.']}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({'email': ['Email already exists.']}, status=400)
    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.get_or_create(user=user)
    return Response({'detail': 'Account created successfully!'}, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_api(request):
    user_groups = Group.objects.filter(created_by=request.user)
    recent_expenses = Expense.objects.filter(group__in=user_groups).order_by('-date')[:5]
    balances = {}
    for group in user_groups:
        expenses = Expense.objects.filter(group=group)
        for expense in expenses:
            payer = expense.paid_by_user if expense.paid_by_user else expense.paid_by_external
            for split in expense.splits.all():
                if split.user == request.user:
                    balances[str(payer)] = float(balances.get(str(payer), Decimal('0')) - split.amount)
                elif payer == request.user:
                    balances[str(split.user)] = float(balances.get(str(split.user), Decimal('0')) + split.amount)
    return Response({
        'groups': [{'id': g.id, 'name': g.name, 'description': g.description} for g in user_groups],
        'recent_expenses': [
            {
                'id': e.id,
                'description': e.description,
                'amount': float(e.amount),
                'date': e.date,
                'group': e.group.id
            } for e in recent_expenses
        ],
        'balances': balances,
    })

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_api(request):
    user = request.user
    if request.method == 'GET':
        profile = user.userprofile
        total_paid = Expense.objects.filter(paid_by_user=user).aggregate(total=Sum('amount'))['total'] or 0
        user_groups = Group.objects.filter(members=user)
        expenses_paid = Expense.objects.filter(paid_by_user=user).count()
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,  # <-- Add this line
            'phone': profile.phone,
            'date_joined': user.date_joined,
            'profile_picture': profile.profile_picture.url if profile.profile_picture else '',
            'total_paid': float(total_paid),
            'user_groups': [{'id': g.id, 'name': g.name} for g in user_groups],
            'expenses_paid': expenses_paid,
        })
    elif request.method == 'PUT':
        profile = user.userprofile
        profile.phone = request.data.get('phone', '')
        if 'profile_picture' in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        return Response({'detail': 'Profile updated!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_list_api(request):
    print("==== GROUP LIST API CALLED ====")
    print("Current user:", request.user)
    groups = Group.objects.filter(created_by=request.user)
    print("Groups returned:", list(groups))
    group_data = []
    for g in groups:
        group_data.append({
            'id': g.id,
            'name': g.name,
            'description': g.description,
            'members': [{'id': u.id, 'username': u.username, 'email': u.email} for u in g.members.all()],
            'external_members': [{'id': ext.id, 'username': ext.username, 'email': ext.email} for ext in g.external_members.all()],
            'created_at': g.created_at,
            'is_admin': g.created_by == request.user,
        })
    return Response(group_data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_detail_api(request, pk):
    group = get_object_or_404(Group, pk=pk)
    if group.created_by != request.user:
        return Response({'detail': 'You do not have access to this group.'}, status=403)
    # Registered members
    members = [
        {
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'is_admin': group.created_by == u
        }
        for u in group.members.all()
    ]
    # External members
    external_members = [
        {
            'id': ext.id,
            'username': ext.username,
            'email': ext.email
        }
        for ext in group.external_members.all()
    ]
    # Expenses for this group only
    expenses = Expense.objects.filter(group=group).order_by('-date')
    expenses_data = [
        {
            'id': e.id,
            'description': e.description,
            'amount': float(e.amount),
            'date': e.date,
            'due_date': e.due_date,
            'paid_by_user': e.paid_by_user.id if e.paid_by_user else None,
            'paid_by_external': e.paid_by_external.id if e.paid_by_external else None,
        }
        for e in expenses
    ]
    return Response({
        'id': group.id,
        'name': group.name,
        'description': group.description,
        'members': members,
        'external_members': external_members,
        'expenses': expenses_data,
        'is_admin': group.created_by == request.user,
    })

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def group_edit_api(request, pk):
    group = get_object_or_404(Group, pk=pk, created_by=request.user)
    group.name = request.data.get('name', group.name)
    group.description = request.data.get('description', group.description)
    group.save()

    # Update external members
    group.external_members.all().delete()
    usernames = request.data.get('member_username', [])
    emails = request.data.get('member_email', [])
    for username, email in zip(usernames, emails):
        if username and email:
            GroupMember.objects.create(group=group, username=username, email=email)

    return Response({'detail': 'Group updated successfully!'})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def group_delete_api(request, pk):
    group = get_object_or_404(Group, pk=pk, created_by=request.user)
    group.delete()
    return Response({'detail': 'Group deleted successfully!'})

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def expense_edit_api(request, pk):
    expense = get_object_or_404(Expense, pk=pk)
    expense.description = request.data.get('description', expense.description)
    expense.amount = Decimal(request.data.get('amount', expense.amount))
    expense.due_date = request.data.get('due_date', expense.due_date)
    expense.save()
    return Response({'detail': 'Expense updated successfully!'})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def expense_delete_api(request, pk):
    expense = get_object_or_404(Expense, pk=pk)
    expense.delete()
    return Response({'detail': 'Expense deleted successfully!'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def settlement_api(request, pk):
    group = get_object_or_404(Group, pk=pk, members=request.user)
    settlements = []
    balances = {}
    expenses = Expense.objects.filter(group=group)
    for expense in expenses:
        for split in expense.splits.all():
            if (split.user and split.user == expense.paid_by_user) or (split.external_member and split.external_member == expense.paid_by_external):
                continue
            key = (str(split.user), str(expense.paid_by_user))
            balances[key] = float(balances.get(key, Decimal('0')) + split.amount)
    for (debtor, creditor), amount in balances.items():
        if amount > 0:
            settlements.append({
                'from_user': debtor,
                'to_user': creditor,
                'amount': amount
            })
    return Response({
        'group': {'id': group.id, 'name': group.name},
        'settlements': settlements
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_settlement_settled_api(request, pk):
    # Placeholder for actual settlement marking logic
    # You can add logic here to update a Settlement object if needed
    return Response({'detail': 'Settlement marked as complete!'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_reminder_api(request, pk):
    group = get_object_or_404(Group, pk=pk, members=request.user)
    message = request.data.get('message', '')
    subject = f"Payment Reminder from SplitMate: {group.name}"
    # Collect all emails (registered and external)
    emails = [user.email for user in group.members.all() if user.email]
    emails += [ext.email for ext in group.external_members.all() if ext.email]
    # Compose message
    full_message = f"Hi, this is a reminder from SplitMate to settle your balances in the group '{group.name}'.\n\n"
    if message:
        full_message += f"Message from {request.user.username}: {message}\n\n"
    full_message += "Please log in or contact the group admin for details."
    # Send email
    send_mail(subject, full_message, settings.DEFAULT_FROM_EMAIL, emails, fail_silently=False)
    return Response({'detail': 'Reminders sent!'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_individual_reminder_api(request, group_pk, member_type, member_id):
    group = get_object_or_404(Group, pk=group_pk, members=request.user)
    if member_type == "user":
        member = get_object_or_404(User, pk=member_id)
        email = member.email
        name = member.username
    else:
        member = get_object_or_404(GroupMember, pk=member_id)
        email = member.email
        name = member.username

    message = request.data.get('message', '')
    owed_expenses = request.data.get('owed_expenses', [])

    subject = f"Payment Reminder from SplitMate: {group.name}"

    # Plain text fallback
    plain_message = f"Hi {name}, this is a reminder from SplitMate to settle your balances in the group '{group.name}'.\n\n"
    if message:
        plain_message += f"Message from {request.user.username}: {message}\n\n"
    if owed_expenses:
        plain_message += "Outstanding Balances:\n"
        for exp in owed_expenses:
            due = f" (Due: {exp.get('due_date', '')})" if exp.get('due_date') else ""
            plain_message += f"- ₱{float(exp['amount']):.2f} for {exp['description']}{due}\n"
        total = sum(float(exp['amount']) for exp in owed_expenses)
        plain_message += f"\nTotal: ₱{total:.2f}\n\n"

    # HTML message (optional, for better design)
    owed_html = ""
    if owed_expenses:
        owed_html = "<h4>Outstanding Balances:</h4><ul style='padding-left:20px;'>"
        for exp in owed_expenses:
            due = f" <span style='color:#888;'>(Due: {exp.get('due_date', '')})</span>" if exp.get('due_date') else ""
            owed_html += f"<li>₱{float(exp['amount']):.2f} for <b>{exp['description']}</b>{due}</li>"
        owed_html += "</ul>"
        total = sum(float(exp['amount']) for exp in owed_expenses)
        owed_html += f"<b>Total: ₱{total:.2f}</b>"

    html_message = f"""
    <html>
      <body style="font-family: Arial, sans-serif; color: #222;">
        <h2 style="color: #198754;">SplitMate Payment Reminder</h2>
        <p>Hi <b>{name}</b>,</p>
        <p>This is a reminder from <b>SplitMate</b> to settle your balances in the group <b>{group.name}</b>.</p>
        {f'<p style="color:#444;"><i>Message from {request.user.username}: {message}</i></p>' if message else ''}
        {owed_html}
        <p style="margin-top:20px;">Please log in or contact the group admin for details.</p>
        <hr>
        <small style="color:#888;">Sent by SplitMate</small>
      </body>
    </html>
    """

    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
        html_message=html_message
    )
    return Response({'detail': f'Reminder sent to {name}!'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def settle_member_api(request, group_pk, member_type, member_id):
    group = get_object_or_404(Group, pk=group_pk, members=request.user)
    amount = Decimal(request.data.get('amount'))
    if member_type == 'user':
        member_user = get_object_or_404(User, pk=member_id)
        Settlement.objects.create(group=group, member_user=member_user, amount=amount)
    else:
        member_external = get_object_or_404(GroupMember, pk=member_id)
        Settlement.objects.create(group=group, member_external=member_external, amount=amount)
    return Response({'detail': 'Settlement recorded!'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_balances_api(request, pk):
    group = get_object_or_404(Group, pk=pk, members=request.user)
    expenses = Expense.objects.filter(group=group).order_by('-date')
    settlements = Settlement.objects.filter(group=group)
    members = []
    for user in group.members.all():
        members.append({'type': 'user', 'obj': user, 'name': user.username, 'email': user.email, 'id': user.id})
    for ext in group.external_members.all():
        members.append({'type': 'external', 'obj': ext, 'name': ext.username, 'email': ext.email, 'id': ext.id})
    member_balances = []
    for member in members:
        owed_expenses = []
        total_owed = Decimal('0')
        for expense in expenses:
            for split in expense.splits.all():
                if (member['type'] == 'user' and split.user == member['obj']) or (member['type'] == 'external' and split.external_member == member['obj']):
                    owed_expenses.append({'amount': float(split.amount), 'description': expense.description, 'due_date': expense.due_date.isoformat() if expense.due_date else None, }), 
                    total_owed += split.amount
        if member['type'] == 'user':
            settled = settlements.filter(member_user=member['obj']).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        else:
            settled = settlements.filter(member_external=member['obj']).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        member_balances.append({
            'name': member['name'],
            'email': member['email'],
            'type': member['type'],
            'id': member['id'],
            'total_owed': float(total_owed - settled),
            'owed_expenses': owed_expenses,
            'settled': float(settled),
        })
    return Response(member_balances)