const buyerMessage =
  document.getElementById(
    "buyer-message"
  );

const buyerSortAnchor =
  document.getElementById(
    "buyer-sort-anchor"
  );

const buyerPageTitle =
  document.getElementById(
    "buyer-page-title"
  );

const buyerInfoMenuWrapper =
  document.getElementById(
    "buyer-info-menu-wrapper"
  );

const buyerInfoButton =
  document.getElementById(
    "buyer-info-button"
  );

const buyerInfoDropdown =
  document.getElementById(
    "buyer-info-dropdown"
  );

const buyerInfoModal =
  document.getElementById(
    "buyer-info-modal"
  );

const buyerInfoModalTitle =
  document.getElementById(
    "buyer-info-modal-title"
  );

const buyerInfoModalContent =
  document.getElementById(
    "buyer-info-modal-content"
  );

const buyerInfoModalX =
  document.getElementById(
    "buyer-info-modal-x"
  );

const buyerInfoModalClose =
  document.getElementById(
    "buyer-info-modal-close"
  );

const themeColorMeta =
  document.getElementById(
    "theme-color-meta"
  );

let currentBusinessInfoContent =
  null;

let currentBusinessHoursContent =
  null;

let currentBuyerStore =
  null;

let buyerRealtimeChannels =
  [];

function getStoreSlugFromPageAddress() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const querySlug =
    params
      .get("store")
      ?.trim();

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
    pathParts[storeIndex + 1]
  ) {
    return decodeURIComponent(
      pathParts[storeIndex + 1]
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
    await window.supabaseBuyerClient
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
    clearBuyerPositions();

    buyerMessage.textContent =
      "Store not found.";

    return null;
  }

  currentBuyerStore =
    store;

  return currentBuyerStore;
}

function getSortFromPageAddress() {
  const hash =
    window.location.hash
      .replace("#", "");

  if (
    hash === "sort=low-high"
  ) {
    return "low-high";
  }

  if (
    hash === "sort=high-low"
  ) {
    return "high-low";
  }

  return "featured";
}

function saveSortToPageAddress(
  sortValue
) {
  window.location.hash =
    `sort=${sortValue}`;
}

let currentBuyerSort =
  getSortFromPageAddress();

function clearBuyerPositions() {
  [1, 2, 3].forEach(
    (position) => {
      const container =
        document.getElementById(
          `buyer-position-${position}`
        );

      container.innerHTML =
        "";
    }
  );
}

function showComingSoon() {
  clearBuyerPositions();

  buyerMessage.textContent =
    "Coming Soon";

  buyerMessage.classList.add(
    "coming-soon"
  );
}

function clearBuyerMessage() {
  buyerMessage.textContent =
    "";

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
    window.supabaseBuyerClient.storage
      .from("product_images")
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

function createBuyerSortControls() {
  if (
    document.getElementById(
      "buyer-sort-controls"
    )
  ) {
    return;
  }

  const controls =
    document.createElement(
      "div"
    );

  controls.id =
    "buyer-sort-controls";

  controls.style.display =
    "flex";

  controls.style.flexWrap =
    "wrap";

  controls.style.alignItems =
    "center";

  controls.style.gap =
    "8px";

  const label =
    document.createElement(
      "strong"
    );

  label.textContent =
    "Sort:";

  const featuredButton =
    document.createElement(
      "button"
    );

  featuredButton.type =
    "button";

  featuredButton.textContent =
    "Featured Order";

  featuredButton.dataset.sort =
    "featured";

  const lowHighButton =
    document.createElement(
      "button"
    );

  lowHighButton.type =
    "button";

  lowHighButton.textContent =
    "Price: Low → High";

  lowHighButton.dataset.sort =
    "low-high";

  const highLowButton =
    document.createElement(
      "button"
    );

  highLowButton.type =
    "button";

  highLowButton.textContent =
    "Price: High → Low";

  highLowButton.dataset.sort =
    "high-low";

  const sortButtons = [
    featuredButton,
    lowHighButton,
    highLowButton
  ];

  function updateSortButtonState() {
    sortButtons.forEach(
      (button) => {
        const isActive =
          button.dataset.sort ===
          currentBuyerSort;

        button.disabled =
          isActive;

        button.style.fontWeight =
          isActive
            ? "700"
            : "400";
      }
    );
  }

  sortButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        async () => {
          currentBuyerSort =
            button.dataset.sort;

          saveSortToPageAddress(
            currentBuyerSort
          );

          updateSortButtonState();

          await loadBuyerItems();
        }
      );
    }
  );

  controls.appendChild(
    label
  );

  controls.appendChild(
    featuredButton
  );

  controls.appendChild(
    lowHighButton
  );

  controls.appendChild(
    highLowButton
  );

  buyerSortAnchor.appendChild(
    controls
  );

  updateSortButtonState();
}

