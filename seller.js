const loginForm =
  document.getElementById("login-form");

const loginSection =
  document.getElementById("login-section");

const sellerSection =
  document.getElementById("seller-section");

const loginMessage =
  document.getElementById("login-message");

const logoutButton =
  document.getElementById("logout-button");

const dashboardAddItem =
  document.getElementById("dashboard-add-item");

const dashboardEditItems =
  document.getElementById("dashboard-edit-items");

const dashboardClaims =
  document.getElementById("dashboard-claims");

const dashboardSellerPage =
  document.getElementById("dashboard-seller-page");

const dashboardCategories =
  document.getElementById("dashboard-categories");

const addItemSection =
  document.getElementById("add-item-section");

const editItemsSection =
  document.getElementById("edit-items-section");

const claimsSection =
  document.getElementById("claims-section");

const sellerPageSection =
  document.getElementById("seller-page-section");

const categoriesSection =
  document.getElementById("categories-section");

const itemForm =
  document.getElementById("item-form");

const itemMessage =
  document.getElementById("item-message");

const ITEM_DESCRIPTION_MAX_LENGTH =
  150;

const itemDescriptionInput =
  document.getElementById(
    "item-description"
  );

itemDescriptionInput.maxLength =
  ITEM_DESCRIPTION_MAX_LENGTH;

itemDescriptionInput.title =
  `Maximum ${ITEM_DESCRIPTION_MAX_LENGTH} characters.`;

const inventoryList =
  document.getElementById("inventory-list");

const itemCategory =
  document.getElementById("item-category");

const categoryForm =
  document.getElementById("category-form");

const categoryNameInput =
  document.getElementById("category-name");

const categoryMessage =
  document.getElementById("category-message");

const categoryList =
  document.getElementById("category-list");

const inventoryMessage =
  document.createElement("p");

inventoryMessage.id =
  "inventory-message";

inventoryList.parentNode.insertBefore(
  inventoryMessage,
  inventoryList
);

function hideAllSellerWorkAreas() {
  addItemSection.hidden = true;
  editItemsSection.hidden = true;
  claimsSection.hidden = true;
  sellerPageSection.hidden = true;
  categoriesSection.hidden = true;
}

async function getCurrentSession() {
  const {
    data: { session }
  } =
    await window.supabaseClient.auth
      .getSession();

  return session;
}

const DEFAULT_ITEM_FIELD_PREFERENCES = [
  {
    field_key:
      "quantity",
    is_enabled:
      true,
    display_order:
      10
  },
  {
    field_key:
      "location",
    is_enabled:
      true,
    display_order:
      20
  },
  {
    field_key:
      "seller_item_number",
    is_enabled:
      true,
    display_order:
      30
  }
];

async function getSellerItemFieldPreferences() {
  const store =
    await loadCurrentStoreIdentity();

  if (!store) {
    return DEFAULT_ITEM_FIELD_PREFERENCES
      .map(
        (preference) => ({
          ...preference
        })
      );
  }

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from(
        "store_item_field_preferences"
      )
      .select(
        "field_key, is_enabled, display_order"
      )
      .eq(
        "store_id",
        store.id
      )
      .order(
        "display_order",
        {
          ascending:
            true
        }
      );

  if (error) {
    throw error;
  }

  const savedPreferences =
    new Map(
      (data || []).map(
        (preference) => [
          preference.field_key,
          preference
        ]
      )
    );

  return DEFAULT_ITEM_FIELD_PREFERENCES
    .map(
      (defaultPreference) => {
        const savedPreference =
          savedPreferences.get(
            defaultPreference.field_key
          );

        if (!savedPreference) {
          return {
            ...defaultPreference
          };
        }

        return {
          field_key:
            savedPreference.field_key,
          is_enabled:
            savedPreference.is_enabled ===
            true,
          display_order:
            Number(
              savedPreference.display_order
            )
        };
      }
    )
    .sort(
      (a, b) =>
        Number(a.display_order) -
        Number(b.display_order)
    );
}

function getSellerItemFieldPreference(
  preferences,
  fieldKey
) {
  return (
    preferences.find(
      (preference) =>
        preference.field_key ===
        fieldKey
    ) ||
    DEFAULT_ITEM_FIELD_PREFERENCES.find(
      (preference) =>
        preference.field_key ===
        fieldKey
    )
  );
}

