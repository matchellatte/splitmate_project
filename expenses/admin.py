from django.contrib import admin
from .models import Group, Expense, ExpenseSplit, UserProfile, GroupMember

admin.site.register(GroupMember)

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_by', 'created_at', 'member_list')

    def member_list(self, obj):
        return ", ".join([f"{user.username} ({user.email})" for user in obj.members.all()])
    member_list.short_description = 'Members (username, email)'


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'group', 'date')
    list_filter = ('date', 'split_type', 'group')
    search_fields = ('description',)

@admin.register(ExpenseSplit)
class ExpenseSplitAdmin(admin.ModelAdmin):
    list_display = ('expense', 'user', 'amount')
    list_filter = ('expense__group',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone')
    search_fields = ('user__username', 'phone')