function createSlideButton(
  symbol,
  accessibleLabel
) {
  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

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
      .slice(0, 5)
      .split(":");

  let hour =
    Number(parts[0]);

  const minute =
    parts[1];

  const suffix =
    hour >= 12
      ? "PM"
      : "AM";

  hour =
    hour % 12;

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

  if (!visibleInformation) {
    return null;
  }

  return container;
}

function buildBusinessHoursContent(
  hours
) {
  const savedHours =
    hours || [];

  const hasOpenDay =
    savedHours.some(
      (row) =>
        row.is_open ===
        true
    );

  if (!hasOpenDay) {
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

  days.forEach(
    (day) => {
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

        const displayHours =
          opening &&
          closing
            ? `${opening} – ${closing}`
            : "Open";

        line.appendChild(
          document.createTextNode(
            displayHours
          )
        );
      }

      container.appendChild(
        line
      );
    }
  );

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

  const options =
    [];

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

  options.forEach(
    (option) => {
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
        () => {
          openInfoModal(
            option.title,
            option.content
          );
        }
      );

      buyerInfoDropdown.appendChild(
        button
      );
    }
  );
}

async function loadBuyerStorefront() {
  buyerPageTitle.textContent =
    "Resale Mob";

  document.body.style.background =
    "#ffffff";

  if (themeColorMeta) {
    themeColorMeta.setAttribute(
      "content",
      "#ffffff"
    );
  }

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
    await window.supabaseBuyerClient
      .from(
        "seller_page_settings"
      )
      .select(
        "page_title, background_color, online_sales_only, business_street, business_city, business_state, business_zip, business_phone, business_email"
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

  const backgroundColor =
    settings?.background_color ||
    "#ffffff";

  document.body.style.background =
    backgroundColor;

  if (themeColorMeta) {
    themeColorMeta.setAttribute(
      "content",
      backgroundColor
    );
  }

  currentBusinessInfoContent =
    buildBusinessInfoContent(
      settings
    );

  const {
    data: hours,
    error: hoursError
  } =
    await window.supabaseBuyerClient
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

function renderBuyerItem(
  displayPosition,
  item,
  itemImages
) {
  const container =
    document.getElementById(
      `buyer-position-${displayPosition}`
    );

  container.innerHTML =
    "";

  styleBuyerPositionContainer(
    container
  );

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
        item_id:
          item.id,
        image_path:
          item.image_path,
        sort_order:
          1
      }
    ];
  }

  if (
    images.length > 0
  ) {
    const slideshow =
      document.createElement(
        "div"
      );

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

    let currentIndex =
      0;

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

    if (
      images.length > 1
    ) {
      slideshow.appendChild(
        controls
      );
    }

    card.appendChild(
      slideshow
    );

    showImage();
  }

  const name =
    document.createElement(
      "h3"
    );

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

  price.textContent =
    `$${Number(
      item.price
    ).toFixed(2)}`;

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
    item.description;

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

  container.appendChild(
    card
  );
}

function sortBuyerItems(
  buyerItems
) {
  const sortedItems =
    [...buyerItems];

  if (
    currentBuyerSort ===
    "low-high"
  ) {
    sortedItems.sort(
      (a, b) => {
        const priceDifference =
          Number(a.item.price) -
          Number(b.item.price);

        if (
          priceDifference !== 0
        ) {
          return priceDifference;
        }

        return (
          Number(
            a.slot.position
          ) -
          Number(
            b.slot.position
          )
        );
      }
    );
  } else if (
    currentBuyerSort ===
    "high-low"
  ) {
    sortedItems.sort(
      (a, b) => {
        const priceDifference =
          Number(b.item.price) -
          Number(a.item.price);

        if (
          priceDifference !== 0
        ) {
          return priceDifference;
        }

        return (
          Number(
            a.slot.position
          ) -
          Number(
            b.slot.position
          )
        );
      }
    );
  } else {
    sortedItems.sort(
      (a, b) =>
        Number(
          a.slot.position
        ) -
        Number(
          b.slot.position
        )
    );
  }

  return sortedItems;
}

