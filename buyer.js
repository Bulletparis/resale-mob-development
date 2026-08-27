const buyerMessage =
  document.getElementById(
    "buyer-message"
  );

const buyerSortAnchor =
  document.getElementById(
    "buyer-sort-anchor"
  );

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
  word,
  symbol
) {
  const button =
    document.createElement(
      "button"
    );

  button.type =
    "button";

  button.className =
    "buyer-slide-button";

  const wordSpan =
    document.createElement(
      "span"
    );

  wordSpan.className =
    "buyer-slide-word";

  wordSpan.textContent =
    word;

  const symbolSpan =
    document.createElement(
      "span"
    );

  symbolSpan.className =
    "buyer-slide-symbol";

  symbolSpan.textContent =
    symbol;

  button.appendChild(
    wordSpan
  );

  button.appendChild(
    symbolSpan
  );

  return button;
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
        "Previous",
        "‹"
      );

    previousButton.setAttribute(
      "aria-label",
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
        "Next",
        "›"
      );

    nextButton.setAttribute(
      "aria-label",
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

  const {
    data: slots,
    error: slotsError
  } =
    await window.supabaseBuyerClient
      .from("buyer_slots")
      .select(
        "position, item_id"
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
        .in(
          "id",
          itemIds
        ),

      window.supabaseBuyerClient
        .from("item_images")
        .select(
          "item_id, image_path, sort_order"
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

window.supabaseBuyerClient
  .channel(
    "buyer-slots-live"
  )
  .on(
    "postgres_changes",
    {
      event:
        "*",
      schema:
        "public",
      table:
        "buyer_slots"
    },
    () => {
      loadBuyerItems();
    }
  )
  .subscribe();

window.supabaseBuyerClient
  .channel(
    "buyer-item-images-live"
  )
  .on(
    "postgres_changes",
    {
      event:
        "*",
      schema:
        "public",
      table:
        "item_images"
    },
    () => {
      loadBuyerItems();
    }
  )
  .subscribe();

window.supabaseBuyerClient
  .channel(
    "buyer-items-live"
  )
  .on(
    "postgres_changes",
    {
      event:
        "*",
      schema:
        "public",
      table:
        "items"
    },
    () => {
      loadBuyerItems();
    }
  )
  .subscribe();

createBuyerSortControls();

loadBuyerItems();