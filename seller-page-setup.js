/*
MODULE: Seller Page Setup

PURPOSE
Own the seller-facing configuration workflows that define how a store is presented
to buyers and how selected store-level item-entry preferences are configured.

CAPABILITIES
- Page Appearance: buyer page title, background color, and Featured section title.
- Business Info: online-only status, address, phone, and email.
- Business Hours: seven-day open/closed schedule and opening/closing times.
- Store Setup: optional item-field preferences for Quantity, Location / Booth,
  and Seller Item #.

RESTRICTIONS
- Does not own seller authentication, current-store resolution, inventory,
  Add Item, Edit / Delete Items, Claims, or Categories.
- Does not create or change store membership.
- Preserves the existing Supabase tables, field names, validation, and save behavior.
- Depends on shared seller.html functions rather than duplicating them.

PRECEDENTS
- Seller Page Setup remains one cohesive module containing its four current functions.
- Shared seller/store utilities remain outside this module unless a later
  modularization pass establishes a durable shared module.

DEPENDENTS
- Requires window.supabaseClient.
- Requires seller.html DOM elements for Seller Page Setup.
- Requires shared seller.html functions loadCurrentStoreIdentity() and
  getSetupSession().

CURRENT UI ENTRY
Seller Dashboard > Seller Page Setup

ENTRY TRIGGERS
- Seller Dashboard > Seller Page Setup
- Page Appearance
- Business Info
- Business Hours
- Store Setup

IN-MODULE ACTIONS
- Save Page Appearance
- Save Business Info
- Save Business Hours
- Save Optional Item Fields
- Toggle Online Sales Only
- Edit masked business phone and ZIP values
- Toggle daily open/closed status and business times
- Select the current Store Setup configuration module

EXIT TRIGGERS
- Seller selects another Seller Dashboard area.
- Seller leaves the seller page.

DEVELOPMENT NOTES
- Extracted from seller.html as a behavior-preserving modularization pass.
- Keep current element IDs and shared dependency names stable during this pass.
*/
const setupPageAppearance =
document.getElementById("setup-page-appearance");
const setupBusinessInfo =
document.getElementById("setup-business-info");
const setupBusinessHours =
document.getElementById("setup-business-hours");
const setupStoreSetup =
document.getElementById("setup-store-setup");
const pageAppearanceSection =
document.getElementById("page-appearance-section");
const businessInfoSection =
document.getElementById("business-info-section");
const businessHoursSection =
document.getElementById("business-hours-section");
const storeSetupSection =
document.getElementById("store-setup-section");
const storeSetupModule =
document.getElementById("store-setup-module");
const optionalItemFieldsPanel =
document.getElementById("optional-item-fields-panel");
const storeFieldQuantity =
document.getElementById("store-field-quantity");
const storeFieldLocation =
document.getElementById("store-field-location");
const storeFieldSellerItemNumber =
document.getElementById("store-field-seller-item-number");
const saveStoreItemFieldsButton =
document.getElementById("save-store-item-fields");
const storeItemFieldsMessage =
document.getElementById("store-item-fields-message");
const pageTitleInput =
document.getElementById("page-title");
const backgroundColorInput =
document.getElementById("background-color");
const featuredSectionTitleInput =
document.getElementById("featured-section-title");
const onlineSalesOnlyInput =
document.getElementById("online-sales-only");
const businessStreetInput =
document.getElementById("business-street");
const businessCityInput =
document.getElementById("business-city");
const businessStateInput =
document.getElementById("business-state");
const businessZipInput =
document.getElementById("business-zip");
const businessPhoneInput =
document.getElementById("business-phone");
const businessEmailInput =
document.getElementById("business-email");
const savePageAppearanceButton =
document.getElementById("save-page-appearance");
const saveBusinessInfoButton =
document.getElementById("save-business-info");
const saveBusinessHoursButton =
document.getElementById("save-business-hours");
const pageAppearanceMessage =
document.getElementById("page-appearance-message");
const businessInfoMessage =
document.getElementById("business-info-message");
const businessHoursMessage =
document.getElementById("business-hours-message");

