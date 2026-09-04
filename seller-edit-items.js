/*
MODULE: Seller Edit Items

PURPOSE
Own the seller inventory-management workflow for existing items.

CAPABILITIES
- Loads the seller's current inventory.
- Reads Buyer Position assignments.
- Displays publication status and Buyer Position status.
- Opens the existing item editor.
- Saves item field changes.
- Publishes and unpublishes items.
- Assigns published items to Buyer Positions 1, 2, or 3.
- Deletes items and associated stored images.
- Refreshes inventory after item changes.
- Preserves per-item success and error messaging.

RESTRICTIONS
- This is Edit / Delete Items extraction Pass 1.
- The existing item editor and image-management implementation in seller.js
  remains there temporarily and will be evaluated in Pass 2.
- Does not own Add Item.
- Does not own Categories management.
- Does not own seller authentication or current-store resolution.
- Preserves current Supabase tables, storage bucket, field names,
  publication behavior, Buyer Position behavior, and deletion behavior.

PRECEDENTS
- Edit / Delete Items is a standalone durable module because its workflow is
  distinct and expected to gain additional functionality.
- Pass 1 moves the inventory/update/publication/position/delete responsibility
  that previously lived in seller.html without changing behavior.
- The editor/image-management code will not be moved until this pass is tested.

DEPENDENTS
- Requires window.supabaseClient.
- Requires seller.html inventory DOM elements.
- Requires seller.js globals and functions used by the current workflow,
  including inventoryList, inventoryMessage, showItemEditor(), and
  ITEM_DESCRIPTION_MAX_LENGTH.
- Requires shared seller.html functions loadCurrentStoreIdentity(),
  getSetupSession(), window.getSellerCategories(), and
  window.getSellerLocations().
- window.loadInventory() remains available to Seller Add Item after successful
  item creation.

CURRENT UI ENTRY
Seller Dashboard > Edit / Delete Items

ENTRY TRIGGERS
- Edit / Delete Items
- Edit
- Publish
- Unpublish
- Buyer Position 1
- Buyer Position 2
- Buyer Position 3
- Delete

IN-MODULE ACTIONS
- Load inventory
- Open an item for editing
- Save item field changes
- Publish or unpublish an item
- Assign or move Buyer Position
- Delete an item
- Refresh inventory and item status

EXIT TRIGGERS
- Seller selects another Seller Dashboard area.
- Seller cancels or completes an edit and returns to inventory.
- Seller leaves the seller page.

DEVELOPMENT NOTES
- Extracted from seller.html as a behavior-preserving modularization pass.
- Pass 2 will inspect the editor/image-management code still in seller.js and
  decide whether it belongs in this module or warrants a child module.
*/
window.getBuyerSlots =
async function() {
const store =
await loadCurrentStoreIdentity();

if (!store) {
return [];
}

const { data, error } =
await window.supabaseClient
.from("buyer_slots")
.select("position, item_id")
.eq("store_id", store.id);

if (error) {
inventoryMessage.textContent =
error.message;
return [];
}

return data || [];
};

