const buyerMessage = document.getElementById("buyer-message");
const buyerFeaturedMessage = document.getElementById("buyer-featured-message");
const buyerFeaturedTitle = document.getElementById("buyer-featured-title");
const buyerFeaturedGrid = document.getElementById("buyer-grid");
const buyerFeaturedPrevious = document.getElementById("buyer-featured-previous");
const buyerFeaturedNext = document.getElementById("buyer-featured-next");
const buyerCatalogGrid = document.getElementById("buyer-catalog-grid");
const buyerCatalogMessage = document.getElementById("buyer-catalog-message");
const buyerPageTitle = document.getElementById("buyer-page-title");
const buyerInfoMenuWrapper = document.getElementById("buyer-info-menu-wrapper");
const buyerInfoButton = document.getElementById("buyer-info-button");
const buyerInfoDropdown = document.getElementById("buyer-info-dropdown");
const buyerInfoModal = document.getElementById("buyer-info-modal");
const buyerInfoModalTitle = document.getElementById("buyer-info-modal-title");
const buyerInfoModalContent = document.getElementById("buyer-info-modal-content");
const buyerInfoModalX = document.getElementById("buyer-info-modal-x");
const buyerInfoModalClose = document.getElementById("buyer-info-modal-close");
const buyerItemModal = document.getElementById("buyer-item-modal");
const buyerItemModalTitle = document.getElementById("buyer-item-modal-title");
const buyerItemModalContent = document.getElementById("buyer-item-modal-content");
const buyerItemModalX = document.getElementById("buyer-item-modal-x");
const buyerItemModalClose = document.getElementById("buyer-item-modal-close");
const themeColorMeta = document.getElementById("theme-color-meta");
const buyerAccountEntry = document.getElementById("buyer-account-entry");
const buyerAccountForm = document.getElementById("buyer-account-form");
const buyerAccountEmail = document.getElementById("buyer-account-email");
const buyerAccountPassword = document.getElementById("buyer-account-password");
const buyerAccountPanel = document.getElementById("buyer-account-panel");
const buyerAccountLinks = document.getElementById("buyer-account-links");
const buyerCreateAccountLink = document.getElementById("buyer-create-account-link");
const buyerRecoverLink = document.getElementById("buyer-recover-link");
const buyerAccountSummary = buyerAccountEntry ? buyerAccountEntry.querySelector("summary") : null;
const buyerAccountHeading = buyerAccountPanel ? buyerAccountPanel.querySelector("h2") : null;
const buyerAccountSubmitButton = buyerAccountForm ? buyerAccountForm.querySelector('button[type="submit"]') : null;

const buyerAccountClose = document.createElement("button");
buyerAccountClose.type = "button";
buyerAccountClose.textContent = "×";
buyerAccountClose.setAttribute("aria-label", "Close account panel");
buyerAccountClose.title = "Close";
buyerAccountClose.style.position = "absolute";
buyerAccountClose.style.top = "10px";
buyerAccountClose.style.right = "10px";
buyerAccountClose.style.minWidth = "32px";
buyerAccountClose.style.minHeight = "32px";
buyerAccountClose.style.padding = "2px 7px";
buyerAccountClose.style.background = "transparent";
buyerAccountClose.style.border = "0";
buyerAccountClose.style.fontSize = "22px";
buyerAccountClose.style.lineHeight = "1";
buyerAccountClose.style.cursor = "pointer";

if (buyerAccountPanel) {
  buyerAccountPanel.appendChild(buyerAccountClose);
  buyerAccountPanel.style.maxHeight = "calc(100vh - 40px)";
  buyerAccountPanel.style.overflowY = "auto";
}

let buyerAccountMode = "login";
let currentBusinessInfoContent = null;
let currentBusinessHoursContent = null;
let currentBuyerStore = null;
let buyerRealtimeChannels = [];
let currentCatalogItems = [];
let currentCatalogImages = [];
let currentCatalogCategories = [];
let currentCatalogCategory = "all";
let currentCatalogMinPrice = "";
let currentCatalogMaxPrice = "";
let currentCatalogSort = "default";
let buyerCatalogCategorySelect = null;
let buyerCatalogMinPriceInput = null;
let buyerCatalogMaxPriceInput = null;
let buyerCatalogSortSelect = null;
let buyerProfileMobileDigits = "";

const buyerAuthenticatedView = document.createElement("div");
buyerAuthenticatedView.id = "buyer-authenticated-account";
buyerAuthenticatedView.hidden = true;
buyerAuthenticatedView.style.display = "none";
buyerAuthenticatedView.style.marginTop = "10px";
buyerAuthenticatedView.style.paddingTop = "10px";
buyerAuthenticatedView.style.borderTop = "1px solid #d8d8d8";

const buyerProfileSection = document.createElement("section");
buyerProfileSection.id = "buyer-profile-section";

const buyerProfileHeading = document.createElement("h3");
buyerProfileHeading.textContent = "Complete Buyer Profile";
buyerProfileHeading.style.margin = "0 0 6px";
buyerProfileHeading.style.fontSize = "20px";

const buyerProfileIntro = document.createElement("p");
buyerProfileIntro.textContent = "Add your name and mobile number to activate your buyer profile.";
buyerProfileIntro.style.margin = "0 0 10px";
buyerProfileIntro.style.fontSize = "14px";
buyerProfileIntro.style.lineHeight = "1.3";

const buyerProfileForm = document.createElement("form");
buyerProfileForm.id = "buyer-profile-form";
buyerProfileForm.style.display = "grid";
buyerProfileForm.style.gap = "6px";

function createProfileField(labelText, id, type, autocomplete) {
  const label = document.createElement("label");
  label.textContent = labelText;
  label.setAttribute("for", id);
  label.style.fontSize = "15px";

  const input = document.createElement("input");
  input.id = id;
  input.type = type;
  input.required = true;
  input.autocomplete = autocomplete;
  input.style.width = "100%";
  input.style.boxSizing = "border-box";
  input.style.minHeight = "38px";
  input.style.marginBottom = "4px";

  return { label, input };
}

const firstNameField = createProfileField("First Name", "buyer-profile-first-name", "text", "given-name");
const buyerProfileFirstNameInput = firstNameField.input;
const lastNameField = createProfileField("Last Name", "buyer-profile-last-name", "text", "family-name");
const buyerProfileLastNameInput = lastNameField.input;
const mobileField = createProfileField("Mobile", "buyer-profile-mobile", "tel", "tel");
const buyerProfileMobileInput = mobileField.input;
buyerProfileMobileInput.inputMode = "numeric";
buyerProfileMobileInput.value = "(xxx) xxx-xxxx";
buyerProfileMobileInput.style.marginBottom = "6px";

const buyerProfileSaveButton = document.createElement("button");
buyerProfileSaveButton.type = "submit";
buyerProfileSaveButton.textContent = "Save Buyer Profile";
buyerProfileSaveButton.style.width = "100%";
buyerProfileSaveButton.style.minHeight = "40px";
buyerProfileSaveButton.style.cursor = "pointer";

[firstNameField.label, buyerProfileFirstNameInput, lastNameField.label, buyerProfileLastNameInput, mobileField.label, buyerProfileMobileInput, buyerProfileSaveButton].forEach((node) => {
  buyerProfileForm.appendChild(node);
});

const buyerProfileReady = document.createElement("p");
buyerProfileReady.textContent = "Buyer profile active.";
buyerProfileReady.hidden = true;
buyerProfileReady.style.display = "none";
buyerProfileReady.style.margin = "0";
buyerProfileReady.style.fontWeight = "600";

buyerProfileSection.appendChild(buyerProfileHeading);
buyerProfileSection.appendChild(buyerProfileIntro);
buyerProfileSection.appendChild(buyerProfileForm);
buyerProfileSection.appendChild(buyerProfileReady);
buyerAuthenticatedView.appendChild(buyerProfileSection);

const buyerLogoutButton = document.createElement("button");
buyerLogoutButton.type = "button";
buyerLogoutButton.textContent = "Log Out";
buyerLogoutButton.style.width = "100%";
buyerLogoutButton.style.minHeight = "40px";
buyerLogoutButton.style.marginTop = "12px";
buyerLogoutButton.style.cursor = "pointer";
buyerAuthenticatedView.appendChild(buyerLogoutButton);