const businessDays = [
{
name: "Monday",
databaseDay: 1,
openCheckbox: document.getElementById("monday-open"),
openTime: document.getElementById("monday-open-time"),
openPeriod: document.getElementById("monday-open-period"),
closeTime: document.getElementById("monday-close-time"),
closePeriod: document.getElementById("monday-close-period")
},
{
name: "Tuesday",
databaseDay: 2,
openCheckbox: document.getElementById("tuesday-open"),
openTime: document.getElementById("tuesday-open-time"),
openPeriod: document.getElementById("tuesday-open-period"),
closeTime: document.getElementById("tuesday-close-time"),
closePeriod: document.getElementById("tuesday-close-period")
},
{
name: "Wednesday",
databaseDay: 3,
openCheckbox: document.getElementById("wednesday-open"),
openTime: document.getElementById("wednesday-open-time"),
openPeriod: document.getElementById("wednesday-open-period"),
closeTime: document.getElementById("wednesday-close-time"),
closePeriod: document.getElementById("wednesday-close-period")
},
{
name: "Thursday",
databaseDay: 4,
openCheckbox: document.getElementById("thursday-open"),
openTime: document.getElementById("thursday-open-time"),
openPeriod: document.getElementById("thursday-open-period"),
closeTime: document.getElementById("thursday-close-time"),
closePeriod: document.getElementById("thursday-close-period")
},
{
name: "Friday",
databaseDay: 5,
openCheckbox: document.getElementById("friday-open"),
openTime: document.getElementById("friday-open-time"),
openPeriod: document.getElementById("friday-open-period"),
closeTime: document.getElementById("friday-close-time"),
closePeriod: document.getElementById("friday-close-period")
},
{
name: "Saturday",
databaseDay: 6,
openCheckbox: document.getElementById("saturday-open"),
openTime: document.getElementById("saturday-open-time"),
openPeriod: document.getElementById("saturday-open-period"),
closeTime: document.getElementById("saturday-close-time"),
closePeriod: document.getElementById("saturday-close-period")
},
{
name: "Sunday",
databaseDay: 0,
openCheckbox: document.getElementById("sunday-open"),
openTime: document.getElementById("sunday-open-time"),
openPeriod: document.getElementById("sunday-open-period"),
closeTime: document.getElementById("sunday-close-time"),
closePeriod: document.getElementById("sunday-close-period")
}
];

function hideSellerPageSetupAreas() {
pageAppearanceSection.hidden = true;
businessInfoSection.hidden = true;
businessHoursSection.hidden = true;
storeSetupSection.hidden = true;
}

function updateAddressFieldState() {
const addressDisabled = onlineSalesOnlyInput.checked;
businessStreetInput.disabled = addressDisabled;
businessCityInput.disabled = addressDisabled;
businessStateInput.disabled = addressDisabled;
businessZipInput.disabled = addressDisabled;
}

function digitsOnly(value) {
return String(value || "").replace(/\D/g, "");
}

let businessPhoneDigits = "";

function formatBusinessPhoneMask(value) {
const digits = digitsOnly(value).slice(0, 10);
const mask = "xxxxxxxxxx".split("");

digits.split("").forEach((digit, index) => {
mask[index] = digit;
});

return `(${mask.slice(0, 3).join("")}) ${mask.slice(3, 6).join("")}-${mask.slice(6, 10).join("")}`;
}

function renderBusinessPhoneMask() {
businessPhoneInput.value =
formatBusinessPhoneMask(businessPhoneDigits);

window.requestAnimationFrame(() => {
const end = businessPhoneInput.value.length;
businessPhoneInput.setSelectionRange(end, end);
});
}

function populateBusinessTimeOptions() {
const values = [];

for (let hour = 1; hour <= 12; hour += 1) {
for (let minute = 0; minute < 60; minute += 15) {
values.push(
`${hour}:${String(minute).padStart(2, "0")}`
);
}
}

businessDays.forEach((day) => {
[day.openTime, day.closeTime].forEach((select) => {
select.innerHTML = "";

values.forEach((value) => {
const option =
document.createElement("option");

option.value = value;
option.textContent = value;
select.appendChild(option);
});
});
});
}

function convertStoredTimeToBusinessControls(value, defaultPeriod) {
if (!value) {
return {
time: "8:00",
period: defaultPeriod
};
}

const parts = String(value).split(":");
const hour24 = Number(parts[0]);
const minute = parts[1] || "00";

const period =
hour24 >= 12
? "PM"
: "AM";

let hour12 =
hour24 % 12;

if (hour12 === 0) {
hour12 = 12;
}

return {
time: `${hour12}:${minute}`,
period
};
}

