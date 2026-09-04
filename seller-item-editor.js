/*
MODULE: Seller Item Editor

PURPOSE
Own the seller workflow for editing an existing item's fields and pictures.

CAPABILITIES
- Loads an existing item's image records.
- Builds the existing-item editing interface.
- Edits item name, price, description, category, location, Seller Item #,
  and quantity according to current optional-field preferences.
- Displays up to four current item pictures.
- Identifies and preserves Image 1 as the primary image.
- Replaces an existing image.
- Removes a non-primary image.
- Adds an image when fewer than four pictures exist.
- Reorders images with Move Up / Move Down.
- Synchronizes the primary image bridge stored on the items record.
- Performs rollback handling when image replacement or reorder operations fail.
- Returns to the inventory list when editing is cancelled or completed.

RESTRICTIONS
- Does not own the inventory list itself.
- Does not own Publish / Unpublish.
- Does not own Buyer Position assignment.
- Does not own whole-item deletion.
- Does not own Add Item.
- Does not own seller authentication or current-store resolution.
- Preserves current Supabase tables, storage bucket, field names,
  image limits, primary-image rules, and rollback behavior.

PRECEDENTS
- Existing-item editing and image management are one cohesive subsystem.
- This module is separate from seller-edit-items.js because the editor/image
  workflow is already substantial and is expected to grow independently.
- Shared seller/store/item-field-preference utilities remain outside this
  module until later modularization establishes a durable shared boundary.

DEPENDENTS
- Requires window.supabaseClient.
- Requires seller.js globals and shared functions including inventoryMessage,
  getCurrentSession(), getSellerItemFieldPreferences(),
  getSellerItemFieldPreference(), and ITEM_DESCRIPTION_MAX_LENGTH.
- Requires shared seller.html function loadCurrentStoreIdentity().
- Requires window.getSellerLocations().
- Requires window.updateItem() and window.loadInventory() from
  seller-edit-items.js.

CURRENT UI ENTRY
Seller Dashboard > Edit / Delete Items > Edit

ENTRY TRIGGERS
- Edit

IN-MODULE ACTIONS
- Edit item fields
- Save
- Cancel
- Choose replacement file
- Replace Image
- Remove Image
- Add Image
- Move Up
- Move Down

EXIT TRIGGERS
- Save returns through the inventory refresh workflow.
- Cancel returns to the inventory list.
- Seller selects another Seller Dashboard area.
- Seller leaves the seller page.

DEVELOPMENT NOTES
- Extracted from seller.js as a behavior-preserving modularization pass.
- POST-MODULARIZATION REVIEW CANDIDATE: after the ENTIRE application
  modularization is complete and the full modularized build has passed
  regression testing, review this file for CSS-class normalization,
  presentation logic, long-function decomposition, repeated Supabase patterns,
  naming consistency, legacy paths, and general script cleanup.
- Do not perform that cleanup during modularization or before the complete
  modularized build is tested successfully.
*/
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

  let itemFieldPreferences;

  try {
    itemFieldPreferences =
      await getSellerItemFieldPreferences();
  } catch (error) {
    inventoryMessage.textContent =
      error.message;

    return;
  }

  const imageSection =
    document.createElement("div");

  imageSection.className =
    "seller-item-image-section";


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

  const locationLabel =
    document.createElement("label");

  locationLabel.textContent =
    "Location / Booth";

  const locationSelect =
    document.createElement(
      "select"
    );

  const noLocationOption =
    document.createElement(
      "option"
    );

  noLocationOption.value =
    "";

  noLocationOption.textContent =
    "No Location";

  locationSelect.appendChild(
    noLocationOption
  );

  const locations =
    typeof window.getSellerLocations ===
      "function"
      ? await window.getSellerLocations()
      : [];

  locations.forEach(
    (location) => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        location.id;

      option.textContent =
        location.name;

      if (
        item.location_id &&
        String(
          item.location_id
        ) ===
          String(
            location.id
          )
      ) {
        option.selected =
          true;
      }

      locationSelect.appendChild(
        option
      );
    }
  );

  const sellerItemNumberLabel =
    document.createElement("label");

  sellerItemNumberLabel.textContent =
    "Seller Item #";

  const sellerItemNumberInput =
    document.createElement("input");

  sellerItemNumberInput.type =
    "text";

  sellerItemNumberInput.value =
    item.seller_item_number || "";

  const quantityLabel =
    document.createElement("label");

  quantityLabel.textContent =
    "Quantity";

  const quantityInput =
    document.createElement("input");

  quantityInput.type =
    "number";

  quantityInput.min =
    "0";

  quantityInput.step =
    "1";

  quantityInput.value =
    item.quantity ?? 1;

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
      const locationPreference =
        getSellerItemFieldPreference(
          itemFieldPreferences,
          "location"
        );

      const sellerItemNumberPreference =
        getSellerItemFieldPreference(
          itemFieldPreferences,
          "seller_item_number"
        );

      const quantityPreference =
        getSellerItemFieldPreference(
          itemFieldPreferences,
          "quantity"
        );

      await window.updateItem(
        item,
        nameInput.value,
        priceInput.value,
        descriptionInput.value,
        categorySelect.value,
        locationPreference?.is_enabled ===
          true
          ? locationSelect.value
          : (
              item.location_id ||
              ""
            ),
        sellerItemNumberPreference?.is_enabled ===
          true
          ? sellerItemNumberInput.value
          : (
              item.seller_item_number ||
              ""
            ),
        quantityPreference?.is_enabled ===
          true
          ? quantityInput.value
          : (
              item.quantity ??
              1
            )
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

  const optionalEditorFields = {
    quantity: {
      label:
        quantityLabel,
      control:
        quantityInput
    },
    location: {
      label:
        locationLabel,
      control:
        locationSelect
    },
    seller_item_number: {
      label:
        sellerItemNumberLabel,
      control:
        sellerItemNumberInput
    }
  };

  itemFieldPreferences
    .filter(
      (preference) =>
        preference.is_enabled ===
        true
    )
    .sort(
      (a, b) =>
        Number(
          a.display_order
        ) -
        Number(
          b.display_order
        )
    )
    .forEach(
      (preference) => {
        const field =
          optionalEditorFields[
            preference.field_key
          ];

        if (!field) {
          return;
        }

        editor.appendChild(
          field.label
        );

        editor.appendChild(
          document.createTextNode(
            " "
          )
        );

        editor.appendChild(
          field.control
        );

        editor.appendChild(
          document.createElement(
            "br"
          )
        );
      }
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

    imageHeading.className =
      "seller-item-image-heading";

    imageHeading.textContent =
      "Current Pictures";


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

    imageGrid.className =
      "seller-item-image-grid";


    images.forEach(
      (image) => {
        const imageContainer =
          document.createElement(
            "div"
          );

        imageContainer.className =
          "seller-item-image-card";


        const imageHeader =
          document.createElement(
            "div"
          );

        imageHeader.className =
          "seller-item-image-header";


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

          primaryBadge.className =
            "seller-item-primary-badge";

          primaryBadge.textContent =
            "Primary";


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

        itemImage.className =
          "seller-item-edit-image";

        itemImage.src =
          imageData.publicUrl;

        itemImage.alt =
          `${item.name} image ${image.sort_order}`;


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

          moveContainer.className =
            "seller-item-image-move-controls";


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

          replaceContainer.className =
            "seller-item-image-replace";


          const replaceLabel =
            document.createElement(
              "label"
            );

          replaceLabel.className =
            "seller-item-image-replace-label";

          replaceLabel.textContent =
            `Replace Image ${image.sort_order}`;


          const replaceInput =
            document.createElement(
              "input"
            );

          replaceInput.className =
            "seller-item-image-replace-input";

          replaceInput.type =
            "file";

          replaceInput.accept =
            "image/jpeg,image/png,image/webp";


          const chooseFileButton =
            document.createElement(
              "button"
            );

          chooseFileButton.className =
            "seller-item-image-choose-file";

          chooseFileButton.type =
            "button";

          chooseFileButton.textContent =
            "Choose File";


          const selectedFileName =
            document.createElement(
              "div"
            );

          selectedFileName.className =
            "seller-item-image-selected-file";

          selectedFileName.textContent =
            "No file chosen";


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

            primaryMessage.className =
              "seller-item-primary-message";

            primaryMessage.textContent =
              "Primary image — cannot be removed.";


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

          legacyMessage.className =
            "seller-item-legacy-message";

          legacyMessage.textContent =
            "Legacy image — migration required before image editing.";


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

      addSection.className =
        "seller-item-image-add";


      const addHeading =
        document.createElement(
          "h4"
        );

      addHeading.className =
        "seller-item-image-add-heading";

      addHeading.textContent =
        `Add Image ${images.length + 1}`;


      const addInput =
        document.createElement(
          "input"
        );

      addInput.className =
        "seller-item-image-add-input";

      addInput.type =
        "file";

      addInput.accept =
        "image/jpeg,image/png,image/webp";


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