if (buyerAccountPanel) {
  buyerAccountPanel.appendChild(buyerAuthenticatedView);
}

const buyerAccountMessage = document.createElement("p");
buyerAccountMessage.id = "buyer-account-message";
buyerAccountMessage.setAttribute("aria-live", "polite");
buyerAccountMessage.style.marginTop = "14px";
buyerAccountMessage.style.marginBottom = "0";
if (buyerAccountPanel) {
  buyerAccountPanel.appendChild(buyerAccountMessage);
}

function showBuyerAccountMessage(message, kind = "normal") {
  buyerAccountMessage.textContent = message;
  const highlighted = kind === "existing-account";
  buyerAccountMessage.style.padding = highlighted ? "12px" : "0";
  buyerAccountMessage.style.border = highlighted ? "1px solid #d6a700" : "0";
  buyerAccountMessage.style.borderRadius = highlighted ? "8px" : "0";
  buyerAccountMessage.style.background = highlighted ? "#fff3bf" : "transparent";
  buyerAccountMessage.style.fontWeight = highlighted ? "600" : "400";
}

function createCatalogControls() {
  if (document.getElementById("buyer-catalog-controls")) {
    return;
  }

  const controls = document.createElement("div");
  controls.id = "buyer-catalog-controls";

  function createControlGroup(labelText, control) {
    const group = document.createElement("div");
    group.className = "buyer-catalog-control-group";

    const label = document.createElement("label");
    label.textContent = labelText;
    label.htmlFor = control.id;

    group.appendChild(label);
    group.appendChild(control);

    return group;
  }

  function createSubsection(id) {
    const subsection = document.createElement("div");
    subsection.id = id;
    subsection.className = "buyer-catalog-subsection";
    return subsection;
  }

  buyerCatalogCategorySelect = document.createElement("select");
  buyerCatalogCategorySelect.id = "buyer-catalog-category";

  buyerCatalogMinPriceInput = document.createElement("input");
  buyerCatalogMinPriceInput.id = "buyer-catalog-min-price";
  buyerCatalogMinPriceInput.type = "number";
  buyerCatalogMinPriceInput.min = "0";
  buyerCatalogMinPriceInput.step = "1";
  buyerCatalogMinPriceInput.placeholder = "No minimum";

  buyerCatalogMaxPriceInput = document.createElement("input");
  buyerCatalogMaxPriceInput.id = "buyer-catalog-max-price";
  buyerCatalogMaxPriceInput.type = "number";
  buyerCatalogMaxPriceInput.min = "0";
  buyerCatalogMaxPriceInput.step = "1";
  buyerCatalogMaxPriceInput.placeholder = "No maximum";

  buyerCatalogSortSelect = document.createElement("select");
  buyerCatalogSortSelect.id = "buyer-catalog-sort";

  [
    {
      value: "default",
      label: "Newest"
    },
    {
      value: "low-high",
      label: "Price: Low to High"
    },
    {
      value: "high-low",
      label: "Price: High to Low"
    }
  ].forEach((optionData) => {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    buyerCatalogSortSelect.appendChild(option);
  });

  const clearButton = document.createElement("button");
  clearButton.id = "buyer-catalog-clear-button";
  clearButton.type = "button";
  clearButton.textContent = "Clear";

  buyerCatalogCategorySelect.addEventListener("change", () => {
    currentCatalogCategory = buyerCatalogCategorySelect.value;
    renderCurrentCatalog();
  });

  buyerCatalogMinPriceInput.addEventListener("input", () => {
    currentCatalogMinPrice = buyerCatalogMinPriceInput.value;
    renderCurrentCatalog();
  });

  buyerCatalogMaxPriceInput.addEventListener("input", () => {
    currentCatalogMaxPrice = buyerCatalogMaxPriceInput.value;
    renderCurrentCatalog();
  });

  buyerCatalogSortSelect.addEventListener("change", () => {
    currentCatalogSort = buyerCatalogSortSelect.value;
    renderCurrentCatalog();
  });

  clearButton.addEventListener("click", () => {
    currentCatalogCategory = "all";
    currentCatalogMinPrice = "";
    currentCatalogMaxPrice = "";
    currentCatalogSort = "default";

    buyerCatalogCategorySelect.value = "all";
    buyerCatalogMinPriceInput.value = "";
    buyerCatalogMaxPriceInput.value = "";
    buyerCatalogSortSelect.value = "default";

    renderCurrentCatalog();
  });

  const categorySortSection = createSubsection("buyer-catalog-category-sort-section");
  categorySortSection.appendChild(
    createControlGroup(
      "Category",
      buyerCatalogCategorySelect
    )
  );
  categorySortSection.appendChild(
    createControlGroup(
      "Sort",
      buyerCatalogSortSelect
    )
  );

  const priceSection = createSubsection("buyer-catalog-price-section");
  priceSection.appendChild(
    createControlGroup(
      "Min $",
      buyerCatalogMinPriceInput
    )
  );
  priceSection.appendChild(
    createControlGroup(
      "Max $",
      buyerCatalogMaxPriceInput
    )
  );

  const clearSection = createSubsection("buyer-catalog-clear-section");
  clearSection.appendChild(clearButton);

  controls.appendChild(categorySortSection);
  controls.appendChild(priceSection);
  controls.appendChild(clearSection);

  const controlsZone = document.getElementById("buyer-catalog-controls-zone");

  if (controlsZone) {
    controlsZone.appendChild(controls);
  } else if (buyerCatalogGrid?.parentNode) {
    buyerCatalogGrid.parentNode.insertBefore(
      controls,
      buyerCatalogGrid
    );
  }
}

function populateCatalogCategoryOptions(categories) {
  if (!buyerCatalogCategorySelect) {
    return;
  }

  currentCatalogCategories = categories || [];

  const previousValue = currentCatalogCategory;

  buyerCatalogCategorySelect.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "All Categories";
  buyerCatalogCategorySelect.appendChild(allOption);

  currentCatalogCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = String(category.id);
    option.textContent = category.name;
    buyerCatalogCategorySelect.appendChild(option);
  });

  const uncategorizedOption = document.createElement("option");
  uncategorizedOption.value = "uncategorized";
  uncategorizedOption.textContent = "Uncategorized";
  buyerCatalogCategorySelect.appendChild(uncategorizedOption);

  const previousStillExists =
    Array.from(
      buyerCatalogCategorySelect.options
    ).some(
      (option) =>
        option.value === previousValue
    );

  currentCatalogCategory =
    previousStillExists
      ? previousValue
      : "all";

  buyerCatalogCategorySelect.value =
    currentCatalogCategory;
}

function applyCatalogControls(catalogItems) {
  const minimumPrice =
    currentCatalogMinPrice === ""
      ? null
      : Number(currentCatalogMinPrice);

  const maximumPrice =
    currentCatalogMaxPrice === ""
      ? null
      : Number(currentCatalogMaxPrice);

  if (
    minimumPrice !== null &&
    maximumPrice !== null &&
    minimumPrice > maximumPrice
  ) {
    return {
      items: [],
      validationMessage:
        "Minimum price cannot be greater than maximum price."
    };
  }

  const filteredItems =
    catalogItems.filter((item) => {
      if (
        currentCatalogCategory ===
        "uncategorized"
      ) {
        if (
          item.category_id !== null &&
          item.category_id !== undefined
        ) {
          return false;
        }
      } else if (
        currentCatalogCategory !== "all" &&
        String(
          item.category_id ?? ""
        ) !== currentCatalogCategory
      ) {
        return false;
      }

      const itemPrice =
        Number(item.price);

      if (
        minimumPrice !== null &&
        itemPrice < minimumPrice
      ) {
        return false;
      }

      if (
        maximumPrice !== null &&
        itemPrice > maximumPrice
      ) {
        return false;
      }

      return true;
    });

  if (
    currentCatalogSort ===
    "low-high"
  ) {
    filteredItems.sort(
      (a, b) =>
        Number(a.price) -
        Number(b.price)
    );
  } else if (
    currentCatalogSort ===
    "high-low"
  ) {
    filteredItems.sort(
      (a, b) =>
        Number(b.price) -
        Number(a.price)
    );
  }

  return {
    items: filteredItems,
    validationMessage: ""
  };
}

