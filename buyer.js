const buyerMessage = document.getElementById("buyer-message");

function clearBuyerPositions() {
  [1, 2, 3].forEach((position) => {
    const container = document.getElementById(
      `buyer-position-${position}`
    );

    container.innerHTML = "";
  });
}

function renderBuyerItem(position, item) {
  const container = document.getElementById(
    `buyer-position-${position}`
  );

  container.innerHTML = "";

  if (item.image_path) {
    const { data: imageData } =
      window.supabaseClient.storage
        .from("product_images")
        .getPublicUrl(item.image_path);

    const image = document.createElement("img");
    image.src = imageData.publicUrl;
    image.alt = item.name;
    image.width = 250;

    container.appendChild(image);
  }

  const name = document.createElement("h3");
  name.textContent = item.name;

  const price = document.createElement("p");
  price.textContent = `$${Number(item.price).toFixed(2)}`;

  const description = document.createElement("p");
  description.textContent = item.description;

  container.appendChild(name);
  container.appendChild(price);
  container.appendChild(description);
}

async function loadBuyerItems() {
  buyerMessage.textContent = "Loading items...";
  clearBuyerPositions();

  const { data: slots, error: slotsError } =
    await window.supabaseClient
      .from("buyer_slots")
      .select("position, item_id")
      .not("item_id", "is", null)
      .order("position", { ascending: true });

  if (slotsError) {
    buyerMessage.textContent = slotsError.message;
    return;
  }

  if (!slots || slots.length === 0) {
    buyerMessage.textContent = "No items currently available.";
    return;
  }

  const itemIds = slots.map((slot) => slot.item_id);

  const { data: items, error: itemsError } =
    await window.supabaseClient
      .from("items")
      .select("id, name, price, description, image_path")
      .in("id", itemIds);

  if (itemsError) {
    buyerMessage.textContent = itemsError.message;
    return;
  }

  slots.forEach((slot) => {
    const item = items.find(
      (candidate) => candidate.id === slot.item_id
    );

    if (item) {
      renderBuyerItem(slot.position, item);
    }
  });

  buyerMessage.textContent = "";
}

window.supabaseClient
  .channel("buyer-slots-live")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "buyer_slots"
    },
    () => {
      loadBuyerItems();
    }
  )
  .subscribe();

loadBuyerItems();