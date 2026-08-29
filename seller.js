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

async function getItemImages(item) {
  const session =
    await getCurrentSession();

  const store =
    await loadCurrentStoreIdentity();

  if (
    !session ||
    !store
  ) {
    return [];
  }

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("item_images")
      .select(
        "id, image_path, sort_order"
      )
      .eq(
        "seller_id",
        session.user.id
      )
      .eq(
        "store_id",
        store.id
      )
      .eq(
        "item_id",
        item.id
      )
      .order(
        "sort_order",
        {
          ascending: true
        }
      );

  if (error) {
    inventoryMessage.textContent =
      error.message;

    return [];
  }

  if (
    data &&
    data.length > 0
  ) {
    return data;
  }

  if (item.image_path) {
    return [
      {
        id: null,
        image_path:
          item.image_path,
        sort_order:
          1
      }
    ];
  }

  return [];
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

async function getBuyerSlots() {
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
      .from("buyer_slots")
      .select(
        "position, item_id"
      )
      .eq(
        "seller_id",
        session.user.id
      );

  if (error) {
    inventoryMessage.textContent =
      error.message;

    return [];
  }

  return data || [];
}

async function assignBuyerPosition(
  itemId,
  position
) {
  const session =
    await getCurrentSession();

  if (!session) {
    inventoryMessage.textContent =
      "You must be logged in.";

    return;
  }

  inventoryMessage.textContent =
    `Assigning item to Buyer Position ${position}...`;

  const {
    error: clearError
  } =
    await window.supabaseClient
      .from("buyer_slots")
      .update({
        item_id: null
      })
      .eq(
        "seller_id",
        session.user.id
      )
      .eq(
        "item_id",
        itemId
      )
      .neq(
        "position",
        position
      );

  if (clearError) {
    inventoryMessage.textContent =
      clearError.message;

    return;
  }

  const {
    error: assignError
  } =
    await window.supabaseClient
      .from("buyer_slots")
      .upsert(
        {
          seller_id:
            session.user.id,
          position,
          item_id:
            itemId
        },
        {
          onConflict:
            "seller_id,position"
        }
      );

  if (assignError) {
    inventoryMessage.textContent =
      assignError.message;

    return;
  }

  inventoryMessage.textContent =
    `Item assigned to Buyer Position ${position}.`;

  await loadInventory();
}

async function setItemPublished(
  item,
  shouldPublish
) {
  const session =
    await getCurrentSession();

  if (!session) {
    inventoryMessage.textContent =
      "You must be logged in.";

    return false;
  }

  inventoryMessage.textContent =
    shouldPublish
      ? "Publishing item..."
      : "Unpublishing item...";

  const {
    error
  } =
    await window.supabaseClient
      .from("items")
      .update({
        is_published:
          shouldPublish
      })
      .eq(
        "id",
        item.id
      )
      .eq(
        "seller_id",
        session.user.id
      );

  if (error) {
    inventoryMessage.textContent =
      error.message;

    return false;
  }

  const {
    error: slotNudgeError
  } =
    await window.supabaseClient
      .from("buyer_slots")
      .update({
        item_id:
          item.id
      })
      .eq(
        "seller_id",
        session.user.id
      )
      .eq(
        "item_id",
        item.id
      );

  inventoryMessage.textContent =
    slotNudgeError
      ? (
          shouldPublish
            ? "Item published, but the buyer page realtime refresh signal failed."
            : "Item unpublished, but the buyer page realtime refresh signal failed."
        )
      : (
          shouldPublish
            ? "Item published successfully."
            : "Item unpublished successfully."
        );

  await loadInventory();

  return true;
}

async function deleteItem(item) {
  const confirmed =
    window.confirm(
      `Delete "${item.name}" from seller inventory?`
    );

  if (!confirmed) {
    return;
  }

  const session =
    await getCurrentSession();

  if (!session) {
    inventoryMessage.textContent =
      "You must be logged in.";

    return;
  }

  inventoryMessage.textContent =
    "Deleting item...";

  const {
    data: imageRows
  } =
    await window.supabaseClient
      .from("item_images")
      .select("image_path")
      .eq(
        "seller_id",
        session.user.id
      )
      .eq(
        "item_id",
        item.id
      );

  const imagePaths =
    Array.from(
      new Set(
        [
          ...(imageRows || [])
            .map(
              (row) =>
                row.image_path
            ),
          item.image_path
        ].filter(Boolean)
      )
    );

  const {
    error: deleteError
  } =
    await window.supabaseClient
      .from("items")
      .delete()
      .eq(
        "id",
        item.id
      )
      .eq(
        "seller_id",
        session.user.id
      );

  if (deleteError) {
    inventoryMessage.textContent =
      deleteError.message;

    return;
  }

  if (imagePaths.length > 0) {
    const {
      error: imageDeleteError
    } =
      await window.supabaseClient.storage
        .from("product_images")
        .remove(
          imagePaths
        );

    if (imageDeleteError) {
      inventoryMessage.textContent =
        "Item deleted, but one or more stored images could not be removed.";

      await loadInventory();

      return;
    }
  }

  inventoryMessage.textContent =
    "Item deleted successfully.";

  await loadInventory();
}

async function updateItem(
  item,
  newName,
  newPrice,
  newDescription,
  newCategoryId
) {
  const session =
    await getCurrentSession();

  if (!session) {
    inventoryMessage.textContent =
      "You must be logged in.";

    return false;
  }

  const cleanedName =
    newName.trim();

  const cleanedDescription =
    newDescription.trim();

  if (!cleanedName) {
    inventoryMessage.textContent =
      "Item name cannot be blank.";

    return false;
  }

  if (
    newPrice === "" ||
    Number.isNaN(
      Number(newPrice)
    ) ||
    Number(newPrice) < 0
  ) {
    inventoryMessage.textContent =
      "Please enter a valid price.";

    return false;
  }

  if (!cleanedDescription) {
    inventoryMessage.textContent =
      "Description cannot be blank.";

    return false;
  }

  if (
    cleanedDescription.length >
    ITEM_DESCRIPTION_MAX_LENGTH
  ) {
    inventoryMessage.textContent =
      `Description must be ${ITEM_DESCRIPTION_MAX_LENGTH} characters or fewer.`;

    return false;
  }

  const categoryId =
    newCategoryId
      ? Number(newCategoryId)
      : null;

  inventoryMessage.textContent =
    "Saving item changes...";

  const {
    error
  } =
    await window.supabaseClient
      .from("items")
      .update({
        name:
          cleanedName,
        price:
          Number(newPrice),
        description:
          cleanedDescription,
        category_id:
          categoryId
      })
      .eq(
        "id",
        item.id
      )
      .eq(
        "seller_id",
        session.user.id
      );

  if (error) {
    inventoryMessage.textContent =
      error.message;

    return false;
  }

  await loadInventory();

  inventoryMessage.textContent =
    "Item updated successfully.";

  return true;
}

async function replaceItemImage(
  item,
  imageRecord,
  replacementFile
) {
  const session =
    await getCurrentSession();

  const store =
    await loadCurrentStoreIdentity();

  if (
    !session ||
    !store
  ) {
    inventoryMessage.textContent =
      "You must be logged in with a store assigned.";

    return false;
  }

  if (!imageRecord.id) {
    inventoryMessage.textContent =
      "This older image has not yet been migrated to the multi-image system.";

    return false;
  }

  if (!replacementFile) {
    inventoryMessage.textContent =
      `Please choose a replacement for Image ${imageRecord.sort_order}.`;

    return false;
  }

  inventoryMessage.textContent =
    `Uploading replacement for Image ${imageRecord.sort_order}...`;

  const extension =
    replacementFile.name
      .split(".")
      .pop();

  const newImagePath =
    `${session.user.id}/` +
    `${Date.now()}-` +
    `${imageRecord.sort_order}.` +
    `${extension}`;

  const oldImagePath =
    imageRecord.image_path;

  const {
    error: uploadError
  } =
    await window.supabaseClient.storage
      .from("product_images")
      .upload(
        newImagePath,
        replacementFile
      );

  if (uploadError) {
    inventoryMessage.textContent =
      uploadError.message;

    return false;
  }

  const {
    error: imageRecordError
  } =
    await window.supabaseClient
      .from("item_images")
      .update({
        image_path:
          newImagePath
      })
      .eq(
        "id",
        imageRecord.id
      )
      .eq(
        "item_id",
        item.id
      )
      .eq(
        "seller_id",
        session.user.id
      )
      .eq(
        "store_id",
        store.id
      );

  if (imageRecordError) {
    await window.supabaseClient.storage
      .from("product_images")
      .remove([
        newImagePath
      ]);

    inventoryMessage.textContent =
      imageRecordError.message;

    return false;
  }

  if (
    Number(
      imageRecord.sort_order
    ) === 1
  ) {
    const {
      error: bridgeError
    } =
      await window.supabaseClient
        .from("items")
        .update({
          image_path:
            newImagePath
        })
        .eq(
          "id",
          item.id
        )
        .eq(
          "seller_id",
          session.user.id
        )
        .eq(
          "store_id",
          store.id
        );

    if (bridgeError) {
      const {
        error: rollbackError
      } =
        await window.supabaseClient
          .from("item_images")
          .update({
            image_path:
              oldImagePath
          })
          .eq(
            "id",
            imageRecord.id
          )
          .eq(
            "item_id",
            item.id
          )
          .eq(
            "seller_id",
            session.user.id
          )
          .eq(
            "store_id",
            store.id
          );

      if (!rollbackError) {
        await window.supabaseClient.storage
          .from("product_images")
          .remove([
            newImagePath
          ]);
      }

      inventoryMessage.textContent =
        rollbackError
          ? "Image 1 replacement failed and automatic rollback was incomplete. Stop here and inspect Supabase."
          : bridgeError.message;

      return false;
    }
  }

  imageRecord.image_path =
    newImagePath;

  if (
    Number(
      imageRecord.sort_order
    ) === 1
  ) {
    item.image_path =
      newImagePath;
  }

  if (
    oldImagePath &&
    oldImagePath !==
      newImagePath
  ) {
    const {
      error: removeOldError
    } =
      await window.supabaseClient.storage
        .from("product_images")
        .remove([
          oldImagePath
        ]);

    if (removeOldError) {
      inventoryMessage.textContent =
        `Image ${imageRecord.sort_order} was replaced, but the previous stored file could not be removed.`;

      return true;
    }
  }

  inventoryMessage.textContent =
    `Image ${imageRecord.sort_order} replaced successfully.`;

  return true;
}

async function removeItemImage(
  item,
  imageRecord
) {
  const session =
    await getCurrentSession();

  const store =
    await loadCurrentStoreIdentity();

  if (
    !session ||
    !store
  ) {
    inventoryMessage.textContent =
      "You must be logged in with a store assigned.";

    return false;
  }

  if (!imageRecord.id) {
    inventoryMessage.textContent =
      "This older image has not yet been migrated to the multi-image system.";

    return false;
  }

  if (
    Number(
      imageRecord.sort_order
    ) === 1
  ) {
    inventoryMessage.textContent =
      "Image 1 is the required primary image and cannot be removed.";

    return false;
  }

  const images =
    await getItemImages(item);

  if (
    images.length <= 1
  ) {
    inventoryMessage.textContent =
      "An item must have at least one picture.";

    return false;
  }

  const confirmed =
    window.confirm(
      `Remove Image ${imageRecord.sort_order} from this item?`
    );

  if (!confirmed) {
    return false;
  }

  inventoryMessage.textContent =
    `Removing Image ${imageRecord.sort_order}...`;

  const oldImagePath =
    imageRecord.image_path;

  const {
    error: deleteRecordError
  } =
    await window.supabaseClient
      .from("item_images")
      .delete()
      .eq(
        "id",
        imageRecord.id
      )
      .eq(
        "item_id",
        item.id
      )
      .eq(
        "seller_id",
        session.user.id
      )
      .eq(
        "store_id",
        store.id
      );

  if (deleteRecordError) {
    inventoryMessage.textContent =
      deleteRecordError.message;

    return false;
  }

  const remainingImages =
    images
      .filter(
        (image) =>
          image.id !==
          imageRecord.id
      )
      .sort(
        (a, b) =>
          Number(a.sort_order) -
          Number(b.sort_order)
      );

  for (
    let index = 0;
    index <
      remainingImages.length;
    index += 1
  ) {
    const image =
      remainingImages[index];

    const newSortOrder =
      index + 1;

    if (
      Number(
        image.sort_order
      ) ===
      newSortOrder
    ) {
      continue;
    }

    const {
      error: reorderError
    } =
      await window.supabaseClient
        .from("item_images")
        .update({
          sort_order:
            newSortOrder
        })
        .eq(
          "id",
          image.id
        )
        .eq(
          "item_id",
          item.id
        )
        .eq(
          "seller_id",
          session.user.id
        )
        .eq(
          "store_id",
          store.id
        );

    if (reorderError) {
      inventoryMessage.textContent =
        "The picture was removed, but image numbering could not be completed. Stop here and inspect Supabase.";

      return false;
    }
  }

  if (oldImagePath) {
    const {
      error: storageError
    } =
      await window.supabaseClient.storage
        .from("product_images")
        .remove([
          oldImagePath
        ]);

    if (storageError) {
      inventoryMessage.textContent =
        "The image was removed from the item, but its stored file could not be removed.";

      return true;
    }
  }

  inventoryMessage.textContent =
    "Image removed successfully.";

  return true;
}

async function addItemImage(
  item,
  imageFile
) {
  const session =
    await getCurrentSession();

  const store =
    await loadCurrentStoreIdentity();

  if (
    !session ||
    !store
  ) {
    inventoryMessage.textContent =
      "You must be logged in with a store assigned.";

    return false;
  }

  if (!imageFile) {
    inventoryMessage.textContent =
      "Please choose a picture to add.";

    return false;
  }

  const images =
    await getItemImages(item);

  if (
    images.length >= 4
  ) {
    inventoryMessage.textContent =
      "This item already has the maximum of 4 pictures.";

    return false;
  }

  const newSortOrder =
    images.length + 1;

  inventoryMessage.textContent =
    `Uploading Image ${newSortOrder}...`;

  const extension =
    imageFile.name
      .split(".")
      .pop();

  const newImagePath =
    `${session.user.id}/` +
    `${Date.now()}-` +
    `${newSortOrder}.` +
    `${extension}`;

  const {
    error: uploadError
  } =
    await window.supabaseClient.storage
      .from("product_images")
      .upload(
        newImagePath,
        imageFile
      );

  if (uploadError) {
    inventoryMessage.textContent =
      uploadError.message;

    return false;
  }

  const {
    error: insertError
  } =
    await window.supabaseClient
      .from("item_images")
      .insert({
        seller_id:
          session.user.id,
        store_id:
          store.id,
        item_id:
          item.id,
        image_path:
          newImagePath,
        sort_order:
          newSortOrder
      });

  if (insertError) {
    await window.supabaseClient.storage
      .from("product_images")
      .remove([
        newImagePath
      ]);

    inventoryMessage.textContent =
      insertError.message;

    return false;
  }

  inventoryMessage.textContent =
    `Image ${newSortOrder} added successfully.`;

  return true;
}

async function moveItemImage(
  item,
  imageRecord,
  direction
) {
  const session =
    await getCurrentSession();

  const store =
    await loadCurrentStoreIdentity();

  if (
    !session ||
    !store
  ) {
    inventoryMessage.textContent =
      "You must be logged in with a store assigned.";

    return false;
  }

  if (!imageRecord.id) {
    inventoryMessage.textContent =
      "This older image has not yet been migrated to the multi-image system.";

    return false;
  }

  const images =
    await getItemImages(item);

  const currentOrder =
    Number(
      imageRecord.sort_order
    );

  const targetOrder =
    direction === "up"
      ? currentOrder - 1
      : currentOrder + 1;

  if (
    targetOrder < 1 ||
    targetOrder >
      images.length
  ) {
    return false;
  }

  const targetImage =
    images.find(
      (image) =>
        Number(
          image.sort_order
        ) ===
        targetOrder
    );

  if (
    !targetImage ||
    !targetImage.id
  ) {
    inventoryMessage.textContent =
      "The adjacent image could not be found.";

    return false;
  }

  inventoryMessage.textContent =
    `Moving Image ${currentOrder}...`;

  const {
    error: firstMoveError
  } =
    await window.supabaseClient
      .from("item_images")
      .update({
        sort_order:
          targetOrder
      })
      .eq(
        "id",
        imageRecord.id
      )
      .eq(
        "item_id",
        item.id
      )
      .eq(
        "seller_id",
        session.user.id
      )
      .eq(
        "store_id",
        store.id
      );

  if (firstMoveError) {
    inventoryMessage.textContent =
      firstMoveError.message;

    return false;
  }

  const {
    error: secondMoveError
  } =
    await window.supabaseClient
      .from("item_images")
      .update({
        sort_order:
          currentOrder
      })
      .eq(
        "id",
        targetImage.id
      )
      .eq(
        "item_id",
        item.id
      )
      .eq(
        "seller_id",
        session.user.id
      )
      .eq(
        "store_id",
        store.id
      );

  if (secondMoveError) {
    const {
      error: rollbackError
    } =
      await window.supabaseClient
        .from("item_images")
        .update({
          sort_order:
            currentOrder
        })
        .eq(
          "id",
          imageRecord.id
        )
        .eq(
          "item_id",
          item.id
        )
        .eq(
          "seller_id",
          session.user.id
        )
        .eq(
          "store_id",
          store.id
        );

    inventoryMessage.textContent =
      rollbackError
        ? "Image reorder failed and automatic rollback was incomplete. Stop here and inspect Supabase."
        : secondMoveError.message;

    return false;
  }

  const reorderedImages =
    await getItemImages(item);

  const primaryImage =
    reorderedImages.find(
      (image) =>
        Number(
          image.sort_order
        ) === 1
    );

  if (!primaryImage) {
    inventoryMessage.textContent =
      "Image order changed, but the primary image could not be identified. Stop here and inspect Supabase.";

    return false;
  }

  const {
    error: bridgeError
  } =
    await window.supabaseClient
      .from("items")
      .update({
        image_path:
          primaryImage.image_path
      })
      .eq(
        "id",
        item.id
      )
      .eq(
        "seller_id",
        session.user.id
      )
      .eq(
        "store_id",
        store.id
      );

  if (bridgeError) {
    const {
      error: rollbackFirstError
    } =
      await window.supabaseClient
        .from("item_images")
        .update({
          sort_order:
            currentOrder
        })
        .eq(
          "id",
          imageRecord.id
        )
        .eq(
          "item_id",
          item.id
        )
        .eq(
          "seller_id",
          session.user.id
        )
        .eq(
          "store_id",
          store.id
        );

    const {
      error: rollbackSecondError
    } =
      await window.supabaseClient
        .from("item_images")
        .update({
          sort_order:
            targetOrder
        })
        .eq(
          "id",
          targetImage.id
        )
        .eq(
          "item_id",
          item.id
        )
        .eq(
          "seller_id",
          session.user.id
        )
        .eq(
          "store_id",
          store.id
        );

    inventoryMessage.textContent =
      rollbackFirstError ||
      rollbackSecondError
        ? "Primary image update failed and automatic reorder rollback was incomplete. Stop here and inspect Supabase."
        : bridgeError.message;

    return false;
  }

  item.image_path =
    primaryImage.image_path;

  inventoryMessage.textContent =
    `Image moved to position ${targetOrder}.`;

  return true;
}

async function showItemEditor(
  itemContainer,
  item,
  categories
) {
  itemContainer.innerHTML =
    "";

  const imageSection =
    document.createElement("div");

  imageSection.style.marginBottom =
    "24px";

  itemContainer.appendChild(
    imageSection
  );

  const editor =
    document.createElement("div");

  const nameLabel =
    document.createElement("label");

  nameLabel.textContent =
    "Item Name";

  const nameInput =
    document.createElement("input");

  nameInput.type =
    "text";

  nameInput.value =
    item.name;

  const priceLabel =
    document.createElement("label");

  priceLabel.textContent =
    "Price";

  const priceInput =
    document.createElement("input");

  priceInput.type =
    "number";

  priceInput.min =
    "0";

  priceInput.step =
    "0.01";

  priceInput.value =
    item.price;

  const descriptionLabel =
    document.createElement("label");

  descriptionLabel.textContent =
    `Description (maximum ${ITEM_DESCRIPTION_MAX_LENGTH} characters)`;

  const descriptionInput =
    document.createElement(
      "textarea"
    );

  descriptionInput.value =
    item.description;

  descriptionInput.maxLength =
    ITEM_DESCRIPTION_MAX_LENGTH;

  descriptionInput.title =
    `Maximum ${ITEM_DESCRIPTION_MAX_LENGTH} characters.`;

  const categoryLabel =
    document.createElement("label");

  categoryLabel.textContent =
    "Category";

  const categorySelect =
    document.createElement(
      "select"
    );

  const noCategoryOption =
    document.createElement(
      "option"
    );

  noCategoryOption.value =
    "";

  noCategoryOption.textContent =
    "No Category";

  categorySelect.appendChild(
    noCategoryOption
  );

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

      if (
        item.category_id !== null &&
        Number(
          item.category_id
        ) ===
          Number(
            category.id
          )
      ) {
        option.selected =
          true;
      }

      categorySelect.appendChild(
        option
      );
    }
  );

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
      await updateItem(
        item,
        nameInput.value,
        priceInput.value,
        descriptionInput.value,
        categorySelect.value
      );
    }
  );

  cancelButton.addEventListener(
    "click",
    async () => {
      inventoryMessage.textContent =
        "";

      await loadInventory();
    }
  );

  editor.appendChild(
    nameLabel
  );

  editor.appendChild(
    document.createTextNode(
      " "
    )
  );

  editor.appendChild(
    nameInput
  );

  editor.appendChild(
    document.createElement(
      "br"
    )
  );

  editor.appendChild(
    priceLabel
  );

  editor.appendChild(
    document.createTextNode(
      " "
    )
  );

  editor.appendChild(
    priceInput
  );

  editor.appendChild(
    document.createElement(
      "br"
    )
  );

  editor.appendChild(
    descriptionLabel
  );

  editor.appendChild(
    document.createTextNode(
      " "
    )
  );

  editor.appendChild(
    descriptionInput
  );

  editor.appendChild(
    document.createElement(
      "br"
    )
  );

  editor.appendChild(
    categoryLabel
  );

  editor.appendChild(
    document.createTextNode(
      " "
    )
  );

  editor.appendChild(
    categorySelect
  );

  editor.appendChild(
    document.createElement(
      "br"
    )
  );

  editor.appendChild(
    saveButton
  );

  editor.appendChild(
    document.createTextNode(
      " "
    )
  );

  editor.appendChild(
    cancelButton
  );

  itemContainer.appendChild(
    editor
  );

  async function renderImages() {
    inventoryMessage.textContent =
      "Loading item pictures...";

    const images =
      await getItemImages(item);

    imageSection.innerHTML =
      "";

    inventoryMessage.textContent =
      "";

    const imageHeading =
      document.createElement(
        "h3"
      );

    imageHeading.textContent =
      "Current Pictures";

    imageHeading.style.marginBottom =
      "12px";

    imageSection.appendChild(
      imageHeading
    );

    if (
      images.length === 0
    ) {
      const noImagesMessage =
        document.createElement(
          "p"
        );

      noImagesMessage.textContent =
        "No pictures found.";

      imageSection.appendChild(
        noImagesMessage
      );

      return;
    }

    const imageGrid =
      document.createElement(
        "div"
      );

    imageGrid.style.display =
      "grid";

    imageGrid.style.gridTemplateColumns =
      "repeat(auto-fit, minmax(180px, 1fr))";

    imageGrid.style.gap =
      "14px";

    imageGrid.style.alignItems =
      "start";

    images.forEach(
      (image) => {
        const imageContainer =
          document.createElement(
            "div"
          );

        imageContainer.style.border =
          "1px solid #d0d0d0";

        imageContainer.style.borderRadius =
          "10px";

        imageContainer.style.padding =
          "10px";

        imageContainer.style.boxSizing =
          "border-box";

        imageContainer.style.background =
          "#ffffff";

        const imageHeader =
          document.createElement(
            "div"
          );

        imageHeader.style.display =
          "flex";

        imageHeader.style.alignItems =
          "center";

        imageHeader.style.justifyContent =
          "space-between";

        imageHeader.style.gap =
          "8px";

        imageHeader.style.marginBottom =
          "8px";

        const imageLabel =
          document.createElement(
            "strong"
          );

        imageLabel.textContent =
          `Image ${image.sort_order}`;

        imageHeader.appendChild(
          imageLabel
        );

        if (
          Number(
            image.sort_order
          ) === 1
        ) {
          const primaryBadge =
            document.createElement(
              "span"
            );

          primaryBadge.textContent =
            "Primary";

          primaryBadge.style.fontSize =
            "12px";

          primaryBadge.style.fontWeight =
            "700";

          primaryBadge.style.padding =
            "3px 7px";

          primaryBadge.style.border =
            "1px solid #555";

          primaryBadge.style.borderRadius =
            "999px";

          primaryBadge.style.whiteSpace =
            "nowrap";

          imageHeader.appendChild(
            primaryBadge
          );
        }

        const {
          data: imageData
        } =
          window.supabaseClient.storage
            .from(
              "product_images"
            )
            .getPublicUrl(
              image.image_path
            );

        const itemImage =
          document.createElement(
            "img"
          );

        itemImage.src =
          imageData.publicUrl;

        itemImage.alt =
          `${item.name} image ${image.sort_order}`;

        itemImage.style.display =
          "block";

        itemImage.style.width =
          "100%";

        itemImage.style.aspectRatio =
          "1 / 1";

        itemImage.style.objectFit =
          "cover";

        itemImage.style.borderRadius =
          "8px";

        itemImage.style.marginBottom =
          "10px";

        imageContainer.appendChild(
          imageHeader
        );

        imageContainer.appendChild(
          itemImage
        );

        if (image.id) {
          const moveContainer =
            document.createElement(
              "div"
            );

          moveContainer.style.display =
            "flex";

          moveContainer.style.flexWrap =
            "wrap";

          moveContainer.style.gap =
            "6px";

          moveContainer.style.marginBottom =
            "10px";

          if (
            Number(
              image.sort_order
            ) > 1
          ) {
            const moveUpButton =
              document.createElement(
                "button"
              );

            moveUpButton.type =
              "button";

            moveUpButton.textContent =
              "Move Up";

            moveUpButton.addEventListener(
              "click",
              async () => {
                const moved =
                  await moveItemImage(
                    item,
                    image,
                    "up"
                  );

                if (!moved) {
                  return;
                }

                await renderImages();
              }
            );

            moveContainer.appendChild(
              moveUpButton
            );
          }

          if (
            Number(
              image.sort_order
            ) <
            images.length
          ) {
            const moveDownButton =
              document.createElement(
                "button"
              );

            moveDownButton.type =
              "button";

            moveDownButton.textContent =
              "Move Down";

            moveDownButton.addEventListener(
              "click",
              async () => {
                const moved =
                  await moveItemImage(
                    item,
                    image,
                    "down"
                  );

                if (!moved) {
                  return;
                }

                await renderImages();
              }
            );

            moveContainer.appendChild(
              moveDownButton
            );
          }

          if (
            moveContainer.childNodes
              .length > 0
          ) {
            imageContainer.appendChild(
              moveContainer
            );
          }

          const replaceContainer =
            document.createElement(
              "div"
            );

          replaceContainer.style.marginBottom =
            "8px";

          const replaceLabel =
            document.createElement(
              "label"
            );

          replaceLabel.textContent =
            `Replace Image ${image.sort_order}`;

          replaceLabel.style.display =
            "block";

          replaceLabel.style.fontSize =
            "13px";

          replaceLabel.style.fontWeight =
            "600";

          replaceLabel.style.marginBottom =
            "6px";

          const replaceInput =
            document.createElement(
              "input"
            );

          replaceInput.type =
            "file";

          replaceInput.accept =
            "image/jpeg,image/png,image/webp";

          replaceInput.style.display =
            "none";

          const chooseFileButton =
            document.createElement(
              "button"
            );

          chooseFileButton.type =
            "button";

          chooseFileButton.textContent =
            "Choose File";

          chooseFileButton.style.display =
            "block";

          chooseFileButton.style.marginBottom =
            "5px";

          const selectedFileName =
            document.createElement(
              "div"
            );

          selectedFileName.textContent =
            "No file chosen";

          selectedFileName.style.fontSize =
            "12px";

          selectedFileName.style.lineHeight =
            "1.3";

          selectedFileName.style.minHeight =
            "16px";

          selectedFileName.style.marginBottom =
            "8px";

          selectedFileName.style.overflowWrap =
            "anywhere";

          chooseFileButton.addEventListener(
            "click",
            () => {
              replaceInput.click();
            }
          );

          replaceInput.addEventListener(
            "change",
            () => {
              const selectedFile =
                replaceInput.files[0] ||
                null;

              selectedFileName.textContent =
                selectedFile
                  ? selectedFile.name
                  : "No file chosen";
            }
          );

          const replaceButton =
            document.createElement(
              "button"
            );

          replaceButton.type =
            "button";

          replaceButton.textContent =
            "Replace";

          replaceButton.addEventListener(
            "click",
            async () => {
              const replacementFile =
                replaceInput.files[0] ||
                null;

              const replaced =
                await replaceItemImage(
                  item,
                  image,
                  replacementFile
                );

              if (!replaced) {
                return;
              }

              await renderImages();
            }
          );

          replaceContainer.appendChild(
            replaceLabel
          );

          replaceContainer.appendChild(
            replaceInput
          );

          replaceContainer.appendChild(
            chooseFileButton
          );

          replaceContainer.appendChild(
            selectedFileName
          );

          replaceContainer.appendChild(
            replaceButton
          );

          imageContainer.appendChild(
            replaceContainer
          );

          if (
            Number(
              image.sort_order
            ) === 1
          ) {
            const primaryMessage =
              document.createElement(
                "p"
              );

            primaryMessage.textContent =
              "Primary image — cannot be removed.";

            primaryMessage.style.fontSize =
              "12px";

            primaryMessage.style.margin =
              "8px 0 0";

            imageContainer.appendChild(
              primaryMessage
            );
          } else {
            const removeButton =
              document.createElement(
                "button"
              );

            removeButton.type =
              "button";

            removeButton.textContent =
              `Remove Image ${image.sort_order}`;

            removeButton.addEventListener(
              "click",
              async () => {
                const removed =
                  await removeItemImage(
                    item,
                    image
                  );

                if (!removed) {
                  return;
                }

                await renderImages();
              }
            );

            imageContainer.appendChild(
              removeButton
            );
          }
        } else {
          const legacyMessage =
            document.createElement(
              "p"
            );

          legacyMessage.textContent =
            "Legacy image — migration required before image editing.";

          legacyMessage.style.fontSize =
            "12px";

          imageContainer.appendChild(
            legacyMessage
          );
        }

        imageGrid.appendChild(
          imageContainer
        );
      }
    );

    imageSection.appendChild(
      imageGrid
    );

    if (
      images.length < 4
    ) {
      const addSection =
        document.createElement(
          "div"
        );

      addSection.style.border =
        "1px dashed #999";

      addSection.style.borderRadius =
        "10px";

      addSection.style.padding =
        "12px";

      addSection.style.marginTop =
        "14px";

      addSection.style.maxWidth =
        "320px";

      addSection.style.boxSizing =
        "border-box";

      const addHeading =
        document.createElement(
          "h4"
        );

      addHeading.textContent =
        `Add Image ${images.length + 1}`;

      addHeading.style.margin =
        "0 0 8px";

      const addInput =
        document.createElement(
          "input"
        );

      addInput.type =
        "file";

      addInput.accept =
        "image/jpeg,image/png,image/webp";

      addInput.style.display =
        "block";

      addInput.style.width =
        "100%";

      addInput.style.boxSizing =
        "border-box";

      addInput.style.marginBottom =
        "8px";

      const addButton =
        document.createElement(
          "button"
        );

      addButton.type =
        "button";

      addButton.textContent =
        "Add Image";

      addButton.addEventListener(
        "click",
        async () => {
          const imageFile =
            addInput.files[0] ||
            null;

          const added =
            await addItemImage(
              item,
              imageFile
            );

          if (!added) {
            return;
          }

          await renderImages();
        }
      );

      addSection.appendChild(
        addHeading
      );

      addSection.appendChild(
        addInput
      );

      addSection.appendChild(
        addButton
      );

      imageSection.appendChild(
        addSection
      );
    }
  }

  await renderImages();
}