function renderCurrentCatalog() {
  buyerCatalogGrid.innerHTML = "";
  buyerCatalogMessage.textContent = "";

  if (
    currentCatalogItems.length === 0
  ) {
    buyerCatalogMessage.textContent =
      "No additional published items right now.";
    return;
  }

  const {
    items,
    validationMessage
  } =
    applyCatalogControls(
      currentCatalogItems
    );

  if (validationMessage) {
    buyerCatalogMessage.textContent =
      validationMessage;
    return;
  }

  items.forEach((item) => {
    renderCatalogBuyerItem(
      item,
      currentCatalogImages
    );
  });

  if (items.length === 0) {
    buyerCatalogMessage.textContent =
      "No published items match the current catalog filters.";
  }
}

function getFeaturedCardStep() {
  const firstPosition =
    buyerFeaturedGrid?.querySelector(
      "#buyer-position-1, #buyer-position-2, #buyer-position-3"
    );

  if (!firstPosition) {
    return 166;
  }

  const width =
    firstPosition
      .getBoundingClientRect()
      .width;

  const gridStyle =
    window.getComputedStyle(
      buyerFeaturedGrid
    );

  const gap =
    Number.parseFloat(
      gridStyle.columnGap
    ) || 16;

  return width + gap;
}

function updateFeaturedCarouselControls() {
  if (
    !buyerFeaturedGrid ||
    !buyerFeaturedPrevious ||
    !buyerFeaturedNext
  ) {
    return;
  }

  const hasOverflow =
    buyerFeaturedGrid.scrollWidth >
    buyerFeaturedGrid.clientWidth + 2;

  buyerFeaturedPrevious.hidden =
    !hasOverflow;

  buyerFeaturedNext.hidden =
    !hasOverflow;

  if (!hasOverflow) {
    buyerFeaturedPrevious.disabled = true;
    buyerFeaturedNext.disabled = true;
    buyerFeaturedGrid.scrollLeft = 0;
    return;
  }

  const maxScroll =
    buyerFeaturedGrid.scrollWidth -
    buyerFeaturedGrid.clientWidth;

  buyerFeaturedPrevious.disabled =
    buyerFeaturedGrid.scrollLeft <= 2;

  buyerFeaturedNext.disabled =
    buyerFeaturedGrid.scrollLeft >=
    maxScroll - 2;
}

function synchronizeFeaturedCardHeights() {
  if (!buyerFeaturedGrid) {
    return;
  }

  const featuredCards =
    Array.from(
      buyerFeaturedGrid.querySelectorAll(
        ".buyer-card"
      )
    );

  if (
    featuredCards.length === 0
  ) {
    return;
  }

  featuredCards.forEach((card) => {
    card.style.height = "auto";
  });

  const tallestHeight =
    Math.max(
      ...featuredCards.map((card) =>
        Math.ceil(
          card
            .getBoundingClientRect()
            .height
        )
      )
    );

  featuredCards.forEach((card) => {
    card.style.height =
      `${tallestHeight}px`;
  });
}

function refreshFeaturedPresentation() {
  window.requestAnimationFrame(
    () => {
      synchronizeFeaturedCardHeights();
      updateFeaturedCarouselControls();
    }
  );
}

function moveFeaturedCarousel(direction) {
  buyerFeaturedGrid?.scrollBy({
    left:
      direction *
      getFeaturedCardStep(),
    behavior: "smooth"
  });
}

buyerFeaturedPrevious
  ?.addEventListener(
    "click",
    () =>
      moveFeaturedCarousel(-1)
  );

buyerFeaturedNext
  ?.addEventListener(
    "click",
    () =>
      moveFeaturedCarousel(1)
  );

buyerFeaturedGrid
  ?.addEventListener(
    "scroll",
    updateFeaturedCarouselControls,
    {
      passive: true
    }
  );

window.addEventListener(
  "resize",
  refreshFeaturedPresentation
);

function getStoreSlugFromPageAddress() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const querySlug =
    params.get("store")?.trim();

  if (querySlug) {
    return querySlug;
  }

  const pathParts =
    window.location.pathname
      .split("/")
      .filter(Boolean);

  const storeIndex =
    pathParts.indexOf("store");

  if (
    storeIndex >= 0 &&
    pathParts[
      storeIndex + 1
    ]
  ) {
    return decodeURIComponent(
      pathParts[
        storeIndex + 1
      ]
    );
  }

  return "sawdust-shawn";
}

async function resolveBuyerStore() {
  if (currentBuyerStore) {
    return currentBuyerStore;
  }

  const storeSlug =
    getStoreSlugFromPageAddress();

  const {
    data: store,
    error
  } =
    await window
      .supabaseBuyerClient
      .from("stores")
      .select(
        "id, name, slug, status"
      )
      .eq(
        "slug",
        storeSlug
      )
      .eq(
        "status",
        "active"
      )
      .maybeSingle();

  if (error) {
    buyerMessage.textContent =
      error.message;
    return null;
  }

  if (!store) {
    clearBuyerItemDisplays();
    buyerMessage.textContent =
      "Store not found.";
    return null;
  }

  currentBuyerStore = store;

  return currentBuyerStore;
}

function clearBuyerItemDisplays() {
  [
    1,
    2,
    3
  ].forEach((position) => {
    const container =
      document.getElementById(
        `buyer-position-${position}`
      );

    if (container) {
      container.innerHTML = "";
    }
  });

  if (buyerCatalogGrid) {
    buyerCatalogGrid.innerHTML =
      "";
  }

  if (buyerFeaturedGrid) {
    buyerFeaturedGrid.scrollLeft =
      0;
  }

  buyerFeaturedMessage.textContent =
    "";

  buyerCatalogMessage.textContent =
    "";
}

function showComingSoon() {
  clearBuyerItemDisplays();

  buyerMessage.textContent =
    "Coming Soon";

  buyerMessage.classList.add(
    "coming-soon"
  );
}

function clearBuyerMessage() {
  buyerMessage.textContent = "";

  buyerMessage.classList.remove(
    "coming-soon"
  );
}

function getPublicImageUrl(
  imagePath
) {
  const {
    data: imageData
  } =
    window
      .supabaseBuyerClient
      .storage
      .from(
        "product_images"
      )
      .getPublicUrl(
        imagePath
      );

  return imageData.publicUrl;
}

function styleBuyerPositionContainer(
  container
) {
  container.style.width =
    "100%";

  container.style.minWidth =
    "0";

  container.style.boxSizing =
    "border-box";
}

function createSlideButton(
  symbol,
  accessibleLabel
) {
  const button =
    document.createElement(
      "button"
    );

  button.type = "button";

  button.className =
    "buyer-slide-button";

  button.textContent =
    symbol;

  button.setAttribute(
    "aria-label",
    accessibleLabel
  );

  button.title =
    accessibleLabel;

  return button;
}

function createInfoLine(
  container,
  label,
  value,
  className =
    "buyer-info-line"
) {
  if (!value) {
    return;
  }

  const line =
    document.createElement(
      "p"
    );

  line.className =
    className;

  if (label) {
    const strong =
      document.createElement(
        "strong"
      );

    strong.textContent =
      `${label}: `;

    line.appendChild(
      strong
    );
  }

  line.appendChild(
    document.createTextNode(
      value
    )
  );

  container.appendChild(
    line
  );
}

function formatBusinessTime(
  timeValue
) {
  if (!timeValue) {
    return "";
  }

  const parts =
    timeValue
      .slice(
        0,
        5
      )
      .split(":");

  let hour =
    Number(parts[0]);

  const minute =
    parts[1];

  const suffix =
    hour >= 12
      ? "PM"
      : "AM";

  hour %= 12;

  if (hour === 0) {
    hour = 12;
  }

  return `${hour}:${minute} ${suffix}`;
}