async function applyAddItemFieldPreferences() {
  let preferences;

  try {
    preferences =
      await getSellerItemFieldPreferences();
  } catch (error) {
    itemMessage.textContent =
      error.message;

    return false;
  }

  const itemNameLabel =
    document.querySelector(
      'label[for="item-name"]'
    );

  if (!itemNameLabel) {
    itemMessage.textContent =
      "The Add Item form could not apply optional field preferences.";

    return false;
  }

  const fieldNodes = {
    quantity: {
      label:
        document.querySelector(
          'label[for="item-quantity"]'
        ),
      control:
        document.getElementById(
          "item-quantity"
        )
    },
    location: {
      label:
        document.querySelector(
          'label[for="item-location"]'
        ),
      control:
        document.getElementById(
          "item-location"
        ),
      extra:
        document.getElementById(
          "new-location-inline"
        )
    },
    seller_item_number: {
      label:
        document.querySelector(
          'label[for="item-seller-number"]'
        ),
      control:
        document.getElementById(
          "item-seller-number"
        )
    }
  };

  preferences.forEach(
    (preference) => {
      const field =
        fieldNodes[
          preference.field_key
        ];

      if (
        !field ||
        !field.label ||
        !field.control
      ) {
        return;
      }

      const enabled =
        preference.is_enabled ===
        true;

      field.label.hidden =
        !enabled;

      field.control.hidden =
        !enabled;

      if (
        preference.field_key ===
        "quantity"
      ) {
        field.control.required =
          enabled;

        if (!enabled) {
          field.control.value =
            "1";
        }
      }

      if (
        preference.field_key ===
        "location" &&
        !enabled
      ) {
        field.control.value =
          "";

        if (field.extra) {
          field.extra.hidden =
            true;
        }
      }

      if (
        preference.field_key ===
          "seller_item_number" &&
        !enabled
      ) {
        field.control.value =
          "";
      }

      itemForm.insertBefore(
        field.label,
        itemNameLabel
      );

      itemForm.insertBefore(
        field.control,
        itemNameLabel
      );

      if (
        preference.field_key ===
          "location" &&
        field.extra
      ) {
        itemForm.insertBefore(
          field.extra,
          itemNameLabel
        );
      }
    }
  );

  return true;
}

async function getSellerCategories() {
  const session =
    await getCurrentSession();

  if (!session) {
    return [];
  }

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("categories")
      .select("id, name")
      .eq(
        "seller_id",
        session.user.id
      )
      .order(
        "name",
        {
          ascending: true
        }
      );

  if (error) {
    return [];
  }

  return data || [];
}


async function showCurrentSession() {
  const session =
    await getCurrentSession();

  if (session) {
    loginSection.hidden = true;
    sellerSection.hidden = false;

    hideAllSellerWorkAreas();

    await loadInventory();
  } else {
    loginSection.hidden = false;
    sellerSection.hidden = true;

    hideAllSellerWorkAreas();

    inventoryList.innerHTML = "";
    inventoryMessage.textContent = "";
    categoryList.innerHTML = "";

    itemCategory.innerHTML =
      '<option value="">No Category</option>';
  }
}

async function loadItemCategoryOptions() {
  const session =
    await getCurrentSession();

  itemCategory.innerHTML =
    '<option value="">No Category</option>';

  if (!session) {
    return;
  }

  const categories =
    await getSellerCategories();

  categories.forEach(
    (category) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        category.id;

      option.textContent =
        category.name;

      itemCategory.appendChild(
        option
      );
    }
  );
}

async function renameCategory(
  categoryId,
  newName
) {
  const session =
    await getCurrentSession();

  if (!session) {
    categoryMessage.textContent =
      "You must be logged in.";

    return false;
  }

  const cleanedName =
    newName.trim();

  if (!cleanedName) {
    categoryMessage.textContent =
      "Category name cannot be blank.";

    return false;
  }

  categoryMessage.textContent =
    "Renaming category...";

  const {
    error
  } =
    await window.supabaseClient
      .from("categories")
      .update({
        name:
          cleanedName
      })
      .eq(
        "id",
        categoryId
      )
      .eq(
        "seller_id",
        session.user.id
      );

  if (error) {
    categoryMessage.textContent =
      error.message;

    return false;
  }

  categoryMessage.textContent =
    "Category renamed successfully.";

  await loadCategories();

  return true;
}

async function deleteCategory(
  category
) {
  const confirmed =
    window.confirm(
      `Delete category "${category.name}"?\n\n` +
      "Items assigned to this category will NOT be deleted. " +
      "They will become uncategorized."
    );

  if (!confirmed) {
    return;
  }

  const session =
    await getCurrentSession();

  if (!session) {
    categoryMessage.textContent =
      "You must be logged in.";

    return;
  }

  categoryMessage.textContent =
    "Deleting category...";

  const {
    error
  } =
    await window.supabaseClient
      .from("categories")
      .delete()
      .eq(
        "id",
        category.id
      )
      .eq(
        "seller_id",
        session.user.id
      );

  if (error) {
    categoryMessage.textContent =
      error.message;

    return;
  }

  categoryMessage.textContent =
    "Category deleted successfully.";

  await loadCategories();
}