window.loadInventory =
async function() {
const store =
await loadCurrentStoreIdentity();

if (!store) {
inventoryList.innerHTML = "";
inventoryMessage.textContent =
"No store membership is assigned to this seller account.";
return;
}

const [
itemsResult,
buyerSlots,
categories,
itemImagesResult
] =
await Promise.all([
window.supabaseClient
.from("items")
.select(
"id, name, price, description, image_path, category_id, location_id, seller_item_number, quantity, is_published"
)
.eq("store_id", store.id)
.order(
"created_at",
{ ascending: true }
),

window.getBuyerSlots(),

window.getSellerCategories(),

window.supabaseClient
.from("item_images")
.select("item_id")
.eq("store_id", store.id)
]);

const { data: items, error } =
itemsResult;

if (error) {
inventoryList.textContent =
error.message;
return;
}

if (itemImagesResult.error) {
inventoryList.textContent =
itemImagesResult.error.message;
return;
}

const itemImageCounts =
(itemImagesResult.data || []).reduce(
(counts, row) => {
counts[row.item_id] =
(counts[row.item_id] || 0) + 1;
return counts;
},
{}
);

if (
!items ||
items.length === 0
) {
inventoryList.textContent =
"No items uploaded yet.";
return;
}

inventoryList.innerHTML = "";

items.forEach((item) => {
const itemContainer =
document.createElement("div");

itemContainer.className =
"inventory-card";

if (item.image_path) {
const { data: imageData } =
window.supabaseClient.storage
.from("product_images")
.getPublicUrl(item.image_path);

const itemImage =
document.createElement("img");

itemImage.src =
imageData.publicUrl;
itemImage.alt =
item.name;
itemImage.width =
200;

itemContainer.appendChild(itemImage);
}

const itemName =
document.createElement("h3");

itemName.textContent =
item.name;

const itemPrice =
document.createElement("p");

itemPrice.textContent =
`$${Number(item.price).toFixed(2)}`;

const itemDescription =
document.createElement("p");

itemDescription.textContent =
item.description;

const pictureCountDisplay =
document.createElement("p");

const pictureCount =
itemImageCounts[item.id] ||
(item.image_path ? 1 : 0);

pictureCountDisplay.textContent =
`Pictures: ${pictureCount}`;

const itemCategoryDisplay =
document.createElement("p");

const assignedCategory =
categories.find(
(category) =>
Number(category.id) ===
Number(item.category_id)
);

itemCategoryDisplay.textContent =
assignedCategory
? `Category: ${assignedCategory.name}`
: "Category: No Category";

const publicationStatus =
document.createElement("p");

publicationStatus.textContent =
item.is_published
? "Status: Published"
: "Status: Unpublished";

publicationStatus.style.fontWeight =
"700";

const assignedSlot =
buyerSlots.find(
(slot) =>
slot.item_id === item.id
);

const positionLabel =
document.createElement("p");

positionLabel.textContent =
assignedSlot
? `Buyer Position: ${assignedSlot.position}`
: "Buyer Position: Not assigned";

const controls =
document.createElement("div");

controls.className =
"inventory-card-controls";

[1, 2, 3].forEach((position) => {
const positionButton =
document.createElement("button");

positionButton.type =
"button";

positionButton.textContent =
position;

positionButton.disabled =
!item.is_published;

positionButton.addEventListener(
"click",
async () => {
await window.assignBuyerPosition(
item.id,
position
);
}
);

controls.appendChild(
positionButton
);
});

const publicationButton =
document.createElement("button");

publicationButton.type =
"button";

publicationButton.textContent =
item.is_published
? "Unpublish"
: "Publish";

publicationButton.addEventListener(
"click",
async () => {
await window.setItemPublished(
item,
!item.is_published
);
}
);

const editButton =
document.createElement("button");

editButton.type =
"button";

editButton.textContent =
"Edit";

editButton.addEventListener(
"click",
async () => {
inventoryMessage.textContent = "";

itemContainer.classList.add(
"inventory-card-editing"
);

await showItemEditor(
itemContainer,
item,
categories
);
}
);

const deleteButton =
document.createElement("button");

deleteButton.type =
"button";

deleteButton.textContent =
"Delete";

deleteButton.addEventListener(
"click",
async () => {
await window.deleteItem(item);
}
);

const itemActionMessage =
document.createElement("p");

itemActionMessage.id =
`inventory-item-message-${item.id}`;

itemActionMessage.className =
"inventory-card-message";

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
pictureCountDisplay
);

itemContainer.appendChild(
itemCategoryDisplay
);

itemContainer.appendChild(
publicationStatus
);

itemContainer.appendChild(
positionLabel
);

itemContainer.appendChild(
controls
);

itemContainer.appendChild(
itemActionMessage
);

inventoryList.appendChild(
itemContainer
);
});
};