function buildBusinessInfoContent(
  settings
) {
  if (!settings) {
    return null;
  }

  const container =
    document.createElement(
      "div"
    );

  let visibleInformation =
    false;

  if (
    settings.online_sales_only ===
    true
  ) {
    createInfoLine(
      container,
      "",
      "Online Sales Only",
      "buyer-info-line buyer-online-only"
    );

    visibleInformation =
      true;
  } else {
    if (
      settings.business_street
    ) {
      createInfoLine(
        container,
        "Street Address",
        settings.business_street
      );

      visibleInformation =
        true;
    }

    if (
      settings.business_city
    ) {
      createInfoLine(
        container,
        "City",
        settings.business_city
      );

      visibleInformation =
        true;
    }

    if (
      settings.business_state
    ) {
      createInfoLine(
        container,
        "State",
        settings.business_state
      );

      visibleInformation =
        true;
    }

    if (
      settings.business_zip
    ) {
      createInfoLine(
        container,
        "ZIP",
        settings.business_zip
      );

      visibleInformation =
        true;
    }
  }

  if (
    settings.business_phone
  ) {
    createInfoLine(
      container,
      "Phone",
      settings.business_phone
    );

    visibleInformation =
      true;
  }

  if (
    settings.business_email
  ) {
    createInfoLine(
      container,
      "Email",
      settings.business_email
    );

    visibleInformation =
      true;
  }

  return visibleInformation
    ? container
    : null;
}

function buildBusinessHoursContent(
  hours
) {
  const savedHours =
    hours || [];

  if (
    !savedHours.some(
      (row) =>
        row.is_open === true
    )
  ) {
    return null;
  }

  const container =
    document.createElement(
      "div"
    );

  const days = [
    {
      name: "Monday",
      databaseDay: 1
    },
    {
      name: "Tuesday",
      databaseDay: 2
    },
    {
      name: "Wednesday",
      databaseDay: 3
    },
    {
      name: "Thursday",
      databaseDay: 4
    },
    {
      name: "Friday",
      databaseDay: 5
    },
    {
      name: "Saturday",
      databaseDay: 6
    },
    {
      name: "Sunday",
      databaseDay: 0
    }
  ];

  days.forEach((day) => {
    const savedDay =
      savedHours.find(
        (row) =>
          Number(
            row.day_of_week
          ) ===
          day.databaseDay
      );

    const line =
      document.createElement(
        "p"
      );

    line.className =
      "buyer-hours-line";

    const strong =
      document.createElement(
        "strong"
      );

    strong.textContent =
      `${day.name}: `;

    line.appendChild(
      strong
    );

    if (
      !savedDay ||
      savedDay.is_open !==
        true
    ) {
      line.appendChild(
        document.createTextNode(
          "Closed"
        )
      );
    } else {
      const opening =
        formatBusinessTime(
          savedDay.open_time
        );

      const closing =
        formatBusinessTime(
          savedDay.close_time
        );

      line.appendChild(
        document.createTextNode(
          opening &&
          closing
            ? `${opening} – ${closing}`
            : "Open"
        )
      );
    }

    container.appendChild(
      line
    );
  });

  return container;
}

function closeInfoDropdown() {
  buyerInfoDropdown.hidden =
    true;

  buyerInfoButton.setAttribute(
    "aria-expanded",
    "false"
  );
}

function openInfoModal(
  title,
  content
) {
  buyerInfoModalTitle.textContent =
    title;

  buyerInfoModalContent.innerHTML =
    "";

  buyerInfoModalContent.appendChild(
    content.cloneNode(true)
  );

  buyerInfoModal.hidden =
    false;

  closeInfoDropdown();
}

function closeInfoModal() {
  buyerInfoModal.hidden =
    true;

  buyerInfoModalContent.innerHTML =
    "";
}

function rebuildInfoMenu() {
  buyerInfoDropdown.innerHTML =
    "";

  const options = [];

  if (
    currentBusinessInfoContent
  ) {
    options.push({
      title:
        "Business Info",
      content:
        currentBusinessInfoContent
    });
  }

  if (
    currentBusinessHoursContent
  ) {
    options.push({
      title:
        "Business Hours",
      content:
        currentBusinessHoursContent
    });
  }

  if (
    options.length === 0
  ) {
    buyerInfoMenuWrapper.hidden =
      true;

    closeInfoDropdown();

    return;
  }

  buyerInfoMenuWrapper.hidden =
    false;

  options.forEach((option) => {
    const button =
      document.createElement(
        "button"
      );

    button.type =
      "button";

    button.className =
      "buyer-info-menu-option";

    button.textContent =
      option.title;

    button.addEventListener(
      "click",
      () =>
        openInfoModal(
          option.title,
          option.content
        )
    );

    buyerInfoDropdown.appendChild(
      button
    );
  });
}

async function loadBuyerStorefront() {
  buyerPageTitle.textContent =
    "Resale Mob";

  document.body.style.background =
    "#ffffff";

  themeColorMeta?.setAttribute(
    "content",
    "#ffffff"
  );

  currentBusinessInfoContent =
    null;

  currentBusinessHoursContent =
    null;

  rebuildInfoMenu();

  const store =
    await resolveBuyerStore();

  if (!store) {
    return;
  }

  const {
    data: settings,
    error: settingsError
  } =
    await window
      .supabaseBuyerClient
      .from(
        "seller_page_settings"
      )
      .select(
        "page_title, background_color, featured_section_title, online_sales_only, business_street, business_city, business_state, business_zip, business_phone, business_email"
      )
      .eq(
        "store_id",
        store.id
      )
      .maybeSingle();

  if (settingsError) {
    console.error(
      "Could not load seller page settings:",
      settingsError.message
    );

    return;
  }

  buyerPageTitle.textContent =
    settings?.page_title ||
    store.name ||
    "Resale Mob";

  buyerFeaturedTitle.textContent =
    settings
      ?.featured_section_title ||
    "Featured";

  const backgroundColor =
    settings
      ?.background_color ||
    "#ffffff";

  document.body.style.background =
    backgroundColor;

  themeColorMeta?.setAttribute(
    "content",
    backgroundColor
  );

  currentBusinessInfoContent =
    buildBusinessInfoContent(
      settings
    );

  const {
    data: hours,
    error: hoursError
  } =
    await window
      .supabaseBuyerClient
      .from(
        "seller_hours"
      )
      .select(
        "day_of_week, is_open, open_time, close_time"
      )
      .eq(
        "store_id",
        store.id
      );

  if (hoursError) {
    console.error(
      "Could not load business hours:",
      hoursError.message
    );

    rebuildInfoMenu();

    return;
  }

  currentBusinessHoursContent =
    buildBusinessHoursContent(
      hours || []
    );

  rebuildInfoMenu();
}

function getBuyerItemImages(
  item,
  itemImages
) {
  let images =
    (itemImages || [])
      .filter(
        (image) =>
          image.item_id ===
          item.id
      )
      .sort(
        (a, b) =>
          Number(
            a.sort_order
          ) -
          Number(
            b.sort_order
          )
      );

  if (
    images.length === 0 &&
    item.image_path
  ) {
    images = [
      {
        item_id: item.id,
        image_path:
          item.image_path,
        sort_order: 1
      }
    ];
  }

  return images;
}

