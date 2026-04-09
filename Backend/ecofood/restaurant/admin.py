from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Customer, MenuItem, Order, OrderItem, 
    Ingredient, Payment, PaymentMethod, Discount, OrderItemModification,
    Table, Reservation
)

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('customer_id', 'full_name', 'phone', 'address', 'is_active', 'is_staff', 'date_joined', 'last_login')
    list_filter = ('is_active', 'is_staff', 'date_joined', 'last_login')
    search_fields = ('full_name', 'phone', 'address')
    readonly_fields = ('customer_id', 'date_joined', 'last_login')
    
    fieldsets = (
        ('Personal Information', {
            'fields': ('full_name', 'phone', 'address')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined')
        }),
        ('System Information', {
            'fields': ('customer_id',),
            'classes': ('collapse',)
        }),
    )

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('menu_item_id', 'name', 'category', 'price', 'calories', 'is_available', 'image_preview')
    list_filter = ('category', 'is_available')
    search_fields = ('name', 'description')
    readonly_fields = ('menu_item_id', 'image_preview')
    list_editable = ('price', 'is_available')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'category')
        }),
        ('Pricing & Nutrition', {
            'fields': ('price', 'calories')
        }),
        ('Availability & Image', {
            'fields': ('is_available', 'image', 'image_preview')
        }),
        ('System Information', {
            'fields': ('menu_item_id',),
            'classes': ('collapse',)
        }),
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 5px;" />', obj.image.url)
        return "No Image"
    image_preview.short_description = "Image Preview"

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('ingredient_id', 'name', 'stock_quantity', 'unit', 'price_per_unit', 'is_allergen')
    list_filter = ('unit', 'is_allergen')
    search_fields = ('name',)
    readonly_fields = ('ingredient_id',)
    list_editable = ('stock_quantity', 'price_per_unit', 'is_allergen')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'unit', 'is_allergen')
        }),
        ('Stock & Pricing', {
            'fields': ('stock_quantity', 'price_per_unit')
        }),
        ('System Information', {
            'fields': ('ingredient_id',),
            'classes': ('collapse',)
        }),
    )

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('discount_id', 'description', 'percentage', 'valid_from', 'valid_to', 'code', 'is_active')
    list_filter = ('is_active', 'valid_from', 'valid_to')
    search_fields = ('description', 'code')
    readonly_fields = ('discount_id',)
    list_editable = ('is_active',)
    date_hierarchy = 'valid_from'
    
    fieldsets = (
        ('Discount Information', {
            'fields': ('description', 'code')
        }),
        ('Discount Values', {
            'fields': ('percentage',)
        }),
        ('Validity Period', {
            'fields': ('valid_from', 'valid_to', 'is_active')
        }),
        ('System Information', {
            'fields': ('discount_id',),
            'classes': ('collapse',)
        }),
    )

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('payment_method_id', 'method', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('method',)
    readonly_fields = ('payment_method_id',)
    list_editable = ('is_active',)
    
    fieldsets = (
        ('Payment Method Information', {
            'fields': ('method', 'is_active')
        }),
        ('System Information', {
            'fields': ('payment_method_id',),
            'classes': ('collapse',)
        }),
    )

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('order_item_id', 'calculated_price')
    fields = ('order_item_id', 'menu_item', 'quantity', 'price', 'calculated_price', 'ingredients')
    filter_horizontal = ('ingredients',)
    
    def calculated_price(self, obj):
        if obj.pk:
            return f"SYP {obj.calculate_price():.2f}"
        return "Not calculated yet"
    calculated_price.short_description = "Calculated Price"

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'customer', 'order_date', 'state', 'total_amount', 'items_count', 'payment_status', 'payment_method')
    list_filter = ('state', 'order_date', 'created_at', 'payment__payment_method__method', 'payment__status')
    search_fields = ('customer__full_name', 'customer__phone', 'order_id')
    readonly_fields = ('order_id', 'created_at', 'updated_at', 'items_count')
    date_hierarchy = 'order_date'
    inlines = [OrderItemInline]
    actions = ['mark_as_preparing', 'mark_as_delivered', 'mark_as_canceled', 'complete_cash_delivery']
    
    fieldsets = (
        ('Order Information', {
            'fields': ('customer', 'order_date', 'state')
        }),
        ('Financial Information', {
            'fields': ('total_amount', 'discount', 'payment')
        }),
        ('System Information', {
            'fields': ('order_id', 'created_at', 'updated_at', 'items_count'),
            'classes': ('collapse',)
        }),
    )
    
    def items_count(self, obj):
        return obj.orderitem_set.count()
    items_count.short_description = "Items Count"
    
    def payment_status(self, obj):
        if obj.payment:
            status = obj.payment.status
            color = {
                'success': 'green',
                'pending': 'orange', 
                'failed': 'red',
                'refunded': 'blue'
            }.get(status, 'gray')
            return format_html(
                '<span style="color: {}; font-weight: bold;">{}</span>',
                color,
                status.title()
            )
        return format_html('<span style="color: gray;">No Payment</span>')
    payment_status.short_description = "Payment Status"
    
    def payment_method(self, obj):
        if obj.payment and obj.payment.payment_method:
            method = obj.payment.payment_method.method
            if method == "cash":
                return format_html('<span style="color: orange;">💵 Cash on Delivery</span>')
            elif method == "credit_card":
                return format_html('<span style="color: blue;">💳 Credit Card</span>')
            else:
                return method.title()
        return format_html('<span style="color: gray;">No Payment Method</span>')
    payment_method.short_description = "Payment Method"
    
    # Custom actions for state transitions
    @admin.action(description='Mark selected orders as Preparing')
    def mark_as_preparing(self, request, queryset):
        from restaurant.orders_states import PreparingState
        updated = 0
        for order in queryset:
            if order.state == "pending":
                order.set_state(PreparingState())
                updated += 1
        self.message_user(request, f'{updated} orders marked as preparing.')
    
    @admin.action(description='Mark selected orders as Delivered (completes cash payments)')
    def mark_as_delivered(self, request, queryset):
        from restaurant.business_logic.order_business_logic import OrderBusinessLogic
        order_logic = OrderBusinessLogic()
        updated = 0
        cash_completed = 0
        
        for order in queryset:
            if order.state in ["pending", "preparing"]:
                # Use the complete_order_delivery method which handles cash payments
                order_logic.complete_order_delivery(order.order_id)
                updated += 1
                
                # Check if this was a cash payment that got completed
                if (order.payment and 
                    order.payment.payment_method.method == "cash" and 
                    order.payment.status == "success"):
                    cash_completed += 1
        
        message = f'{updated} orders marked as delivered.'
        if cash_completed > 0:
            message += f' {cash_completed} cash payments completed.'
        self.message_user(request, message)
    
    @admin.action(description='Mark selected orders as Canceled')
    def mark_as_canceled(self, request, queryset):
        from restaurant.orders_states import CanceledState
        updated = 0
        for order in queryset:
            if order.state in ["pending", "preparing"]:
                order.set_state(CanceledState())
                updated += 1
        self.message_user(request, f'{updated} orders marked as canceled.')
    
    @admin.action(description='Complete Cash Payment (for delivered cash orders)')
    def complete_cash_delivery(self, request, queryset):
        from restaurant.payment_services.cash import CashPayment
        cash_service = CashPayment()
        updated = 0
        
        for order in queryset:
            if (order.payment and 
                order.payment.payment_method.method == "cash" and 
                order.payment.status == "pending"):
                
                # Complete the cash payment
                payment_result = cash_service.complete_cash_payment(order.payment.transaction_id)
                order.payment.status = payment_result["status"]
                order.payment.save()
                updated += 1
        
        self.message_user(request, f'{updated} cash payments completed.')

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order_item_id', 'order', 'menu_item', 'quantity', 'price', 'calculated_price', 'ingredients_count')
    list_filter = ('menu_item__category', 'order__state')
    search_fields = ('order__customer__full_name', 'menu_item__name', 'order__order_id')
    readonly_fields = ('order_item_id', 'calculated_price')
    filter_horizontal = ('ingredients',)
    
    fieldsets = (
        ('Order Item Information', {
            'fields': ('order', 'menu_item', 'quantity', 'price', 'calculated_price')
        }),
        ('Customization', {
            'fields': ('ingredients',)
        }),
        ('System Information', {
            'fields': ('order_item_id',),
            'classes': ('collapse',)
        }),
    )
    
    def calculated_price(self, obj):
        if obj.pk:
            return f"SYP {obj.calculate_price():.2f}"
        return "Not calculated yet"
    calculated_price.short_description = "Calculated Price"
    
    def ingredients_count(self, obj):
        return obj.ingredients.count()
    ingredients_count.short_description = "Ingredients"

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_id', 'order', 'amount', 'payment_method', 'status', 'transaction_id', 'created_at')
    list_filter = ('status', 'payment_method__method', 'created_at')
    search_fields = ('order__customer__full_name', 'transaction_id', 'order__order_id')
    readonly_fields = ('payment_id', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Payment Information', {
            'fields': ('order', 'amount', 'payment_method', 'status')
        }),
        ('Transaction Details', {
            'fields': ('transaction_id',)
        }),
        ('System Information', {
            'fields': ('payment_id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(OrderItemModification)
class OrderItemModificationAdmin(admin.ModelAdmin):
    list_display = ('modification_id', 'order_item', 'ingredient', 'action', 'notes')
    list_filter = ('action',)
    search_fields = ('order_item__menu_item__name', 'ingredient__name')
    readonly_fields = ('modification_id',)
    
    fieldsets = (
        ('Modification Information', {
            'fields': ('order_item', 'ingredient', 'action')
        }),
        ('Additional Notes', {
            'fields': ('notes',)
        }),
        ('System Information', {
            'fields': ('modification_id',),
            'classes': ('collapse',)
        }),
    )

# Table and Reservation Admin Configuration

@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('table_id', 'table_number', 'capacity', 'location', 'is_available', 'current_status', 'created_at')
    list_filter = ('location', 'is_available', 'capacity')
    search_fields = ('table_number', 'description')
    readonly_fields = ('table_id', 'created_at', 'updated_at', 'current_status')
    list_editable = ('is_available',)
    ordering = ('table_number',)
    
    fieldsets = (
        ('Table Information', {
            'fields': ('table_number', 'capacity', 'location', 'is_available')
        }),
        ('Description', {
            'fields': ('description',)
        }),
        ('System Information', {
            'fields': ('table_id', 'created_at', 'updated_at', 'current_status'),
            'classes': ('collapse',)
        }),
    )
    
    def current_status(self, obj):
        """Show current table status"""
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        now = timezone.now()
        current_date = now.date()
        current_time = now.time()
        end_time = (now + timedelta(hours=2)).time()
        
        if not obj.is_available:
            return format_html('<span style="color: red; font-weight: bold;">🚫 Disabled</span>')
        
        if obj.is_available_for_time_slot(current_date, current_time, end_time):
            return format_html('<span style="color: green; font-weight: bold;">✅ Available</span>')
        else:
            return format_html('<span style="color: orange; font-weight: bold;">🕐 Occupied</span>')
    current_status.short_description = "Current Status"

class ReservationInline(admin.TabularInline):
    model = Reservation
    extra = 0
    readonly_fields = ('reservation_id', 'status', 'created_at')
    fields = ('reservation_id', 'contact_name', 'guest_count', 'reservation_date', 'start_time', 'status', 'created_at')
    ordering = ('-reservation_date', '-start_time')
    max_num = 5  # Show only 5 recent reservations

@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = (
        'reservation_id', 'contact_name', 'table', 'reservation_date', 'start_time', 
        'guest_count', 'status_badge', 'contact_phone', 'time_info', 'created_at'
    )
    list_filter = (
        'status', 'reservation_date', 'table__location', 'guest_count', 
        'created_at', 'table__table_number'
    )
    search_fields = (
        'contact_name', 'contact_phone', 'reservation_id', 
        'customer__full_name', 'table__table_number'
    )
    readonly_fields = (
        'reservation_id', 'created_at', 'updated_at', 
        'confirmed_at', 'checked_in_at', 'time_info', 'duration_hours'
    )
    date_hierarchy = 'reservation_date'
    ordering = ('-reservation_date', '-start_time')
    actions = [
        'confirm_reservations', 'check_in_reservations', 
        'complete_reservations', 'cancel_reservations', 'mark_no_show'
    ]
    
    fieldsets = (
        ('Reservation Details', {
            'fields': (
                'customer', 'table', 'reservation_date', 'start_time', 'end_time', 
                'guest_count', 'status'
            )
        }),
        ('Contact Information', {
            'fields': ('contact_name', 'contact_phone')
        }),
        ('Special Requirements', {
            'fields': ('special_requests', 'notes')
        }),
        ('Timestamps', {
            'fields': (
                'created_at', 'updated_at', 'confirmed_at', 
                'checked_in_at', 'duration_hours', 'time_info'
            ),
            'classes': ('collapse',)
        }),
        ('System Information', {
            'fields': ('reservation_id',),
            'classes': ('collapse',)
        }),
    )
    
    def status_badge(self, obj):
        """Display status with colored badge"""
        status_colors = {
            'pending': ('#ffc107', '⏳'),
            'confirmed': ('#28a745', '✅'),
            'checked_in': ('#17a2b8', '🏠'),
            'completed': ('#6c757d', '✨'),
            'cancelled': ('#dc3545', '❌'),
            'no_show': ('#fd7e14', '👻'),
        }
        
        color, icon = status_colors.get(obj.status, ('#6c757d', '❓'))
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">{} {}</span>',
            color, icon, obj.get_status_display()
        )
    status_badge.short_description = "Status"
    
    def time_info(self, obj):
        """Show time information"""
        if obj.is_upcoming:
            return format_html(
                '<span style="color: green;">⏰ {} until reservation</span>',
                obj.time_until_reservation
            )
        elif obj.is_today:
            return format_html('<span style="color: blue;">📅 Today</span>')
        else:
            return format_html('<span style="color: gray;">Past reservation</span>')
    time_info.short_description = "Time Info"
    
    # Custom admin actions
    @admin.action(description='Confirm selected reservations')
    def confirm_reservations(self, request, queryset):
        updated = 0
        for reservation in queryset:
            if reservation.confirm_reservation():
                updated += 1
        self.message_user(request, f'{updated} reservations confirmed.')
    
    @admin.action(description='Check in selected reservations')
    def check_in_reservations(self, request, queryset):
        updated = 0
        for reservation in queryset:
            if reservation.check_in():
                updated += 1
        self.message_user(request, f'{updated} reservations checked in.')
    
    @admin.action(description='Complete selected reservations')
    def complete_reservations(self, request, queryset):
        updated = 0
        for reservation in queryset:
            if reservation.complete_reservation():
                updated += 1
        self.message_user(request, f'{updated} reservations completed.')
    
    @admin.action(description='Cancel selected reservations')
    def cancel_reservations(self, request, queryset):
        updated = 0
        for reservation in queryset:
            if reservation.cancel_reservation():
                updated += 1
        self.message_user(request, f'{updated} reservations cancelled.')
    
    @admin.action(description='Mark selected reservations as No Show')
    def mark_no_show(self, request, queryset):
        updated = 0
        for reservation in queryset:
            if reservation.mark_no_show():
                updated += 1
        self.message_user(request, f'{updated} reservations marked as no show.')

# Add reservations inline to Table admin
TableAdmin.inlines = [ReservationInline]

# Customize admin site header and title
admin.site.site_header = "EcoFood Restaurant Dashboard"
admin.site.site_title = "EcoFood Admin"
admin.site.index_title = "Welcome to EcoFood Management Dashboard"
