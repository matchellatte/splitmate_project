from rest_framework import serializers
from .models import Group, Expense, GroupMember, Settlement
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class GroupMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMember
        fields = '__all__'

class GroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    external_members = GroupMemberSerializer(many=True, read_only=True)
    expenses = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = '__all__'

    def get_expenses(self, obj):
        expenses = obj.expenses.all().order_by('-date')
        return [
            {
                'id': e.id,
                'description': e.description,
                'amount': float(e.amount),
                'date': e.date,
                'due_date': e.due_date,
                'paid_by_user': e.paid_by_user.id if e.paid_by_user else None,
                'paid_by_external': e.paid_by_external.id if e.paid_by_external else None,
                'split_with_users': [u.id for u in e.split_with_users.all()],
                'split_with_external': [em.id for em in e.split_with_external.all()],
            }
            for e in expenses
        ]

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

class SettlementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settlement
        fields = '__all__'