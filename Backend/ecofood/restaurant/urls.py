from django.urls import path
from restaurant.views import (
    OrderListCreateView, OrderDetailView,
    OrderItemListCreateView, OrderItemDetailView,
    OrderItemModificationListCreateView, OrderItemModificationDetailView,
    MenuItemListCreateView, MenuItemDetailView,
    IngredientListCreateView, IngredientDetailView,
    DiscountListCreateView, DiscountDetailView,
    PaymentListCreateView, PaymentDetailView,
    CustomerSignUpView, CustomerLoginView, CustomerListCreateView, CustomerDetailView,
    TableListCreateView, TableDetailView,
    ReservationListCreateView, ReservationDetailView
)
from restaurant.views.table import (
    check_table_availability, get_tables_with_layout, 
    get_table_schedule, toggle_table_availability
)
from restaurant.views.reservation import (
    lookup_reservation, modify_reservation, cancel_reservation,
    update_reservation_status, get_upcoming_reservations, check_availability
)
from restaurant.views.discount import apply_discount, get_active_discounts, record_discount_usage

urlpatterns = [
    path('orders/', OrderListCreateView.as_view(), name='order-list-create'),
    path('orders/<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('order-items/', OrderItemListCreateView.as_view(), name='order-item-list-create'),
    path('order-items/<int:pk>/', OrderItemDetailView.as_view(), name='order-item-detail'),
    path('order-item-modifications/', OrderItemModificationListCreateView.as_view(), name='order-item-modification-list-create'),
    path('order-item-modifications/<int:pk>/', OrderItemModificationDetailView.as_view(), name='order-item-modification-detail'),
    path('menu-items/', MenuItemListCreateView.as_view(), name='menu-item-list-create'),
    path('menu-items/<int:pk>/', MenuItemDetailView.as_view(), name='menu-item-detail'),
    path('ingredients/', IngredientListCreateView.as_view(), name='ingredient-list-create'),
    path('ingredients/<int:pk>/', IngredientDetailView.as_view(), name='ingredient-detail'),
    path('discounts/', DiscountListCreateView.as_view(), name='discount-list-create'),
    path('discounts/<int:discount_id>/', DiscountDetailView.as_view(), name='discount-detail'),
    path('discounts/apply/', apply_discount, name='apply-discount'),
    path('discounts/active/', get_active_discounts, name='active-discounts'),
    path('discounts/record-usage/', record_discount_usage, name='record-discount-usage'),
    path('payments/', PaymentListCreateView.as_view(), name='payment-list-create'),
    path('payments/<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('signup/', CustomerSignUpView.as_view(), name='customer-signup'),
    path('login/', CustomerLoginView.as_view(), name='customer-login'),
    path('customers/', CustomerListCreateView.as_view(), name='customer-list-create'),
    path('customers/<int:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
    
    # Table Management URLs
    path('tables/', TableListCreateView.as_view(), name='table-list-create'),
    path('tables/<int:table_id>/', TableDetailView.as_view(), name='table-detail'),
    path('tables/check-availability/', check_table_availability, name='table-check-availability'),
    path('tables/layout/', get_tables_with_layout, name='tables-layout'),
    path('tables/<int:table_id>/schedule/', get_table_schedule, name='table-schedule'),
    path('tables/<int:table_id>/toggle-availability/', toggle_table_availability, name='table-toggle-availability'),
    
    # Reservation Management URLs
    path('reservations/', ReservationListCreateView.as_view(), name='reservation-list-create'),
    path('reservations/<int:reservation_id>/', ReservationDetailView.as_view(), name='reservation-detail'),
    path('reservations/lookup/', lookup_reservation, name='reservation-lookup'),
    path('reservations/<int:reservation_id>/modify/', modify_reservation, name='reservation-modify'),
    path('reservations/<int:reservation_id>/cancel/', cancel_reservation, name='reservation-cancel'),
    path('reservations/<int:reservation_id>/status/', update_reservation_status, name='reservation-status-update'),
    path('reservations/upcoming/', get_upcoming_reservations, name='reservations-upcoming'),
    path('reservations/check-availability/', check_availability, name='reservation-check-availability'),
]