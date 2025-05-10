"""
URL configuration for splitmate_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from expenses.api_views import (
    GroupViewSet, ExpenseViewSet, GroupMemberViewSet, SettlementViewSet,
    profile_api, dashboard_api, group_list_api, group_detail_api,
    group_edit_api, group_delete_api, expense_edit_api, expense_delete_api,
    settlement_api, mark_settlement_settled_api, send_reminder_api, send_individual_reminder_api,
    settle_member_api, register_api, group_balances_api
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = routers.DefaultRouter()
router.register(r'groups', GroupViewSet)
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'groupmembers', GroupMemberViewSet)
router.register(r'settlements', SettlementViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/profile/', profile_api, name='api_profile'),
    path('api/dashboard/', dashboard_api, name='api_dashboard'),
    path('api/groups/<int:pk>/', group_detail_api, name='api_group_detail'),
    path('api/groups/<int:pk>/edit/', group_edit_api, name='api_group_edit'),
    path('api/groups/<int:pk>/delete/', group_delete_api, name='api_group_delete'),
    path('api/expenses/<int:pk>/edit/', expense_edit_api, name='api_expense_edit'),
    path('api/expenses/<int:pk>/delete/', expense_delete_api, name='api_expense_delete'),
    path('api/groups/<int:pk>/settlement/', settlement_api, name='api_settlement'),
    path('api/groups/<int:pk>/balances/', group_balances_api, name='group_balances_api'),
    path('api/settlement/<int:pk>/mark/', mark_settlement_settled_api, name='api_settlement_mark'),
    path('api/groups/<int:pk>/remind/', send_reminder_api, name='api_send_reminder'),
    path('api/groups/<int:group_pk>/remind/<str:member_type>/<int:member_id>/', send_individual_reminder_api, name='api_send_individual_reminder'),
    path('api/groups/<int:group_pk>/settle/<str:member_type>/<int:member_id>/', settle_member_api, name='api_settle_member'),
    path('api/register/', register_api, name='api_register'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
