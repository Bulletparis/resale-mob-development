/*
MODULE: Buyer Item Display

PURPOSE:
Own reusable buyer-facing merchandise presentation for Featured and Catalog items.

CAPABILITIES:
- Resolves buyer-visible item images and preserves the legacy primary-image fallback.
- Builds item image slideshows with previous/next controls and image counters.
- Opens and closes the Item Details modal.
- Builds the reusable buyer item card.
- Renders Featured item cards into seller-assigned Featured positions.
- Renders Catalog item cards.
- Detects Catalog description overflow and shows the "... More" action when needed.
- Provides the Catalog "Open Card" action.
- Handles Item Details modal close-button and backdrop behavior.

RESTRICTIONS:
- Does not load items from Supabase.
- Does not decide which items are Featured versus Catalog items.
- Does not own Catalog filtering, sorting, or controls.
- Does not own Featured carousel movement or equal-height synchronization.
- Does not own buyer account behavior.
- Does not own seller-configured storefront presentation.
- Does not resolve the active buyer store.
- Does not own realtime subscription orchestration.

PRECEDENTS:
- Item images are ordered by sort_order.
- If no item_images rows are available, items.image_path remains the legacy fallback.
- Featured rendering preserves the display position supplied by buyer core.
- Catalog descriptions remain visually constrained and expose "... More" only when needed.
- Item Details uses the same item image slideshow behavior as buyer item cards.

DEPENDENTS:
- Requires window.supabaseBuyerClient.
- Requires buyerCatalogGrid from buyer core.
- Requires buyer item modal DOM elements from index.html.
- renderCurrentCatalog() calls renderCatalogBuyerItem().
- loadBuyerItems() calls renderFeaturedBuyerItem().
- The buyer-core Escape-key handler calls closeBuyerItemModal().

CURRENT UI ENTRY:
Buyer Storefront > Featured / Published Catalog > Item Card / Open Card / ... More

ENTRY TRIGGERS:
- Buyer items are rendered after loadBuyerItems().
- Catalog rendering requests an item card.
- Featured rendering requests an item card.
- Buyer moves through an item's slideshow.
- Buyer selects "... More" or "Open Card".

IN-MODULE ACTIONS:
- Resolve item images.
- Build slideshow.
- Build reusable item card.
- Render Featured card.
- Render Catalog card.
- Measure Catalog description overflow.
- Open Item Details.
- Close Item Details.

EXIT TRIGGERS:
- Item card rendering completes.
- Buyer closes Item Details.
- Buyer clicks the Item Details backdrop.
- Buyer returns to the surrounding Featured or Catalog interface.

DEVELOPMENT NOTES:
- This extraction is behavior-preserving modularization.
- Existing dynamic measurement styles used only to calculate Catalog text overflow are preserved.
- The shared Escape-key handler remains in buyer core because it coordinates both
  the Item Details modal and the storefront Info modal.
- Full cleanup is deferred until the entire application modularization is complete
  and the full modularized build has passed regression testing.
*/
const buyerItemModal = document.getElementById("buyer-item-modal");
const buyerItemModalTitle = document.getElementById("buyer-item-modal-title");
const buyerItemModalContent = document.getElementById("buyer-item-modal-content");
const buyerItemModalX = document.getElementById("buyer-item-modal-x");
const buyerItemModalClose = document.getElementById("buyer-item-modal-close");

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
  container.classList.add(
    "buyer-position-container"
  );
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

  const image =
    document.createElement(
      "img"
    );

  image.alt =
    item.name;

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

  const price =
    document.createElement(
      "p"
    );

  price.className =
    "buyer-card-price";

  price.textContent =
    `$${Number(item.price).toFixed(2)}`;

  const description =
    document.createElement(
      "p"
    );

  description.className =
    "buyer-card-description";

  description.textContent =
    item.description || "";

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


  const card =
    createBuyerItemCard(
      item,
      itemImages
    );

  card.classList.add(
    "buyer-catalog-card"
  );


  const name =
    card.querySelector(
      ".buyer-card-name"
    );


  const price =
    card.querySelector(
      ".buyer-card-price"
    );


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


    card.insertBefore(
      descriptionWrap,
      description
    );

    descriptionWrap.appendChild(
      description
    );


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