/*
MODULE: Seller Add Item

PURPOSE
Own the seller workflow for creating a new inventory item.

CAPABILITIES
- Opens and prepares the Add Item work area.
- Loads seller categories and active store locations for item entry.
- Allows a category to be created inline while adding an item.
- Allows a store location to be created inline while adding an item.
- Accepts up to four product pictures.
- Validates item name, price, description, quantity, category, location,
  and seller item number inputs.
- Uploads selected images to Supabase Storage.
- Creates the item record and associated item_images records.
- Performs rollback cleanup when item or image-record creation fails.
- Refreshes inventory and item-entry options after successful creation.

RESTRICTIONS
- Does not own Edit / Delete Items.
- Does not own the Categories management dashboard.
- Does not own seller authentication or current-store resolution.
- Does not own shared category/location query helpers.
- Preserves current Supabase tables, storage bucket, field names,
  validation, publication default, and rollback behavior.

PRECEDENTS
- Add Item is a standalone durable module because its workflow is distinct
  and expected to gain additional functionality.
- Shared seller/store/category/location utilities remain outside this module
  until a later shared-core modularization decision is warranted.

DEPENDENTS
- Requires window.supabaseClient.
- Requires seller.html Add Item DOM elements.
- Requires seller.js globals used by the existing workflow, including
  itemForm, itemCategory, itemMessage, addItemSection,
  hideAllSellerWorkAreas(), and ITEM_DESCRIPTION_MAX_LENGTH.
- Requires shared seller.html functions loadCurrentStoreIdentity(),
  getSetupSession(), window.getSellerCategories(), and
  window.getSellerLocations().
- Uses window.loadInventory() after successful item creation.

CURRENT UI ENTRY
Seller Dashboard > Add Item

ENTRY TRIGGERS
- Add Item

IN-MODULE ACTIONS
- Select Product Pictures 1-4
- Select or create Category
- Select or create Location / Booth
- Enter Seller Item #
- Enter Quantity
- Enter Item Name
- Enter Price
- Enter Description
- Submit Add Item
- Cancel inline Category creation
- Cancel inline Location creation

EXIT TRIGGERS
- Seller selects another Seller Dashboard area.
- Successful item creation leaves the seller in the Add Item area with
  the form reset and supporting options refreshed.
- Seller leaves the seller page.

DEVELOPMENT NOTES
- Extracted from seller.html as a behavior-preserving modularization pass.
- Shared category and location query helpers intentionally remain outside
  this module because other seller workflows use them.
*/
const itemLocation =
document.getElementById("item-location");

window.loadItemLocationOptions =
async function(selectedLocationId = "") {
const locations =
await window.getSellerLocations();

itemLocation.innerHTML = "";

const createOption =
document.createElement("option");

createOption.value =
"__create_new__";

createOption.textContent =
"Create New";

itemLocation.appendChild(
createOption
);

const dividerOption =
document.createElement("option");

dividerOption.disabled =
true;

dividerOption.textContent =
"────────────";

itemLocation.appendChild(
dividerOption
);

const noLocationOption =
document.createElement("option");

noLocationOption.value = "";
noLocationOption.textContent =
"No Location";

itemLocation.appendChild(
noLocationOption
);

locations.forEach((location) => {
const option =
document.createElement("option");

option.value =
location.id;

option.textContent =
location.name;

itemLocation.appendChild(
option
);
});

itemLocation.value =
selectedLocationId
? String(selectedLocationId)
: "";
};

const newLocationInline =
document.getElementById("new-location-inline");

const newItemLocationName =
document.getElementById("new-item-location-name");

const createItemLocationButton =
document.getElementById("create-item-location-button");

const cancelItemLocationButton =
document.getElementById("cancel-item-location-button");

const newItemLocationMessage =
document.getElementById("new-item-location-message");

itemLocation.addEventListener(
"change",
() => {
if (
itemLocation.value !==
"__create_new__"
) {
return;
}

itemLocation.value = "";
newLocationInline.hidden = false;
newItemLocationMessage.textContent = "";
newItemLocationName.value = "";
newItemLocationName.focus();
}
);

cancelItemLocationButton.addEventListener(
"click",
() => {
newLocationInline.hidden = true;
newItemLocationName.value = "";
newItemLocationMessage.textContent = "";
itemLocation.value = "";
}
);

createItemLocationButton.addEventListener(
"click",
async () => {
const store =
await loadCurrentStoreIdentity();

if (!store) {
newItemLocationMessage.textContent =
"You must be logged in with a store assigned.";
return;
}

const locationName =
newItemLocationName.value.trim();

if (!locationName) {
newItemLocationMessage.textContent =
"Please enter a location name.";
return;
}

newItemLocationMessage.textContent =
"Creating location...";

const {
data: createdLocation,
error
} =
await window.supabaseClient
.from("store_locations")
.insert({
store_id: store.id,
name: locationName
})
.select("id, name")
.single();

if (error) {
newItemLocationMessage.textContent =
error.message;
return;
}

await window.loadItemLocationOptions(
createdLocation.id
);

newLocationInline.hidden = true;
newItemLocationName.value = "";
newItemLocationMessage.textContent = "";
}
);

document
.getElementById("dashboard-add-item")
.addEventListener(
"click",
async () => {
hideAllSellerWorkAreas();
addItemSection.hidden = false;

newCategoryInline.hidden = true;
newItemCategoryName.value = "";
newItemCategoryMessage.textContent = "";

newLocationInline.hidden = true;
newItemLocationName.value = "";
newItemLocationMessage.textContent = "";

await window.loadItemCategoryOptions();
await window.loadItemLocationOptions();
}
);