function convertBusinessControlsToStoredTime(timeValue, periodValue) {
if (!timeValue) {
return null;
}

const [hourText, minuteText] =
timeValue.split(":");

let hour =
Number(hourText);

if (periodValue === "AM") {
if (hour === 12) {
hour = 0;
}
} else if (hour !== 12) {
hour += 12;
}

return (
String(hour).padStart(2, "0") +
":" +
String(minuteText || "00").padStart(2, "0") +
":00"
);
}

function setBusinessDayDefaults(day) {
day.openTime.value = "8:00";
day.openPeriod.value = "AM";
day.closeTime.value = "5:00";
day.closePeriod.value = "PM";
}

function updateBusinessDayState(day) {
const disabled =
!day.openCheckbox.checked;

day.openTime.disabled =
disabled;

day.openPeriod.disabled =
disabled;

day.closeTime.disabled =
disabled;

day.closePeriod.disabled =
disabled;
}

function updateAllBusinessDayStates() {
businessDays.forEach((day) => {
updateBusinessDayState(day);
});
}



async function loadSellerPageSettings() {
const store = await loadCurrentStoreIdentity();

if (!store) {
pageAppearanceMessage.textContent =
"No store membership is assigned.";
return;
}

pageAppearanceMessage.textContent =
"Loading page settings...";
businessInfoMessage.textContent = "";

const { data, error } =
await window.supabaseClient
.from("seller_page_settings")
.select(
"page_title, background_color, featured_section_title, online_sales_only, business_street, business_city, business_state, business_zip, business_phone, business_email"
)
.eq("store_id", store.id)
.maybeSingle();

if (error) {
pageAppearanceMessage.textContent = error.message;
return;
}

pageTitleInput.value =
data?.page_title || "";
backgroundColorInput.value =
data?.background_color || "#ffffff";
featuredSectionTitleInput.value =
data?.featured_section_title || "Featured";
onlineSalesOnlyInput.checked =
data?.online_sales_only === true;
businessStreetInput.value =
data?.business_street || "";
businessCityInput.value =
data?.business_city || "";
businessStateInput.value =
data?.business_state || "";
businessZipInput.value =
data?.business_zip || "";
businessPhoneDigits =
digitsOnly(data?.business_phone || "").slice(0, 10);
renderBusinessPhoneMask();
businessEmailInput.value =
data?.business_email || "";

updateAddressFieldState();
pageAppearanceMessage.textContent = "";
}

async function loadBusinessHours() {
const store =
await loadCurrentStoreIdentity();

if (!store) {
businessHoursMessage.textContent =
"No store membership is assigned.";
return;
}

businessHoursMessage.textContent =
"Loading business hours...";

const { data, error } =
await window.supabaseClient
.from("seller_hours")
.select("day_of_week, is_open, open_time, close_time")
.eq("store_id", store.id);

if (error) {
businessHoursMessage.textContent = error.message;
return;
}

businessDays.forEach((day) => {
const savedDay =
(data || []).find(
(row) =>
Number(row.day_of_week) === day.databaseDay
);

if (!savedDay) {
day.openCheckbox.checked = false;
setBusinessDayDefaults(day);
updateBusinessDayState(day);
return;
}

day.openCheckbox.checked =
savedDay.is_open === true;

const openControls =
convertStoredTimeToBusinessControls(
savedDay.open_time,
"AM"
);

const closeControls =
convertStoredTimeToBusinessControls(
savedDay.close_time,
"PM"
);

day.openTime.value =
openControls.time;

day.openPeriod.value =
openControls.period;

day.closeTime.value =
closeControls.time;

day.closePeriod.value =
closeControls.period;

updateBusinessDayState(day);
});

businessHoursMessage.textContent = "";
}

async function savePageAppearance() {
const session = await getSetupSession();
const store = await loadCurrentStoreIdentity();

if (!session || !store) {
pageAppearanceMessage.textContent =
"You must be logged in with a store assigned.";
return;
}

pageAppearanceMessage.textContent =
"Saving page appearance...";

const { error } =
await window.supabaseClient
.from("seller_page_settings")
.upsert(
{
seller_id: session.user.id,
store_id: store.id,
page_title:
pageTitleInput.value.trim() || null,
background_color:
backgroundColorInput.value || "#ffffff",
featured_section_title:
featuredSectionTitleInput.value || "Featured",
updated_at:
new Date().toISOString()
},
{
onConflict: "store_id"
}
);

if (error) {
pageAppearanceMessage.textContent = error.message;
return;
}

pageAppearanceMessage.textContent =
"Page appearance saved successfully.";
}

