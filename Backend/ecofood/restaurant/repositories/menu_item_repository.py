from restaurant.models import MenuItem

class MenuItemRepository:
    def get_menu_item(self, item_id):
        return MenuItem.objects.get(id=item_id)

    def get_all_menu_items(self):
        return MenuItem.objects.all()

    def create_menu_item(self, item_data):
        return MenuItem.objects.create(**item_data)

    def update_menu_item(self, item_id, item_data):
        item = self.get_menu_item(item_id)
        for key, value in item_data.items():
            setattr(item, key, value)
        item.save()
        return item

    def delete_menu_item(self, item_id):
        item = self.get_menu_item(item_id)
        item.delete()