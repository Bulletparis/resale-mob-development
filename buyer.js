const buyerMessage = document.getElementById("buyer-message");
const buyerFeaturedMessage = document.getElementById("buyer-featured-message");
const buyerFeaturedTitle = document.getElementById("buyer-featured-title");
const buyerFeaturedGrid = document.getElementById("buyer-grid");
const buyerFeaturedPrevious = document.getElementById("buyer-featured-previous");
const buyerFeaturedNext = document.getElementById("buyer-featured-next");
const buyerCatalogGrid = document.getElementById("buyer-catalog-grid");
const buyerCatalogMessage = document.getElementById("buyer-catalog-message");
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
    group.appendChild(control);181726

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