async function saveBusinessInfo() {
const session = await getSetupSession();
const store = await loadCurrentStoreIdentity();

if (!session || !store) {
businessInfoMessage.textContent =
"You must be logged in with a store assigned.";
return;
}

if (
businessEmailInput.value &&
!businessEmailInput.checkValidity()
) {
businessInfoMessage.textContent =
"Please enter a valid email address.";
return;
}

const zipDigits =
digitsOnly(businessZipInput.value);

if (
!onlineSalesOnlyInput.checked &&
zipDigits.length > 0 &&
zipDigits.length !== 5
) {
businessInfoMessage.textContent =
"ZIP must contain exactly 5 digits.";
return;
}

const phoneDigits =
businessPhoneDigits;

if (
phoneDigits.length > 0 &&
phoneDigits.length !== 10
) {
businessInfoMessage.textContent =
"Phone must contain exactly 10 digits.";
return;
}

businessInfoMessage.textContent =
"Saving business info...";

const { error } =
await window.supabaseClient
.from("seller_page_settings")
.upsert(
{
seller_id: session.user.id,
store_id: store.id,
online_sales_only:
onlineSalesOnlyInput.checked,
business_street:
businessStreetInput.value.trim() || null,
business_city:
businessCityInput.value.trim() || null,
business_state:
businessStateInput.value.trim() || null,
business_zip:
zipDigits || null,
business_phone:
phoneDigits || null,
business_email:
businessEmailInput.value.trim() || null,
updated_at:
new Date().toISOString()
},
{
onConflict: "store_id"
}
);

if (error) {
businessInfoMessage.textContent = error.message;
return;
}

businessInfoMessage.textContent =
"Business info saved successfully.";
}

async function saveBusinessHours() {
const session = await getSetupSession();
const store = await loadCurrentStoreIdentity();

if (!session || !store) {
businessHoursMessage.textContent =
"You must be logged in with a store assigned.";
return;
}

for (const day of businessDays) {
if (
day.openCheckbox.checked &&
(
!day.openTime.value ||
!day.openPeriod.value ||
!day.closeTime.value ||
!day.closePeriod.value
)
) {
businessHoursMessage.textContent =
`${day.name} needs both an opening and closing time.`;
return;
}
}

businessHoursMessage.textContent =
"Saving business hours...";

const rows =
businessDays.map((day) => ({
seller_id: session.user.id,
store_id: store.id,
day_of_week: day.databaseDay,
is_open: day.openCheckbox.checked,
open_time:
day.openCheckbox.checked
? convertBusinessControlsToStoredTime(
day.openTime.value,
day.openPeriod.value
)
: null,
close_time:
day.openCheckbox.checked
? convertBusinessControlsToStoredTime(
day.closeTime.value,
day.closePeriod.value
)
: null
}));

const { error } =
await window.supabaseClient
.from("seller_hours")
.upsert(
rows,
{
onConflict: "store_id,day_of_week"
}
);

if (error) {
businessHoursMessage.textContent = error.message;
return;
}

businessHoursMessage.textContent =
"Business hours saved successfully.";
}

async function loadStoreItemFieldPreferences() {
const store =
await loadCurrentStoreIdentity();

if (!store) {
storeItemFieldsMessage.textContent =
"No store membership is assigned.";
return;
}

storeItemFieldsMessage.textContent =
"Loading optional item fields...";

const { data, error } =
await window.supabaseClient
.from("store_item_field_preferences")
.select("field_key, is_enabled, display_order")
.eq("store_id", store.id)
.order(
"display_order",
{ ascending: true }
);

if (error) {
storeItemFieldsMessage.textContent =
error.message;
return;
}

const preferenceMap =
new Map(
(data || []).map(
(row) => [
row.field_key,
row
]
)
);

storeFieldQuantity.checked =
preferenceMap.get("quantity")?.is_enabled === true;

storeFieldLocation.checked =
preferenceMap.get("location")?.is_enabled === true;

storeFieldSellerItemNumber.checked =
preferenceMap.get("seller_item_number")?.is_enabled === true;

storeItemFieldsMessage.textContent = "";
}