function createBuyerImageSlideshow(
  item,
  itemImages
) {
  const images =
    getBuyerItemImages(
      item,
      itemImages
    );

  if (
    images.length === 0
  ) {
    return null;
  }

  const slideshow =
    document.createElement(
      "div"
    );

  slideshow.className =
    "buyer-slide-stage";

  slideshow.style.width =
    "100%";

  const image =
    document.createElement(
      "img"
    );

  image.alt =
    item.name;

  image.style.display =
    "block";

  image.style.width =
    "100%";

  image.style.maxWidth =
    "100%";

  image.style.aspectRatio =
    "1 / 1";

  image.style.objectFit =
    "cover";

  image.style.borderRadius =
    "10px";

  image.style.marginBottom =
    "10px";

  let currentIndex = 0;

  const controls =
    document.createElement(
      "div"
    );

  controls.className =
    "buyer-slide-controls";

  const previousButton =
    createSlideButton(
      "‹",
      "Previous image"
    );

  const imageCounter =
    document.createElement(
      "span"
    );

  imageCounter.className =
    "buyer-slide-counter";

  const nextButton =
    createSlideButton(
      "›",
      "Next image"
    );

  function showImage() {
    const currentImage =
      images[currentIndex];

    image.src =
      getPublicImageUrl(
        currentImage.image_path
      );

    image.alt =
      `${item.name} image ${currentIndex + 1}`;

    imageCounter.textContent =
      `${currentIndex + 1} / ${images.length}`;

    previousButton.disabled =
      currentIndex === 0;

    nextButton.disabled =
      currentIndex ===
      images.length - 1;
  }

  previousButton.addEventListener(
    "click",
    () => {
      if (
        currentIndex > 0
      ) {
        currentIndex -= 1;
        showImage();
      }
    }
  );

  nextButton.addEventListener(
    "click",
    () => {
      if (
        currentIndex <
        images.length - 1
      ) {
        currentIndex += 1;
        showImage();
      }
    }
  );

  controls.appendChild(
    previousButton
  );

  controls.appendChild(
    imageCounter
  );

  controls.appendChild(
    nextButton
  );

  slideshow.appendChild(
    image
  );

  slideshow.appendChild(
    controls
  );

  showImage();

  return slideshow;
}

function closeBuyerItemModal() {
  if (!buyerItemModal) {
    return;
  }

  buyerItemModal.setAttribute(
    "hidden",
    ""
  );

  buyerItemModal.style.display =
    "none";

  if (
    buyerItemModalContent
  ) {
    buyerItemModalContent.innerHTML =
      "";
  }
}

function openBuyerItemModal(
  item,
  itemImages
) {
  if (
    !buyerItemModal ||
    !buyerItemModalTitle ||
    !buyerItemModalContent
  ) {
    console.error(
      "Item details modal is not available in the current buyer page."
    );

    return;
  }

  buyerItemModalTitle.textContent =
    item.name;

  buyerItemModalContent.innerHTML =
    "";

  const slideshow =
    createBuyerImageSlideshow(
      item,
      itemImages
    );

  if (slideshow) {
    buyerItemModalContent.appendChild(
      slideshow
    );
  }

  const price =
    document.createElement(
      "p"
    );

  price.className =
    "buyer-item-modal-price";

  price.textContent =
    `$${Number(item.price).toFixed(2)}`;

  buyerItemModalContent.appendChild(
    price
  );

  const description =
    document.createElement(
      "p"
    );

  description.className =
    "buyer-item-modal-description";

  description.textContent =
    item.description || "";

  buyerItemModalContent.appendChild(
    description
  );

  buyerItemModalContent.scrollTop =
    0;

  buyerItemModal.removeAttribute(
    "hidden"
  );

  buyerItemModal.style.display =
    "flex";

  window.requestAnimationFrame(
    () => {
      buyerItemModalX?.focus();
    }
  );
}

function createBuyerItemCard(
  item,
  itemImages
) {
  const card =
    document.createElement(
      "article"
    );

  card.className =
    "buyer-card";

  card.style.border =
    "1px solid #d8d8d8";

  card.style.borderRadius =
    "12px";

  card.style.padding =
    "12px";

  card.style.background =
    "#ffffff";

  card.style.boxSizing =
    "border-box";

  card.style.width =
    "100%";

  card.style.minWidth =
    "0";

  const slideshow =
    createBuyerImageSlideshow(
      item,
      itemImages
    );

  if (slideshow) {
    card.appendChild(
      slideshow
    );
  }

  const name =
    document.createElement(
      "h3"
    );

  name.className =
    "buyer-card-name";

  name.textContent =
    item.name;

  name.style.margin =
    "4px 0 6px";

  name.style.fontSize =
    "clamp(12px, calc(6px + 4cqi), 18px)";

  name.style.lineHeight =
    "1.2";

  name.style.overflowWrap =
    "anywhere";

  const price =
    document.createElement(
      "p"
    );

  price.className =
    "buyer-card-price";

  price.textContent =
    `$${Number(item.price).toFixed(2)}`;

  price.style.margin =
    "0 0 8px";

  price.style.fontSize =
    "clamp(11px, calc(6px + 3.33cqi), 16px)";

  price.style.fontWeight =
    "700";

  const description =
    document.createElement(
      "p"
    );

  description.textContent =
    item.description || "";

  description.style.margin =
    "0";

  description.style.fontSize =
    "clamp(10px, calc(8px + 1.33cqi), 12px)";

  description.style.lineHeight =
    "1.4";

  description.style.overflowWrap =
    "anywhere";

  card.appendChild(
    name
  );

  card.appendChild(
    price
  );

  card.appendChild(
    description
  );

  return card;
}

function renderFeaturedBuyerItem(
  displayPosition,
  item,
  itemImages
) {
  const container =
    document.getElementById(
      `buyer-position-${displayPosition}`
    );

  if (!container) {
    return;
  }

  container.innerHTML =
    "";

  styleBuyerPositionContainer(
    container
  );

  const card =
    createBuyerItemCard(
      item,
      itemImages
    );

  card.classList.add(
    "buyer-featured-card"
  );

  container.appendChild(
    card
  );
}