window.updateItem =
async function(
item,
newName,
newPrice,
newDescription,
newCategoryId,
newLocationId,
newSellerItemNumber,
newQuantity
) {
const session =
await getSetupSession();

const store =
await loadCurrentStoreIdentity();

if (!session || !store) {
inventoryMessage.textContent =
"You must be logged in with a store assigned.";
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
Number.isNaN(Number(newPrice)) ||
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

const locationId =
newLocationId
? newLocationId
: null;

const sellerItemNumber =
String(newSellerItemNumber || "").trim() || null;

const quantity =
Number(newQuantity);

if (
newQuantity === "" ||
!Number.isInteger(quantity) ||
quantity < 0
) {
inventoryMessage.textContent =
"Quantity must be a whole number of 0 or more.";
return false;
}

inventoryMessage.textContent =
"Saving item changes...";

const { error } =
await window.supabaseClient
.from("items")
.update({
name: cleanedName,
price: Number(newPrice),
description: cleanedDescription,
category_id: categoryId,
location_id: locationId,
seller_item_number: sellerItemNumber,
quantity: quantity
})
.eq("id", item.id)
.eq("store_id", store.id)
.eq("seller_id", session.user.id);

if (error) {
inventoryMessage.textContent =
error.message;
return false;
}

await window.loadInventory();

inventoryMessage.textContent =
"Item updated successfully.";

return true;
};

window.setItemPublished =
async function(
item,
shouldPublish
) {
const session =
await getSetupSession();

const store =
await loadCurrentStoreIdentity();

if (!session || !store) {
inventoryMessage.textContent =
"You must be logged in with a store assigned.";
return false;
}

inventoryMessage.textContent =
shouldPublish
? "Publishing item..."
: "Unpublishing item...";

const { error } =
await window.supabaseClient
.from("items")
.update({
is_published: shouldPublish
})
.eq("id", item.id)
.eq("store_id", store.id)
.eq("seller_id", session.user.id);

if (error) {
inventoryMessage.textContent =
error.message;
return false;
}

const {
error: slotUpdateError
} =
await window.supabaseClient
.from("buyer_slots")
.update({
item_id: shouldPublish
? item.id
: null
})
.eq("store_id", store.id)
.eq("seller_id", session.user.id)
.eq("item_id", item.id);

inventoryMessage.textContent =
slotUpdateError
? (
shouldPublish
? "Item published, but the buyer page realtime refresh signal failed."
: "Item unpublished, but its Buyer Position could not be cleared."
)
: (
shouldPublish
? "Item published successfully."
: "Item unpublished successfully."
);

await window.loadInventory();

return true;
};

window.assignBuyerPosition =
async function(
itemId,
position
) {
const itemMessageBefore =
document.getElementById(
`inventory-item-message-${itemId}`
);

inventoryMessage.textContent = "";

if (itemMessageBefore) {
itemMessageBefore.textContent =
`Assigning item to Buyer Position ${position}...`;
}

const session =
await getSetupSession();

const store =
await loadCurrentStoreIdentity();

if (!session || !store) {
if (itemMessageBefore) {
itemMessageBefore.textContent =
"You must be logged in with a store assigned.";
} else {
inventoryMessage.textContent =
"You must be logged in with a store assigned.";
}

return false;
}

const {
data: itemRow,
error: itemReadError
} =
await window.supabaseClient
.from("items")
.select("is_published")
.eq("id", itemId)
.eq("store_id", store.id)
.eq("seller_id", session.user.id)
.maybeSingle();

if (itemReadError) {
if (itemMessageBefore) {
itemMessageBefore.textContent =
itemReadError.message;
} else {
inventoryMessage.textContent =
itemReadError.message;
}

return false;
}

if (!itemRow?.is_published) {
if (itemMessageBefore) {
itemMessageBefore.textContent =
"Publish this item before assigning a Buyer Position.";
} else {
inventoryMessage.textContent =
"Publish this item before assigning a Buyer Position.";
}

return false;
}

const {
error: clearError
} =
await window.supabaseClient
.from("buyer_slots")
.update({
item_id: null
})
.eq("store_id", store.id)
.eq("seller_id", session.user.id)
.eq("item_id", itemId)
.neq("position", position);

if (clearError) {
if (itemMessageBefore) {
itemMessageBefore.textContent =
clearError.message;
} else {
inventoryMessage.textContent =
clearError.message;
}

return false;
}

const {
error: assignError
} =
await window.supabaseClient
.from("buyer_slots")
.upsert(
{
seller_id: session.user.id,
store_id: store.id,
position: position,
item_id: itemId
},
{
onConflict: "store_id,position"
}
);

if (assignError) {
if (itemMessageBefore) {
itemMessageBefore.textContent =
assignError.message;
} else {
inventoryMessage.textContent =
assignError.message;
}

return false;
}

await window.loadInventory();

inventoryMessage.textContent = "";

const itemMessageAfter =
document.getElementById(
`inventory-item-message-${itemId}`
);

if (itemMessageAfter) {
itemMessageAfter.textContent =
`Item assigned to Buyer Position ${position}.`;
}

return true;
};

window.deleteItem =
async function(item) {
const confirmed =
window.confirm(
`Delete "${item.name}"?\n\n` +
"This will permanently delete the item and its uploaded images."
);

if (!confirmed) {
return false;
}

const itemMessage =
document.getElementById(
`inventory-item-message-${item.id}`
);

if (itemMessage) {
itemMessage.textContent =
"Deleting item...";
}

inventoryMessage.textContent = "";

const session =
await getSetupSession();

const store =
await loadCurrentStoreIdentity();

if (!session || !store) {
if (itemMessage) {
itemMessage.textContent =
"You must be logged in with a store assigned.";
} else {
inventoryMessage.textContent =
"You must be logged in with a store assigned.";
}

return false;
}

const {
data: imageRows,
error: imageReadError
} =
await window.supabaseClient
.from("item_images")
.select("image_path")
.eq("item_id", item.id)
.eq("store_id", store.id)
.eq("seller_id", session.user.id);

if (imageReadError) {
if (itemMessage) {
itemMessage.textContent =
imageReadError.message;
} else {
inventoryMessage.textContent =
imageReadError.message;
}

return false;
}

const imagePaths =
[
...(imageRows || [])
.map((row) => row.image_path)
.filter(Boolean),

item.image_path
]
.filter(Boolean);

const uniqueImagePaths =
[...new Set(imagePaths)];

const {
error: deleteError
} =
await window.supabaseClient
.from("items")
.delete()
.eq("id", item.id)
.eq("store_id", store.id)
.eq("seller_id", session.user.id);

if (deleteError) {
if (itemMessage) {
itemMessage.textContent =
deleteError.message;
} else {
inventoryMessage.textContent =
deleteError.message;
}

return false;
}

let storageCleanupError =
null;

if (uniqueImagePaths.length > 0) {
const {
error: removeError
} =
await window.supabaseClient.storage
.from("product_images")
.remove(uniqueImagePaths);

storageCleanupError =
removeError || null;
}

const deletedCard =
itemMessage
? itemMessage.closest(".inventory-card")
: null;

const deletedCardIndex =
deletedCard
? Array.from(inventoryList.children).indexOf(deletedCard)
: -1;

await window.loadInventory();

if (storageCleanupError) {
inventoryMessage.textContent =
"Item deleted, but one or more image files could not be removed from storage.";
return true;
}

inventoryMessage.textContent = "";

const deleteSuccessMessage =
document.createElement("p");

deleteSuccessMessage.className =
"inventory-card-message";

deleteSuccessMessage.textContent =
"Item deleted successfully.";

const remainingCards =
Array.from(inventoryList.children);

if (
deletedCardIndex >= 0 &&
deletedCardIndex < remainingCards.length
) {
inventoryList.insertBefore(
deleteSuccessMessage,
remainingCards[deletedCardIndex]
);
} else {
inventoryList.appendChild(
deleteSuccessMessage
);
}

window.setTimeout(
() => {
deleteSuccessMessage.remove();
},
4000
);

return true;
};