async function saveStoreItemFieldPreferences() {
const store =
await loadCurrentStoreIdentity();

if (!store) {
storeItemFieldsMessage.textContent =
"You must be logged in with a store assigned.";
return;
}

storeItemFieldsMessage.textContent =
"Saving optional item fields...";

const rows = [
{
field_key: "quantity",
is_enabled: storeFieldQuantity.checked,
display_order: 10
},
{
field_key: "location",
is_enabled: storeFieldLocation.checked,
display_order: 20
},
{
field_key: "seller_item_number",
is_enabled: storeFieldSellerItemNumber.checked,
display_order: 30
}
];

for (const row of rows) {
const { error } =
await window.supabaseClient
.from("store_item_field_preferences")
.update({
is_enabled: row.is_enabled,
display_order: row.display_order,
updated_at:
new Date().toISOString()
})
.eq("store_id", store.id)
.eq("field_key", row.field_key);

if (error) {
storeItemFieldsMessage.textContent =
error.message;
return;
}
}

storeItemFieldsMessage.textContent =
"Optional item fields saved successfully.";
}

setupPageAppearance.addEventListener(
"click",
() => {
hideSellerPageSetupAreas();
pageAppearanceSection.hidden = false;
}
);

setupBusinessInfo.addEventListener(
"click",
() => {
hideSellerPageSetupAreas();
businessInfoSection.hidden = false;
}
);

setupBusinessHours.addEventListener(
"click",
() => {
hideSellerPageSetupAreas();
businessHoursSection.hidden = false;
}
);

setupStoreSetup.addEventListener(
"click",
async () => {
hideSellerPageSetupAreas();
storeSetupSection.hidden = false;
storeSetupModule.value =
"optional_item_fields";
optionalItemFieldsPanel.hidden = false;
await loadStoreItemFieldPreferences();
}
);

storeSetupModule.addEventListener(
"change",
() => {
optionalItemFieldsPanel.hidden =
storeSetupModule.value !==
"optional_item_fields";
}
);

onlineSalesOnlyInput.addEventListener(
"change",
() => {
updateAddressFieldState();
}
);

businessZipInput.addEventListener(
"input",
() => {
businessZipInput.value =
digitsOnly(businessZipInput.value).slice(0, 5);
}
);

businessPhoneInput.addEventListener(
"beforeinput",
(event) => {
if (
event.inputType === "deleteContentBackward" ||
event.inputType === "deleteContentForward"
) {
event.preventDefault();
businessPhoneDigits =
businessPhoneDigits.slice(0, -1);
renderBusinessPhoneMask();
return;
}

if (event.inputType.startsWith("insert")) {
const newDigits =
digitsOnly(event.data || "");

if (newDigits) {
event.preventDefault();
businessPhoneDigits =
(businessPhoneDigits + newDigits).slice(0, 10);
renderBusinessPhoneMask();
}
}
}
);

businessPhoneInput.addEventListener(
"paste",
(event) => {
event.preventDefault();

const pastedDigits =
digitsOnly(
event.clipboardData?.getData("text") || ""
);

businessPhoneDigits =
(businessPhoneDigits + pastedDigits).slice(0, 10);
renderBusinessPhoneMask();
}
);

businessPhoneInput.addEventListener(
"focus",
() => {
renderBusinessPhoneMask();
}
);

businessPhoneInput.addEventListener(
"click",
() => {
renderBusinessPhoneMask();
}
);

businessDays.forEach((day) => {
day.openCheckbox.addEventListener(
"change",
() => {
if (day.openCheckbox.checked) {
if (!day.openTime.value) {
day.openTime.value = "8:00";
}

if (!day.openPeriod.value) {
day.openPeriod.value = "AM";
}

if (!day.closeTime.value) {
day.closeTime.value = "5:00";
}

if (!day.closePeriod.value) {
day.closePeriod.value = "PM";
}
}

updateBusinessDayState(day);
}
);
});

savePageAppearanceButton.addEventListener(
"click",
async () => {
await savePageAppearance();
}
);

saveBusinessInfoButton.addEventListener(
"click",
async () => {
await saveBusinessInfo();
}
);

saveBusinessHoursButton.addEventListener(
"click",
async () => {
await saveBusinessHours();
}
);

saveStoreItemFieldsButton.addEventListener(
"click",
async () => {
await saveStoreItemFieldPreferences();
}
);

document
.getElementById("dashboard-seller-page")
.addEventListener(
"click",
async () => {
await Promise.all([
loadSellerPageSettings(),
loadBusinessHours()
]);
}
);

populateBusinessTimeOptions();

businessDays.forEach((day) => {
setBusinessDayDefaults(day);
});

updateAllBusinessDayStates();