function renderCatalogBuyerItem(
  item,
  itemImages
) {
  const container =
    document.createElement(
      "div"
    );

  styleBuyerPositionContainer(
    container
  );

  container.style.height =
    "clamp(230px, calc(190px + 8.33vw), 290px)";

  const card =
    createBuyerItemCard(
      item,
      itemImages
    );

  card.classList.add(
    "buyer-catalog-card"
  );

  card.style.height =
    "100%";

  card.style.maxHeight =
    "100%";

  card.style.overflow =
    "hidden";

  card.style.display =
    "flex";

  card.style.flexDirection =
    "column";

  const name =
    card.querySelector(
      ".buyer-card-name"
    );

  if (name) {
    name.style.flexShrink =
      "0";
  }

  const price =
    card.querySelector(
      ".buyer-card-price"
    );

  if (price) {
    price.style.flexShrink =
      "0";
  }

  const description =
    Array.from(
      card.children
    ).find(
      (child) =>
        child.tagName ===
          "P" &&
        !child.classList.contains(
          "buyer-card-price"
        )
    );

  let moreButton =
    null;

  if (description) {
    description.classList.add(
      "buyer-catalog-description"
    );

    const descriptionWrap =
      document.createElement(
        "div"
      );

    descriptionWrap.className =
      "buyer-catalog-description-wrap";

    descriptionWrap.style.position =
      "relative";

    descriptionWrap.style.flexShrink =
      "0";

    descriptionWrap.style.height =
      "2.8em";

    descriptionWrap.style.minHeight =
      "2.8em";

    descriptionWrap.style.maxHeight =
      "2.8em";

    descriptionWrap.style.overflow =
      "hidden";

    descriptionWrap.style.fontSize =
      "clamp(10px, calc(8px + 1.33cqi), 12px)";

    descriptionWrap.style.lineHeight =
      "1.4";

    card.insertBefore(
      descriptionWrap,
      description
    );

    descriptionWrap.appendChild(
      description
    );

    description.style.display =
      "-webkit-box";

    description.style.webkitBoxOrient =
      "vertical";

    description.style.webkitLineClamp =
      "2";

    description.style.overflow =
      "hidden";

    description.style.height =
      "2.8em";

    description.style.maxHeight =
      "2.8em";

    description.style.lineHeight =
      "1.4";

    description.style.margin =
      "0";

    moreButton =
      document.createElement(
        "button"
      );

    moreButton.type =
      "button";

    moreButton.className =
      "buyer-catalog-more";

    moreButton.textContent =
      "... More";

    moreButton.hidden =
      true;

    moreButton.setAttribute(
      "aria-label",
      `Open full details for ${item.name}`
    );

    moreButton.style.position =
      "absolute";

    moreButton.style.right =
      "0";

    moreButton.style.bottom =
      "0";

    moreButton.style.margin =
      "0";

    moreButton.style.padding =
      "0 0 0 4px";

    moreButton.style.minWidth =
      "0";

    moreButton.style.minHeight =
      "0";

    moreButton.style.border =
      "0";

    moreButton.style.borderRadius =
      "0";

    moreButton.style.background =
      "#ffffff";

    moreButton.style.color =
      "#111111";

    moreButton.style.fontFamily =
      "inherit";

    moreButton.style.fontSize =
      "10px";

    moreButton.style.fontWeight =
      "700";

    moreButton.style.lineHeight =
      "1.4";

    moreButton.style.textDecoration =
      "underline";

    moreButton.style.textUnderlineOffset =
      "2px";

    moreButton.style.cursor =
      "pointer";

    moreButton.style.appearance =
      "none";

    moreButton.style.webkitAppearance =
      "none";

    moreButton.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        event.stopPropagation();

        openBuyerItemModal(
          item,
          itemImages
        );
      }
    );

    descriptionWrap.appendChild(
      moreButton
    );
  }

  const openCardButton =
    document.createElement(
      "button"
    );

  openCardButton.type =
    "button";

  openCardButton.className =
    "buyer-catalog-open-card";

  openCardButton.textContent =
    "Open Card";

  openCardButton.setAttribute(
    "aria-label",
    `Open full details for ${item.name}`
  );

  openCardButton.style.alignSelf =
    "flex-start";

  openCardButton.style.margin =
    "4px 0 0";

  openCardButton.style.padding =
    "0";

  openCardButton.style.minWidth =
    "0";

  openCardButton.style.minHeight =
    "0";

  openCardButton.style.border =
    "0";

  openCardButton.style.borderRadius =
    "0";

  openCardButton.style.background =
    "transparent";

  openCardButton.style.color =
    "#111111";

  openCardButton.style.fontFamily =
    "inherit";

  openCardButton.style.fontSize =
    "11px";

  openCardButton.style.fontWeight =
    "700";

  openCardButton.style.lineHeight =
    "1.2";

  openCardButton.style.textDecoration =
    "underline";

  openCardButton.style.textUnderlineOffset =
    "2px";

  openCardButton.style.cursor =
    "pointer";

  openCardButton.style.appearance =
    "none";

  openCardButton.style.webkitAppearance =
    "none";

  openCardButton.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      openBuyerItemModal(
        item,
        itemImages
      );
    }
  );

  card.appendChild(
    openCardButton
  );

  container.appendChild(
    card
  );

  buyerCatalogGrid.appendChild(
    container
  );

  if (
    description &&
    moreButton
  ) {
    window.requestAnimationFrame(
      () => {
        const measurement =
          document.createElement(
            "p"
          );

        const descriptionStyle =
          window.getComputedStyle(
            description
          );

        const descriptionWidth =
          description
            .getBoundingClientRect()
            .width;

        measurement.textContent =
          item.description || "";

        measurement.style.position =
          "fixed";

        measurement.style.left =
          "-10000px";

        measurement.style.top =
          "0";

        measurement.style.visibility =
          "hidden";

        measurement.style.pointerEvents =
          "none";

        measurement.style.boxSizing =
          "border-box";

        measurement.style.width =
          `${descriptionWidth}px`;

        measurement.style.margin =
          "0";

        measurement.style.padding =
          "0";

        measurement.style.border =
          "0";

        measurement.style.fontFamily =
          descriptionStyle.fontFamily;

        measurement.style.fontSize =
          descriptionStyle.fontSize;

        measurement.style.fontWeight =
          descriptionStyle.fontWeight;

        measurement.style.fontStyle =
          descriptionStyle.fontStyle;

        measurement.style.letterSpacing =
          descriptionStyle.letterSpacing;

        measurement.style.lineHeight =
          descriptionStyle.lineHeight;

        measurement.style.overflowWrap =
          "anywhere";

        measurement.style.whiteSpace =
          "normal";

        document.body.appendChild(
          measurement
        );

        const lineHeight =
          Number.parseFloat(
            descriptionStyle.lineHeight
          );

        const twoLineHeight =
          Number.isFinite(
            lineHeight
          )
            ? lineHeight * 2
            : description.clientHeight;

        const descriptionOverflows =
          measurement
            .getBoundingClientRect()
            .height >
          twoLineHeight + 1;

        measurement.remove();

        moreButton.hidden =
          !descriptionOverflows;
      }
    );
  }
}

async function loadBuyerItems() {
  buyerMessage.classList.remove(
    "coming-soon"
  );

  buyerMessage.textContent =
    "Loading items...";

  clearBuyerItemDisplays();

  const store =
    await resolveBuyerStore();

  if (!store) {
    return;
  }

  const [
    slotsResult,
    itemsResult,
    categoriesResult
  ] =
    await Promise.all([
      window
        .supabaseBuyerClient
        .from(
          "buyer_slots"
        )
        .select(
          "position, item_id"
        )
        .eq(
          "store_id",
          store.id
        )
        .not(
          "item_id",
          "is",
          null
        )
        .order(
          "position",
          {
            ascending: true
          }
        ),

      window
        .supabaseBuyerClient
        .from(
          "items"
        )
        .select(
          "id, name, price, description, image_path, category_id, created_at"
        )
        .eq(
          "store_id",
          store.id
        )
        .eq(
          "is_published",
          true
        )
        .order(
          "created_at",
          {
            ascending: false
          }
        ),

      window
        .supabaseBuyerClient
        .from(
          "categories"
        )
        .select(
          "id, name"
        )
        .eq(
          "store_id",
          store.id
        )
        .order(
          "name",
          {
            ascending: true
          }
        )
    ]);

  const {
    data: slots,
    error: slotsError
  } =
    slotsResult;

  const {
    data: publishedItems,
    error: itemsError
  } =
    itemsResult;

  const {
    data: categories,
    error: categoriesError
  } =
    categoriesResult;

  if (slotsError) {
    buyerMessage.textContent =
      slotsError.message;

    return;
  }

  if (itemsError) {
    buyerMessage.textContent =
      itemsError.message;

    return;
  }

  if (categoriesError) {
    buyerMessage.textContent =
      categoriesError.message;

    return;
  }

  populateCatalogCategoryOptions(
    categories || []
  );

  if (
    !publishedItems ||
    publishedItems.length === 0
  ) {
    currentCatalogItems =
      [];

    currentCatalogImages =
      [];

    showComingSoon();

    return;
  }

  const publishedItemIds =
    publishedItems.map(
      (item) =>
        item.id
    );

  const {
    data: itemImages,
    error: imagesError
  } =
    await window
      .supabaseBuyerClient
      .from(
        "item_images"
      )
      .select(
        "item_id, image_path, sort_order"
      )
      .eq(
        "store_id",
        store.id
      )
      .in(
        "item_id",
        publishedItemIds
      )
      .order(
        "sort_order",
        {
          ascending: true
        }
      );

  if (imagesError) {
    buyerMessage.textContent =
      imagesError.message;

    return;
  }

  const itemById =
    new Map(
      publishedItems.map(
        (item) => [
          item.id,
          item
        ]
      )
    );

  const featuredItemIds =
    new Set();

  (slots || [])
    .sort(
      (a, b) =>
        Number(
          a.position
        ) -
        Number(
          b.position
        )
    )
    .forEach((slot) => {
      const item =
        itemById.get(
          slot.item_id
        );

      if (!item) {
        return;
      }

      featuredItemIds.add(
        item.id
      );

      renderFeaturedBuyerItem(
        Number(
          slot.position
        ),
        item,
        itemImages || []
      );
    });

  if (
    featuredItemIds.size === 0
  ) {
    buyerFeaturedMessage.textContent =
      "No featured items right now.";
  }

  currentCatalogItems =
    publishedItems.filter(
      (item) =>
        !featuredItemIds.has(
          item.id
        )
    );

  currentCatalogImages =
    itemImages || [];

  renderCurrentCatalog();

  refreshFeaturedPresentation();

  clearBuyerMessage();
}

buyerInfoButton?.addEventListener(
  "click",
  () => {
    const willOpen =
      buyerInfoDropdown.hidden;

    buyerInfoDropdown.hidden =
      !willOpen;

    buyerInfoButton.setAttribute(
      "aria-expanded",
      willOpen
        ? "true"
        : "false"
    );
  }
);

buyerInfoModalX?.addEventListener(
  "click",
  closeInfoModal
);

