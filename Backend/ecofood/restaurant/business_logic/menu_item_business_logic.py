from restaurant.repositories.menu_item_repository import MenuItemRepository

class MenuItemBusinessLogic:
    def init(self):
        self.repo = MenuItemRepository()

    def add_menu_item(self, item_data):
        return self.repo.create_menu_item(item_data)

    def update_menu_item(self, item_id, item_data):
        return self.repo.update_menu_item(item_id, item_data)

    def remove_menu_item(self, item_id):
        return self.repo.delete_menu_item(item_id)