async function loadBuyerItems() {
  buyerMessage.classList.remove(
    "coming-soon"
  );

  buyerMessage.textContent =
    "Loading items...";

  clearBuyerPositions();

  const store =
    await resolveBuyerStore();

  if (!store) {
    return;
  }

  const {
    data: slots,
    error: slotsError
  } =
    await window.supabaseBuyerClient
      .from("buyer_slots")
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
      );

  if (slotsError) {
    buyerMessage.textContent =
      slotsError.message;

    return;
  }

  if (
    !slots ||
    slots.length === 0
  ) {
    showComingSoon();

    return;
  }

  const itemIds =
    slots.map(
      (slot) =>
        slot.item_id
    );

  const [
    itemsResult,
    imagesResult
  ] =
    await Promise.all([
      window.supabaseBuyerClient
        .from("items")
        .select(
          "id, name, price, description, image_path"
        )
        .eq(
          "store_id",
          store.id
        )
        .in(
          "id",
          itemIds
        ),

      window.supabaseBuyerClient
        .from("item_images")
        .select(
          "item_id, image_path, sort_order"
        )
        .eq(
          "store_id",
          store.id
        )
        .in(
          "item_id",
          itemIds
        )
        .order(
          "sort_order",
          {
            ascending: true
          }
        )
    ]);

  const {
    data: items,
    error: itemsError
  } =
    itemsResult;

  if (itemsError) {
    buyerMessage.textContent =
      itemsError.message;

    return;
  }

  const {
    data: itemImages,
    error: imagesError
  } =
    imagesResult;

  if (imagesError) {
    buyerMessage.textContent =
      imagesError.message;

    return;
  }

  const buyerItems =
    slots
      .map(
        (slot) => {
          const item =
            items.find(
              (candidate) =>
                candidate.id ===
                slot.item_id
            );

          if (!item) {
            return null;
          }

          return {
            slot,
            item
          };
        }
      )
      .filter(Boolean);

  if (
    buyerItems.length === 0
  ) {
    showComingSoon();

    return;
  }

  const sortedBuyerItems =
    sortBuyerItems(
      buyerItems
    );

  sortedBuyerItems.forEach(
    (
      buyerItem,
      index
    ) => {
      renderBuyerItem(
        index + 1,
        buyerItem.item,
        itemImages || []
      );
    }
  );

  clearBuyerMessage();
}

buyerInfoButton.addEventListener(
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

buyerInfoModalX.addEventListener(
  "click",
  closeInfoModal
);

buyerInfoModalClose.addEventListener(
  "click",
  closeInfoModal
);

buyerInfoModal.addEventListener(
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

document.addEventListener(
  "click",
  (event) => {
    if (
      !buyerInfoMenuWrapper
        .contains(
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
      window.supabaseBuyerClient
        .removeChannel(
          channel
        );
    }
  );

  buyerRealtimeChannels =
    [];

  const storeFilter =
    `store_id=eq.${store.id}`;

  const slotChannel =
    window.supabaseBuyerClient
      .channel(
        `buyer-slots-live-${store.id}`
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",
          schema:
            "public",
          table:
            "buyer_slots",
          filter:
            storeFilter
        },
        () => {
          loadBuyerItems();
        }
      )
      .subscribe();

  const imageChannel =
    window.supabaseBuyerClient
      .channel(
        `buyer-item-images-live-${store.id}`
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",
          schema:
            "public",
          table:
            "item_images",
          filter:
            storeFilter
        },
        () => {
          loadBuyerItems();
        }
      )
      .subscribe();

  const itemChannel =
    window.supabaseBuyerClient
      .channel(
        `buyer-items-live-${store.id}`
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",
          schema:
            "public",
          table:
            "items",
          filter:
            storeFilter
        },
        () => {
          loadBuyerItems();
        }
      )
      .subscribe();

  const settingsChannel =
    window.supabaseBuyerClient
      .channel(
        `buyer-page-settings-live-${store.id}`
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",
          schema:
            "public",
          table:
            "seller_page_settings",
          filter:
            storeFilter
        },
        () => {
          loadBuyerStorefront();
        }
      )
      .subscribe();

  const hoursChannel =
    window.supabaseBuyerClient
      .channel(
        `buyer-business-hours-live-${store.id}`
      )
      .on(
        "postgres_changes",
        {
          event:
            "*",
          schema:
            "public",
          table:
            "seller_hours",
          filter:
            storeFilter
        },
        () => {
          loadBuyerStorefront();
        }
      )
      .subscribe();

  buyerRealtimeChannels.push(
    slotChannel,
    imageChannel,
    itemChannel,
    settingsChannel,
    hoursChannel
  );
}

async function initializeBuyerApp() {
  createBuyerSortControls();

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