buyerInfoModalClose?.addEventListener(
  "click",
  closeInfoModal
);

buyerInfoModal?.addEventListener(
  "click",
  (event) => {
    if (
      event.target ===
      buyerInfoModal
    ) {
      closeInfoModal();
    }
  }
);

buyerItemModalX?.addEventListener(
  "click",
  closeBuyerItemModal
);

buyerItemModalClose?.addEventListener(
  "click",
  closeBuyerItemModal
);

buyerItemModal?.addEventListener(
  "click",
  (event) => {
    if (
      event.target ===
      buyerItemModal
    ) {
      closeBuyerItemModal();
    }
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key ===
      "Escape"
    ) {
      if (
        buyerItemModal &&
        !buyerItemModal.hidden
      ) {
        closeBuyerItemModal();
      } else if (
        buyerInfoModal &&
        !buyerInfoModal.hidden
      ) {
        closeInfoModal();
      }
    }
  }
);

document.addEventListener(
  "click",
  (event) => {
    if (
      buyerInfoMenuWrapper &&
      !buyerInfoMenuWrapper.contains(
        event.target
      )
    ) {
      closeInfoDropdown();
    }
  }
);

async function subscribeBuyerRealtime() {
  const store =
    await resolveBuyerStore();

  if (!store) {
    return;
  }

  buyerRealtimeChannels.forEach(
    (channel) => {
      window
        .supabaseBuyerClient
        .removeChannel(
          channel
        );
    }
  );

  buyerRealtimeChannels =
    [];

  const storeFilter =
    `store_id=eq.${store.id}`;

  function subscribe(
    table,
    callback
  ) {
    return window
      .supabaseBuyerClient
      .channel(
        `buyer-${table}-live-${store.id}`
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter:
            storeFilter
        },
        callback
      )
      .subscribe();
  }

  const slotChannel =
    subscribe(
      "buyer_slots",
      () =>
        loadBuyerItems()
    );

  const imageChannel =
    subscribe(
      "item_images",
      () =>
        loadBuyerItems()
    );

  const itemChannel =
    subscribe(
      "items",
      () =>
        loadBuyerItems()
    );

  const categoriesChannel =
    subscribe(
      "categories",
      () =>
        loadBuyerItems()
    );

  const settingsChannel =
    subscribe(
      "seller_page_settings",
      () =>
        loadBuyerStorefront()
    );

  const hoursChannel =
    subscribe(
      "seller_hours",
      () =>
        loadBuyerStorefront()
    );

  buyerRealtimeChannels.push(
    slotChannel,
    imageChannel,
    itemChannel,
    categoriesChannel,
    settingsChannel,
    hoursChannel
  );
}

function closeBuyerAccountPanel() {
  if (buyerAccountEntry) {
    buyerAccountEntry.open =
      false;
  }
}

buyerAccountClose.addEventListener(
  "click",
  closeBuyerAccountPanel
);

document.addEventListener(
  "click",
  (event) => {
    if (
      buyerAccountEntry &&
      buyerAccountEntry.open &&
      !buyerAccountEntry.contains(
        event.target
      )
    ) {
      closeBuyerAccountPanel();
    }
  }
);

function setBuyerAccountMode(
  mode
) {
  buyerAccountMode =
    mode === "create"
      ? "create"
      : "login";

  const isCreateMode =
    buyerAccountMode ===
    "create";

  if (buyerAccountHeading) {
    buyerAccountHeading.textContent =
      isCreateMode
        ? "Create Account"
        : "Login";
  }

  if (
    buyerAccountSubmitButton
  ) {
    buyerAccountSubmitButton.textContent =
      isCreateMode
        ? "Create Account"
        : "Log In";
  }

  if (
    buyerCreateAccountLink
  ) {
    buyerCreateAccountLink.textContent =
      isCreateMode
        ? "Back to Login"
        : "Create Account";
  }

  if (buyerRecoverLink) {
    buyerRecoverLink.hidden =
      isCreateMode;
  }

  showBuyerAccountMessage(
    ""
  );
}

async function checkExistingBuyerAccount(
  email
) {
  const {
    data,
    error
  } =
    await window
      .supabaseBuyerAuthClient
      .functions
      .invoke(
        "check-existing-account",
        {
          body: {
            email
          }
        }
      );

  if (error) {
    throw error;
  }

  return (
    data?.result ||
    "new_identity"
  );
}

async function createBuyerAuthAccount(
  email,
  password
) {
  showBuyerAccountMessage(
    "Checking account..."
  );

  let existingAccountResult;

  try {
    existingAccountResult =
      await checkExistingBuyerAccount(
        email
      );
  } catch (error) {
    console.error(
      "Account precheck failed:",
      error
    );

    showBuyerAccountMessage(
      "Unable to check account status. Please try again."
    );

    return;
  }

  if (
    existingAccountResult ===
    "existing_seller"
  ) {
    setBuyerAccountMode(
      "login"
    );

    buyerAccountEmail.value =
      email;

    showBuyerAccountMessage(
      "You already have a Sales Mob login. Use your existing login to continue.",
      "existing-account"
    );

    return;
  }

  if (
    existingAccountResult ===
    "existing_buyer"
  ) {
    setBuyerAccountMode(
      "login"
    );

    buyerAccountEmail.value =
      email;

    showBuyerAccountMessage(
      "An account already exists for this email. Use your existing login to continue.",
      "existing-account"
    );

    return;
  }

  showBuyerAccountMessage(
    "Creating account..."
  );

  const {
    error
  } =
    await window
      .supabaseBuyerAuthClient
      .auth
      .signUp({
        email,
        password
      });

  if (error) {
    showBuyerAccountMessage(
      error.message
    );

    return;
  }

  buyerAccountPassword.value =
    "";

  showBuyerAccountMessage(
    "Account created. Check your email to confirm your address, then return here to log in."
  );
}

buyerCreateAccountLink?.addEventListener(
  "click",
  () => {
    setBuyerAccountMode(
      buyerAccountMode ===
      "create"
        ? "login"
        : "create"
    );
  }
);

function buyerDigitsOnly(
  value
) {
  return String(
    value || ""
  ).replace(
    /\D/g,
    ""
  );
}

function formatBuyerMobileMask(
  value
) {
  const digits =
    buyerDigitsOnly(
      value
    ).slice(
      0,
      10
    );

  const mask =
    "xxxxxxxxxx".split("");

  digits
    .split("")
    .forEach(
      (
        digit,
        index
      ) => {
        mask[index] =
          digit;
      }
    );

  return `(${mask.slice(0, 3).join("")}) ${mask.slice(3, 6).join("")}-${mask.slice(6, 10).join("")}`;
}

function renderBuyerMobileMask() {
  buyerProfileMobileInput.value =
    formatBuyerMobileMask(
      buyerProfileMobileDigits
    );

  window.requestAnimationFrame(
    () => {
      const end =
        buyerProfileMobileInput
          .value
          .length;

      buyerProfileMobileInput
        .setSelectionRange(
          end,
          end
        );
    }
  );
}

buyerProfileMobileInput.addEventListener(
  "input",
  () => {
    buyerProfileMobileDigits =
      buyerDigitsOnly(
        buyerProfileMobileInput.value
      ).slice(
        0,
        10
      );

    renderBuyerMobileMask();
  }
);

function resetBuyerProfileView() {
  buyerProfileHeading.textContent =
    "Complete Buyer Profile";

  buyerProfileIntro.style.display =
    "block";

  buyerProfileForm.style.display =
    "grid";

  buyerProfileReady.style.display =
    "none";

  buyerProfileFirstNameInput.value =
    "";

  buyerProfileLastNameInput.value =
    "";

  buyerProfileMobileDigits =
    "";

  renderBuyerMobileMask();
}

function showCompletedBuyerProfile() {
  buyerProfileHeading.textContent =
    "Buyer Profile";

  buyerProfileIntro.style.display =
    "none";

  buyerProfileForm.style.display =
    "none";

  buyerProfileReady.style.display =
    "block";
}