async function loadCategories() {
  const session =
    await getCurrentSession();

  if (!session) {
    categoryList.innerHTML =
      "";

    return;
  }

  categoryMessage.textContent =
    "Loading categories...";

  const {
    data: categories,
    error
  } =
    await window.supabaseClient
      .from("categories")
      .select(
        "id, name, created_at"
      )
      .eq(
        "seller_id",
        session.user.id
      )
      .order(
        "name",
        {
          ascending: true
        }
      );

  if (error) {
    categoryMessage.textContent =
      error.message;

    categoryList.innerHTML =
      "";

    return;
  }

  categoryMessage.textContent =
    "";

  categoryList.innerHTML =
    "";

  if (
    !categories ||
    categories.length === 0
  ) {
    categoryList.textContent =
      "No categories created yet.";

    return;
  }

  categories.forEach(
    (category) => {
      const categoryRow =
        document.createElement(
          "div"
        );

      const categoryName =
        document.createElement(
          "span"
        );

      categoryName.textContent =
        category.name;

      const renameButton =
        document.createElement(
          "button"
        );

      renameButton.type =
        "button";

      renameButton.textContent =
        "Rename";

      const deleteButton =
        document.createElement(
          "button"
        );

      deleteButton.type =
        "button";

      deleteButton.textContent =
        "Delete";

      renameButton.addEventListener(
        "click",
        () => {
          categoryRow.innerHTML =
            "";

          const renameInput =
            document.createElement(
              "input"
            );

          renameInput.type =
            "text";

          renameInput.value =
            category.name;

          const saveButton =
            document.createElement(
              "button"
            );

          saveButton.type =
            "button";

          saveButton.textContent =
            "Save";

          const cancelButton =
            document.createElement(
              "button"
            );

          cancelButton.type =
            "button";

          cancelButton.textContent =
            "Cancel";

          saveButton.addEventListener(
            "click",
            async () => {
              await renameCategory(
                category.id,
                renameInput.value
              );
            }
          );

          cancelButton.addEventListener(
            "click",
            async () => {
              await loadCategories();
            }
          );

          categoryRow.appendChild(
            renameInput
          );

          categoryRow.appendChild(
            saveButton
          );

          categoryRow.appendChild(
            cancelButton
          );
        }
      );

      deleteButton.addEventListener(
        "click",
        async () => {
          await deleteCategory(
            category
          );
        }
      );

      categoryRow.appendChild(
        categoryName
      );

      categoryRow.appendChild(
        document.createTextNode(
          " "
        )
      );

      categoryRow.appendChild(
        renameButton
      );

      categoryRow.appendChild(
        document.createTextNode(
          " "
        )
      );

      categoryRow.appendChild(
        deleteButton
      );

      categoryList.appendChild(
        categoryRow
      );
    }
  );
}

loginForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    loginMessage.textContent =
      "Logging in...";

    const email =
      document
        .getElementById(
          "email"
        )
        .value
        .trim();

    const password =
      document
        .getElementById(
          "password"
        )
        .value;

    const {
      error
    } =
      await window.supabaseClient.auth
        .signInWithPassword({
          email,
          password
        });

    if (error) {
      loginMessage.textContent =
        error.message;

      return;
    }

    loginMessage.textContent =
      "";

    await showCurrentSession();
  }
);

logoutButton.addEventListener(
  "click",
  async () => {
    await window.supabaseClient.auth
      .signOut();

    await showCurrentSession();
  }
);

dashboardAddItem.addEventListener(
  "click",
  async () => {
    await applyAddItemFieldPreferences();
  }
);

dashboardEditItems.addEventListener(
  "click",
  async () => {
    hideAllSellerWorkAreas();

    editItemsSection.hidden =
      false;

    inventoryMessage.textContent =
      "";

    await loadInventory();
  }
);

dashboardClaims.addEventListener(
  "click",
  () => {
    hideAllSellerWorkAreas();

    claimsSection.hidden =
      false;
  }
);

dashboardSellerPage.addEventListener(
  "click",
  () => {
    hideAllSellerWorkAreas();

    sellerPageSection.hidden =
      false;
  }
);

dashboardCategories.addEventListener(
  "click",
  async () => {
    hideAllSellerWorkAreas();

    categoriesSection.hidden =
      false;

    await loadCategories();
  }
);

categoryForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const session =
      await getCurrentSession();

    if (!session) {
      categoryMessage.textContent =
        "You must be logged in.";

      return;
    }

    const categoryName =
      categoryNameInput.value.trim();

    if (!categoryName) {
      categoryMessage.textContent =
        "Please enter a category name.";

      return;
    }

    categoryMessage.textContent =
      "Adding category...";

    const {
      error
    } =
      await window.supabaseClient
        .from("categories")
        .insert({
          seller_id:
            session.user.id,
          name:
            categoryName
        });

    if (error) {
      categoryMessage.textContent =
        error.message;

      return;
    }

    categoryForm.reset();

    categoryMessage.textContent =
      "Category added successfully.";

    await loadCategories();
  }
);

window.supabaseClient.auth
  .onAuthStateChange(
    () => {
      showCurrentSession();
    }
  );

showCurrentSession();