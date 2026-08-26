const loginForm = document.getElementById("login-form");
const loginSection = document.getElementById("login-section");
const sellerSection = document.getElementById("seller-section");
const loginMessage = document.getElementById("login-message");
const logoutButton = document.getElementById("logout-button");

const itemForm = document.getElementById("item-form");
const itemMessage = document.getElementById("item-message");
const inventoryList = document.getElementById("inventory-list");

async function getCurrentSession() {
  const {
    data: { session }
  } = await window.supabaseClient.auth.getSession();

  return session;
}

async function showCurrentSession() {
  const session = await getCurrentSession();

  if (session) {
    loginSection.hidden = true;
    sellerSection.hidden = false;
    await loadInventory();
  } else {
    loginSection.hidden = false;
    sellerSection.hidden = true;
    inventoryList.innerHTML = "";
  }
}

async function getBuyerSlots() {
  const session = await getCurrentSession();

  if (!session) {
    return [];
  }

  const { data, error } = await window.supabaseClient
    .from("buyer_slots")
    .select("position, item_id")
    .eq("seller_id", session.user.id);

  if (error) {
    itemMessage.textContent = error.message;
    return [];
  }

  return data || [];
}

async function assignBuyerPosition(itemId, position) {
  const session = await getCurrentSession();

  if (!session) {
    itemMessage.textContent = "You must be logged in.";
    return;
  }

  itemMessage.textContent =
    `Assigning item to Buyer Position ${position}...`;

  // If this item is already in another buyer position,
  // clear that old position first.
  const { error: clearError } = await window.supabaseClient
    .from("buyer_slots")
    .update({
      item_id: null
    })
    .eq("seller_id", session.user.id)
    .eq("item_id", itemId)
    .neq("position", position);

  if (clearError) {
    itemMessage.textContent = clearError.message;
    return;
  }

  // Assign the item to the requested position.
  // If that position already contains another item,
  // this replaces it.
  const { error: assignError } = await window.supabaseClient
    .from("buyer_slots")
    .upsert(
      {
        seller_id: session.user.id,
        position,
        item_id: itemId
      },
      {
        onConflict: "seller_id,position"
      }
    );

  if (assignError) {
    itemMessage.textContent = assignError.message;
    return;
  }

  itemMessage.textContent =
    `Item assigned to Buyer Position ${position}.`;

  await loadInventory();
}

async function deleteItem(item) {
  const confirmed = window.confirm(
    `Delete "${item.name}" from seller inventory?`
  );

  if (!confirmed) {
    return;
  }

  const session = await getCurrentSession();

  if (!session) {
    itemMessage.textContent = "You must be logged in.";
    return;
  }

  itemMessage.textContent = "Deleting item...";

  const { error: deleteError } = await window.supabaseClient
    .from("items")
    .delete()
    .eq("id", item.id)
    .eq("seller_id", session.user.id);

  if (deleteError) {
    itemMessage.textContent = deleteError.message;
    return;
  }

  if (item.image_path) {
    const { error: imageDeleteError } =
      await window.supabaseClient.storage
        .from("product_images")
        .remove([item.image_path]);

    if (imageDeleteError) {
      itemMessage.textContent =
        "Item deleted, but its stored image could not be removed.";

      await loadInventory();
      return;
    }
  }

  itemMessage.textContent = "Item deleted successfully.";
  await loadInventory();
}

async function loadInventory() {
  const session = await getCurrentSession();

  if (!session) {
    inventoryList.innerHTML = "";
    return;
  }

  const [{ data: items, error: itemsError }, buyerSlots] =
    await Promise.all([
      window.supabaseClient
        .from("items")
        .select("id, name, price, description, image_path")
        .eq("seller_id", session.user.id)
        .order("created_at", { ascending: false }),

      getBuyerSlots()
    ]);

  if (itemsError) {
    inventoryList.textContent = itemsError.message;
    return;
  }

  if (!items || items.length === 0) {
    inventoryList.textContent = "No items uploaded yet.";
    return;
  }

  inventoryList.innerHTML = "";

  items.forEach((item) => {
    const itemContainer = document.createElement("div");

    if (item.image_path) {
      const { data: imageData } =
        window.supabaseClient.storage
          .from("product_images")
          .getPublicUrl(item.image_path);

      const itemImage = document.createElement("img");
      itemImage.src = imageData.publicUrl;
      itemImage.alt = item.name;
      itemImage.width = 200;

      itemContainer.appendChild(itemImage);
    }

    const itemName = document.createElement("h3");
    itemName.textContent = item.name;

    const itemPrice = document.createElement("p");
    itemPrice.textContent =
      `$${Number(item.price).toFixed(2)}`;

    const itemDescription = document.createElement("p");
    itemDescription.textContent = item.description;

    const assignedSlot = buyerSlots.find(
      (slot) => slot.item_id === item.id
    );

    if (assignedSlot) {
      const positionLabel = document.createElement("p");

      positionLabel.textContent =
        `Buyer Position: ${assignedSlot.position}`;

      itemContainer.appendChild(positionLabel);
    }

    const controls = document.createElement("div");

    [1, 2, 3].forEach((position) => {
      const positionButton = document.createElement("button");

      positionButton.type = "button";
      positionButton.textContent = position;

      positionButton.addEventListener("click", async () => {
        await assignBuyerPosition(item.id, position);
      });

      controls.appendChild(positionButton);
    });

    const deleteButton = document.createElement("button");

    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    deleteButton.addEventListener("click", async () => {
      await deleteItem(item);
    });

    controls.appendChild(deleteButton);

    itemContainer.appendChild(itemName);
    itemContainer.appendChild(itemPrice);
    itemContainer.appendChild(itemDescription);
    itemContainer.appendChild(controls);

    inventoryList.appendChild(itemContainer);
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginMessage.textContent = "Logging in...";

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  const { error } =
    await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    loginMessage.textContent = error.message;
    return;
  }

  loginMessage.textContent = "";
  await showCurrentSession();
});

logoutButton.addEventListener("click", async () => {
  await window.supabaseClient.auth.signOut();
  await showCurrentSession();
});

itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  itemMessage.textContent = "Adding item...";

  const session = await getCurrentSession();

  if (!session) {
    itemMessage.textContent = "You must be logged in.";
    return;
  }

  const imageFile =
    document.getElementById("item-image").files[0];

  const name =
    document.getElementById("item-name").value.trim();

  const price =
    Number(document.getElementById("item-price").value);

  const description =
    document
      .getElementById("item-description")
      .value.trim();

  if (!imageFile) {
    itemMessage.textContent =
      "Please select a product picture.";

    return;
  }

  const fileExtension =
    imageFile.name.split(".").pop();

  const filePath =
    `${session.user.id}/${Date.now()}.${fileExtension}`;

  const { error: uploadError } =
    await window.supabaseClient.storage
      .from("product_images")
      .upload(filePath, imageFile);

  if (uploadError) {
    itemMessage.textContent = uploadError.message;
    return;
  }

  const { error: insertError } =
    await window.supabaseClient
      .from("items")
      .insert({
        seller_id: session.user.id,
        name,
        price,
        description,
        image_path: filePath
      });

  if (insertError) {
    await window.supabaseClient.storage
      .from("product_images")
      .remove([filePath]);

    itemMessage.textContent = insertError.message;
    return;
  }

  itemForm.reset();

  itemMessage.textContent =
    "Item added successfully.";

  await loadInventory();
});

window.supabaseClient.auth.onAuthStateChange(() => {
  showCurrentSession();
});

showCurrentSession();