async function ensureBuyerStoreRelationship(
  session
) {
  if (
    !session?.user?.id
  ) {
    return false;
  }

  const store =
    await resolveBuyerStore();

  if (!store?.id) {
    showBuyerAccountMessage(
      "Unable to identify this store for your buyer account."
    );

    return false;
  }

  const {
    data:
      existingRelationship,
    error:
      relationshipReadError
  } =
    await window
      .supabaseBuyerAuthClient
      .from(
        "buyer_store_relationships"
      )
      .select(
        "id, buyer_user_id, store_id, store_membership_level"
      )
      .eq(
        "buyer_user_id",
        session.user.id
      )
      .eq(
        "store_id",
        store.id
      )
      .maybeSingle();

  if (
    relationshipReadError
  ) {
    console.error(
      "Could not load buyer store relationship:",
      relationshipReadError.message
    );

    showBuyerAccountMessage(
      "Unable to connect your buyer profile to this store. Please try again."
    );

    return false;
  }

  if (
    existingRelationship
  ) {
    return true;
  }

  const {
    error:
      relationshipInsertError
  } =
    await window
      .supabaseBuyerAuthClient
      .from(
        "buyer_store_relationships"
      )
      .insert({
        buyer_user_id:
          session.user.id,
        store_id:
          store.id,
        store_membership_level:
          0
      });

  if (
    relationshipInsertError
  ) {
    if (
      relationshipInsertError.code ===
      "23505"
    ) {
      return true;
    }

    console.error(
      "Could not create buyer store relationship:",
      relationshipInsertError.message
    );

    showBuyerAccountMessage(
      "Unable to connect your buyer profile to this store. Please try again."
    );

    return false;
  }

  return true;
}

async function loadBuyerProfile(
  session
) {
  if (
    !session?.user?.id
  ) {
    resetBuyerProfileView();

    return null;
  }

  const {
    data: profile,
    error
  } =
    await window
      .supabaseBuyerAuthClient
      .from(
        "buyer_profiles"
      )
      .select(
        "user_id, first_name, last_name, mobile"
      )
      .eq(
        "user_id",
        session.user.id
      )
      .maybeSingle();

  if (error) {
    console.error(
      "Could not load buyer profile:",
      error.message
    );

    buyerProfileForm.style.display =
      "none";

    buyerProfileReady.style.display =
      "none";

    showBuyerAccountMessage(
      "Unable to load buyer profile. Please try again."
    );

    return null;
  }

  if (profile) {
    showCompletedBuyerProfile();

    await ensureBuyerStoreRelationship(
      session
    );

    return profile;
  }

  resetBuyerProfileView();

  return null;
}

buyerProfileForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const firstName =
      buyerProfileFirstNameInput
        .value
        .trim();

    const lastName =
      buyerProfileLastNameInput
        .value
        .trim();

    const mobileDigits =
      buyerDigitsOnly(
        buyerProfileMobileInput.value
      ).slice(
        0,
        10
      );

    if (!firstName) {
      showBuyerAccountMessage(
        "First name is required."
      );

      return;
    }

    if (!lastName) {
      showBuyerAccountMessage(
        "Last name is required."
      );

      return;
    }

    if (
      mobileDigits.length !==
      10
    ) {
      showBuyerAccountMessage(
        "Mobile number must contain exactly 10 digits."
      );

      return;
    }

    const session =
      await getBuyerAccountSession();

    if (
      !session?.user?.id
    ) {
      showBuyerAccountMessage(
        "Please log in again before creating your buyer profile."
      );

      return;
    }

    const email =
      session.user.email ||
      "";

    if (!email) {
      showBuyerAccountMessage(
        "Your login does not have an email address available."
      );

      return;
    }

    buyerProfileSaveButton.disabled =
      true;

    showBuyerAccountMessage(
      "Saving buyer profile..."
    );

    const {
      error
    } =
      await window
        .supabaseBuyerAuthClient
        .from(
          "buyer_profiles"
        )
        .insert({
          user_id:
            session.user.id,
          first_name:
            firstName,
          last_name:
            lastName,
          email,
          mobile:
            mobileDigits,
          network_membership_level:
            0
        });

    buyerProfileSaveButton.disabled =
      false;

    if (error) {
      showBuyerAccountMessage(
        error.message
      );

      return;
    }

    await ensureBuyerStoreRelationship(
      session
    );

    showCompletedBuyerProfile();

    showBuyerAccountMessage(
      "Buyer profile created successfully."
    );
  }
);

async function getBuyerAccountSession() {
  const {
    data: {
      session
    },
    error
  } =
    await window
      .supabaseBuyerAuthClient
      .auth
      .getSession();

  if (error) {
    showBuyerAccountMessage(
      error.message
    );

    return null;
  }

  return session;
}

function renderBuyerAccountState(
  session
) {
  if (!buyerAccountSummary) {
    return;
  }

  const isLoggedIn =
    Boolean(session);

  buyerAccountSummary.textContent =
    isLoggedIn
      ? "Account"
      : "Login";

  if (
    buyerAccountHeading
  ) {
    buyerAccountHeading.textContent =
      isLoggedIn
        ? "Account"
        : "Login";
  }

  if (
    buyerAccountForm
  ) {
    buyerAccountForm.style.display =
      isLoggedIn
        ? "none"
        : "";
  }

  if (
    buyerAccountLinks
  ) {
    buyerAccountLinks.style.display =
      isLoggedIn
        ? "none"
        : "";
  }

  buyerAuthenticatedView.style.display =
    isLoggedIn
      ? "block"
      : "none";
}

async function refreshBuyerAccountDisplay() {
  const session =
    await getBuyerAccountSession();

  renderBuyerAccountState(
    session
  );

  if (session) {
    await loadBuyerProfile(
      session
    );
  } else {
    resetBuyerProfileView();
  }
}

buyerAccountForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const email =
      buyerAccountEmail
        .value
        .trim();

    const password =
      buyerAccountPassword.value;

    if (
      buyerAccountMode ===
      "create"
    ) {
      if (
        password.length < 8
      ) {
        showBuyerAccountMessage(
          "Password must be at least 8 characters."
        );

        return;
      }

      await createBuyerAuthAccount(
        email,
        password
      );

      return;
    }

    showBuyerAccountMessage(
      "Logging in..."
    );

    const {
      data,
      error
    } =
      await window
        .supabaseBuyerAuthClient
        .auth
        .signInWithPassword({
          email,
          password
        });

    if (error) {
      showBuyerAccountMessage(
        error.message
      );

      return;
    }

    buyerAccountPassword.value =
      "";

    renderBuyerAccountState(
      data.session
    );

    const profile =
      await loadBuyerProfile(
        data.session
      );

    if (profile) {
      showBuyerAccountMessage(
        "Logged in successfully."
      );

      closeBuyerAccountPanel();
    } else {
      showBuyerAccountMessage(
        "Login successful. Complete your buyer profile to continue."
      );

      if (
        buyerAccountEntry
      ) {
        buyerAccountEntry.open =
          true;
      }
    }
  }
);

buyerLogoutButton.addEventListener(
  "click",
  async () => {
    showBuyerAccountMessage(
      "Logging out..."
    );

    const {
      error
    } =
      await window
        .supabaseBuyerAuthClient
        .auth
        .signOut();

    if (error) {
      showBuyerAccountMessage(
        error.message
      );

      return;
    }

    renderBuyerAccountState(
      null
    );

    resetBuyerProfileView();

    buyerAccountEmail.value =
      "";

    buyerAccountPassword.value =
      "";

    showBuyerAccountMessage(
      "Logged out successfully."
    );

    closeBuyerAccountPanel();
  }
);

window
  .supabaseBuyerAuthClient
  .auth
  .onAuthStateChange(
    (
      _event,
      session
    ) => {
      renderBuyerAccountState(
        session
      );

      if (!session) {
        resetBuyerProfileView();
      }
    }
  );

async function initializeBuyerApp() {
  createCatalogControls();

  await refreshBuyerAccountDisplay();

  const store =
    await resolveBuyerStore();

  if (!store) {
    return;
  }

  await Promise.all([
    loadBuyerStorefront(),
    loadBuyerItems()
  ]);

  await subscribeBuyerRealtime();
}

initializeBuyerApp();