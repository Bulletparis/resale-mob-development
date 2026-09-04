/*
MODULE: Buyer Storefront

PURPOSE:
Own the buyer-facing presentation of seller-configured storefront information.

CAPABILITIES:
- Applies the seller-configured buyer page title.
- Applies the seller-configured buyer page background color and theme color.
- Applies the seller-configured Featured section title.
- Builds and displays Business Info.
- Builds and displays Business Hours.
- Formats stored business hours for buyer presentation.
- Builds the Info menu from available seller information.
- Opens and closes the buyer Info dropdown and modal.
- Loads seller_page_settings and seller_hours for the active store.

RESTRICTIONS:
- Does not own buyer item, Featured item, or Catalog item rendering.
- Does not own buyer account behavior.
- Does not resolve the active store.
- Does not own realtime subscription orchestration.
- Does not change seller-configured storefront data.

PRECEDENTS:
- Seller Page Setup controls the storefront values presented here.
- Business Info is hidden when no buyer-visible information exists.
- Business Hours are hidden when no saved day is open.
- Online Sales Only suppresses the physical-address presentation.
- Missing seller settings fall back to established buyer-page defaults.

DEPENDENTS:
- Requires window.supabaseBuyerClient.
- Requires resolveBuyerStore() from buyer core.
- Uses buyerFeaturedTitle from buyer core.
- Requires the buyer Info menu and modal DOM elements from index.html.
- loadBuyerStorefront() is called by buyer initialization and realtime refresh.

CURRENT UI ENTRY:
Buyer Storefront > Seller-configured page presentation / Info

ENTRY TRIGGERS:
- Buyer storefront initializes.
- Seller page settings change through realtime.
- Seller business hours change through realtime.
- Buyer opens the Info menu.

IN-MODULE ACTIONS:
- Load seller page settings.
- Load business hours.
- Build Business Info content.
- Build Business Hours content.
- Rebuild the Info menu.
- Open and close the Info dropdown.
- Open and close the Info modal.

EXIT TRIGGERS:
- Storefront presentation finishes loading.
- Buyer closes the Info modal.
- Buyer clicks outside the Info menu.
- Buyer selects an Info menu option.

DEVELOPMENT NOTES:
- This extraction is behavior-preserving modularization.
- The shared Escape-key handler remains in buyer core because it coordinates
  both the Item Details modal and the Info modal.
- Full cleanup is deferred until the entire application modularization is complete
  and the full modularized build has passed regression testing.
*/
const buyerPageTitle = document.getElementById("buyer-page-title");
const buyerInfoMenuWrapper = document.getElementById("buyer-info-menu-wrapper");
const buyerInfoButton = document.getElementById("buyer-info-button");
const buyerInfoDropdown = document.getElementById("buyer-info-dropdown");
const buyerInfoModal = document.getElementById("buyer-info-modal");
const buyerInfoModalTitle = document.getElementById("buyer-info-modal-title");
const buyerInfoModalContent = document.getElementById("buyer-info-modal-content");
const buyerInfoModalX = document.getElementById("buyer-info-modal-x");
const buyerInfoModalClose = document.getElementById("buyer-info-modal-close");
const themeColorMeta = document.getElementById("theme-color-meta");
let currentBusinessInfoContent = null;
let currentBusinessHoursContent = null;

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