async function loadInventory() {
  const session =
    await getCurrentSession();

  if (!session) {
    inventoryList.innerHTML =
      "";

    return;
  }

  const [
    itemsResult,
    buyerSlots,
    categories
  ] =
    await Promise.all([
      window.supabaseClient
        .from("items")
        .select(
          "id, name, price, description, image_path, category_id, is_published"
        )
        .eq(
          "seller_id",
          session.user.id
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        ),

      getBuyerSlots(),

      getSellerCategories()
    ]);

  const {
    data: items,
    error
  } =
    itemsResult;

  if (error) {
    inventoryList.textContent =
      error.message;

    return;
  }

  if (
    !items ||
    items.length === 0
  ) {
    inventoryList.textContent =
      "No items uploaded yet.";

    return;
  }

  inventoryList.innerHTML =
    "";

  items.forEach(
    (item) => {
      const itemContainer =
        document.createElement(
          "div"
        );

      if (item.image_path) {
        const {
          data: imageData
        } =
          window.supabaseClient.storage
            .from(
              "product_images"
            )
            .getPublicUrl(
              item.image_path
            );

        const itemImage =
          document.createElement(
            "img"
          );

        itemImage.src =
          imageData.publicUrl;

        itemImage.alt =
          item.name;

        itemImage.width =
          200;

        itemContainer.appendChild(
          itemImage
        );
      }

      const itemName =
        document.createElement(
          "h3"
        );

      itemName.textContent =
        item.name;

      const itemPrice =
        document.createElement(
          "p"
        );

      itemPrice.textContent =
        `$${Number(
          item.price
        ).toFixed(2)}`;

      const itemDescription =
        document.createElement(
          "p"
        );

      itemDescription.textContent =
        item.description;

      const itemCategoryDisplay =
        document.createElement(
          "p"
        );

      const assignedCategory =
        categories.find(
          (category) =>
            Number(
              category.id
            ) ===
            Number(
              item.category_id
            )
        );

      itemCategoryDisplay.textContent =
        assignedCategory
          ? `Category: ${assignedCategory.name}`
          : "Category: No Category";

      const publicationStatus =
        document.createElement(
          "p"
        );

      publicationStatus.textContent =
        item.is_published
          ? "Status: Published"
          : "Status: Unpublished";

      publicationStatus.style.fontWeight =
        "700";

      const assignedSlot =
        buyerSlots.find(
          (slot) =>
            slot.item_id ===
            item.id
        );

      if (assignedSlot) {
        const positionLabel =
          document.createElement(
            "p"
          );

        positionLabel.textContent =
          `Buyer Position: ${assignedSlot.position}`;

        itemContainer.appendChild(
          positionLabel
        );
      }

      const controls =
        document.createElement(
          "div"
        );

      [1, 2, 3].forEach(
        (position) => {
          const positionButton =
            document.createElement(
              "button"
            );

          positionButton.type =
            "button";

          positionButton.textContent =
            position;

          positionButton.addEventListener(
            "click",
            async () => {
              await assignBuyerPosition(
                item.id,
                position
              );
            }
          );

          controls.appendChild(
            positionButton
          );
        }
      );

      const publicationButton =
        document.createElement(
          "button"
        );

      publicationButton.type =
        "button";

      publicationButton.textContent =
        item.is_published
          ? "Unpublish"
          : "Publish";

      publicationButton.addEventListener(
        "click",
        async () => {
          await setItemPublished(
            item,
            !item.is_published
          );
        }
      );

      const editButton =
        document.createElement(
          "button"
        );

      editButton.type =
        "button";

      editButton.textContent =
        "Edit";

      editButton.addEventListener(
        "click",
        async () => {
          inventoryMessage.textContent =
            "";

          await showItemEditor(
            itemContainer,
            item,
            categories
          );
        }
      );

      const deleteButton =
        document.createElement(
          "button"
        );

      deleteButton.type =
        "button";

      deleteButton.textContent =
        "Delete";

      deleteButton.addEventListener(
        "click",
        async () => {
          await deleteItem(
            item
          );
        }
      );

      controls.appendChild(
        publicationButton
      );

      controls.appendChild(
        editButton
      );

      controls.appendChild(
        deleteButton
      );

      itemContainer.appendChild(
        itemName
      );

      itemContainer.appendChild(
        itemPrice
      );

      itemContainer.appendChild(
        itemDescription
      );

      itemContainer.appendChild(
        itemCategoryDisplay
      );

      itemContainer.appendChild(
        publicationStatus
      );

      itemContainer.appendChild(
        controls
      );

      inventoryList.appendChild(
        itemContainer
      );
    }
  );
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
    hideAllSellerWorkAreas();

    addItemSection.hidden =
      false;

    await loadItemCategoryOptions();
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

itemForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    itemMessage.textContent =
      "Adding item...";

    const session =
      await getCurrentSession();

    if (!session) {
      itemMessage.textContent =
        "You must be logged in.";

      return;
    }

    const imageFiles =
      [1, 2, 3, 4].map(
        (number) =>
          document
            .getElementById(
              `item-image-${number}`
            )
            .files[0] ||
          null
      );

    if (!imageFiles[0]) {
      itemMessage.textContent =
        "Product Picture 1 is required.";

      return;
    }

    const selectedImages =
      imageFiles
        .map(
          (file, index) => ({
            file,
            sortOrder:
              index + 1
          })
        )
        .filter(
          (entry) =>
            entry.file !==
            null
        );

    const name =
      document
        .getElementById(
          "item-name"
        )
        .value
        .trim();

    const price =
      Number(
        document
          .getElementById(
            "item-price"
          )
          .value
      );

    const description =
      document
        .getElementById(
          "item-description"
        )
        .value
        .trim();

    const categoryId =
      itemCategory.value
        ? Number(
            itemCategory.value
          )
        : null;

    if (!description) {
      itemMessage.textContent =
        "Description cannot be blank.";

      return;
    }

    if (
      description.length >
      ITEM_DESCRIPTION_MAX_LENGTH
    ) {
      itemMessage.textContent =
        `Description must be ${ITEM_DESCRIPTION_MAX_LENGTH} characters or fewer.`;

      return;
    }

    const uploadedImages =
      [];

    for (
      const image
      of selectedImages
    ) {
      itemMessage.textContent =
        `Uploading picture ${image.sortOrder}...`;

      const extension =
        image.file.name
          .split(".")
          .pop();

      const filePath =
        `${session.user.id}/` +
        `${Date.now()}-` +
        `${image.sortOrder}.` +
        `${extension}`;

      const {
        error: uploadError
      } =
        await window.supabaseClient.storage
          .from("product_images")
          .upload(
            filePath,
            image.file
          );

      if (uploadError) {
        if (
          uploadedImages.length >
          0
        ) {
          await window.supabaseClient.storage
            .from(
              "product_images"
            )
            .remove(
              uploadedImages.map(
                (
                  uploadedImage
                ) =>
                  uploadedImage.imagePath
              )
            );
        }

        itemMessage.textContent =
          `Picture ${image.sortOrder} could not be uploaded: ` +
          uploadError.message;

        return;
      }

      uploadedImages.push({
        imagePath:
          filePath,
        sortOrder:
          image.sortOrder
      });
    }

    itemMessage.textContent =
      "Creating item...";

    const {
      data: insertedItem,
      error: insertError
    } =
      await window.supabaseClient
        .from("items")
        .insert({
          seller_id:
            session.user.id,
          name,
          price,
          description,
          image_path:
            uploadedImages[0]
              .imagePath,
          category_id:
            categoryId,
          is_published:
            true
        })
        .select("id")
        .single();

    if (insertError) {
      await window.supabaseClient.storage
        .from("product_images")
        .remove(
          uploadedImages.map(
            (
              uploadedImage
            ) =>
              uploadedImage.imagePath
          )
        );

      itemMessage.textContent =
        insertError.message;

      return;
    }

    itemMessage.textContent =
      "Creating image records...";

    const imageRecords =
      uploadedImages.map(
        (image) => ({
          seller_id:
            session.user.id,
          item_id:
            insertedItem.id,
          image_path:
            image.imagePath,
          sort_order:
            image.sortOrder
        })
      );

    const {
      error: imageRecordError
    } =
      await window.supabaseClient
        .from("item_images")
        .insert(
          imageRecords
        );

    if (imageRecordError) {
      const {
        error: rollbackItemError
      } =
        await window.supabaseClient
          .from("items")
          .delete()
          .eq(
            "id",
            insertedItem.id
          )
          .eq(
            "seller_id",
            session.user.id
          );

      const {
        error: rollbackImagesError
      } =
        await window.supabaseClient.storage
          .from("product_images")
          .remove(
            uploadedImages.map(
              (
                uploadedImage
              ) =>
                uploadedImage.imagePath
            )
          );

      if (
        rollbackItemError ||
        rollbackImagesError
      ) {
        itemMessage.textContent =
          "Image records could not be created, and automatic cleanup was incomplete. Stop here and inspect Supabase.";

        return;
      }

      itemMessage.textContent =
        "Item was not added because its image records could not be created: " +
        imageRecordError.message;

      return;
    }

    itemForm.reset();

    itemMessage.textContent =
      `Item added successfully with ${uploadedImages.length} picture` +
      (
        uploadedImages.length ===
        1
          ? "."
          : "s."
      );

    await loadInventory();

    await loadItemCategoryOptions();
  }
);

window.supabaseClient.auth
  .onAuthStateChange(
    () => {
      showCurrentSession();
    }
  );

showCurrentSession();