const newCategoryInline =
document.getElementById("new-category-inline");

const newItemCategoryName =
document.getElementById("new-item-category-name");

const createItemCategoryButton =
document.getElementById("create-item-category-button");

const cancelItemCategoryButton =
document.getElementById("cancel-item-category-button");

const newItemCategoryMessage =
document.getElementById("new-item-category-message");

window.loadItemCategoryOptions =
async function(selectedCategoryId = "") {
const categories =
await window.getSellerCategories();

itemCategory.innerHTML = "";

const createOption =
document.createElement("option");

createOption.value =
"__create_new__";

createOption.textContent =
"Create New";

itemCategory.appendChild(
createOption
);

const dividerOption =
document.createElement("option");

dividerOption.disabled =
true;

dividerOption.textContent =
"────────────";

itemCategory.appendChild(
dividerOption
);

const noCategoryOption =
document.createElement("option");

noCategoryOption.value =
"";

noCategoryOption.textContent =
"No Category";

itemCategory.appendChild(
noCategoryOption
);

categories.forEach((category) => {
const option =
document.createElement("option");

option.value =
category.id;

option.textContent =
category.name;

itemCategory.appendChild(
option
);
});

itemCategory.value =
selectedCategoryId
? String(selectedCategoryId)
: "";
};

itemCategory.addEventListener(
"change",
() => {
if (
itemCategory.value !==
"__create_new__"
) {
return;
}

itemCategory.value = "";
newCategoryInline.hidden = false;
newItemCategoryMessage.textContent = "";
newItemCategoryName.value = "";
newItemCategoryName.focus();
}
);

cancelItemCategoryButton.addEventListener(
"click",
() => {
newCategoryInline.hidden = true;
newItemCategoryName.value = "";
newItemCategoryMessage.textContent = "";
itemCategory.value = "";
}
);

createItemCategoryButton.addEventListener(
"click",
async () => {
const session =
await getSetupSession();

const store =
await loadCurrentStoreIdentity();

if (!session || !store) {
newItemCategoryMessage.textContent =
"You must be logged in with a store assigned.";
return;
}

const categoryName =
newItemCategoryName.value.trim();

if (!categoryName) {
newItemCategoryMessage.textContent =
"Please enter a category name.";
return;
}

newItemCategoryMessage.textContent =
"Creating category...";

const {
data: createdCategory,
error
} =
await window.supabaseClient
.from("categories")
.insert({
seller_id: session.user.id,
store_id: store.id,
name: categoryName
})
.select("id, name")
.single();

if (error) {
newItemCategoryMessage.textContent =
error.message;
return;
}

await window.loadItemCategoryOptions(
createdCategory.id
);

newCategoryInline.hidden = true;
newItemCategoryName.value = "";
newItemCategoryMessage.textContent = "";
}
);
itemForm.addEventListener(
"submit",
async (event) => {
event.preventDefault();
event.stopImmediatePropagation();

itemMessage.textContent =
"Adding item...";

const session =
await getSetupSession();

const store =
await loadCurrentStoreIdentity();

if (!session || !store) {
itemMessage.textContent =
"You must be logged in with a store assigned.";
return;
}

const imageFiles =
[1, 2, 3, 4].map(
(number) =>
document.getElementById(
`item-image-${number}`
).files[0] || null
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
sortOrder: index + 1
})
)
.filter(
(entry) =>
entry.file !== null
);

const name =
document.getElementById(
"item-name"
).value.trim();

const rawPrice =
document.getElementById(
"item-price"
).value;

const price =
Number(rawPrice);

const description =
document.getElementById(
"item-description"
).value.trim();

const categoryId =
itemCategory.value
? Number(itemCategory.value)
: null;

const locationId =
itemLocation.value
? itemLocation.value
: null;

const sellerItemNumber =
document.getElementById(
"item-seller-number"
).value.trim() || null;

const rawQuantity =
document.getElementById(
"item-quantity"
).value;

const quantity =
Number(rawQuantity);

if (
rawQuantity === "" ||
!Number.isInteger(quantity) ||
quantity < 0
) {
itemMessage.textContent =
"Quantity must be a whole number of 0 or more.";
return;
}

if (!name) {
itemMessage.textContent =
"Item name cannot be blank.";
return;
}

if (
rawPrice === "" ||
Number.isNaN(price) ||
price < 0
) {
itemMessage.textContent =
"Please enter a valid price.";
return;
}

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

const uploadedImages = [];

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
uploadedImages.length > 0
) {
await window.supabaseClient.storage
.from("product_images")
.remove(
uploadedImages.map(
(uploadedImage) =>
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
imagePath: filePath,
sortOrder: image.sortOrder
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

store_id:
store.id,

name,
price,
description,

image_path:
uploadedImages[0].imagePath,

category_id:
categoryId,

location_id:
locationId,

seller_item_number:
sellerItemNumber,

quantity:
quantity,

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
(uploadedImage) =>
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

store_id:
store.id,

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
.insert(imageRecords);

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
"store_id",
store.id
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
(uploadedImage) =>
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

newLocationInline.hidden = true;
newItemLocationName.value = "";
newItemLocationMessage.textContent = "";

itemMessage.textContent =
`Item added successfully with ${uploadedImages.length} picture` +
(
uploadedImages.length === 1
? "."
: "s."
);

await window.loadInventory();

await loadItemCategoryOptions();

await window.loadItemLocationOptions();
},
true
);