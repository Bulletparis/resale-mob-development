/*
MODULE: Buyer Account
PURPOSE:
Own the buyer-facing account, authentication, profile, and store-relationship workflow.
CAPABILITIES:
- Opens and closes the buyer Login / Account panel.
- Switches between Login and Create Account modes.
- Checks whether an email already belongs to an existing Sales Mob identity.
- Creates a buyer authentication account.
- Logs buyers in and out.
- Reads the current buyer authentication session.
- Builds and renders the buyer profile form.
- Validates and formats the buyer mobile number.
- Creates a buyer profile.
- Detects an existing completed buyer profile.
- Creates the buyer-to-store relationship when needed.
- Renders authenticated and unauthenticated account states.
- Responds to buyer authentication state changes.
RESTRICTIONS:
- Does not own buyer storefront rendering.
- Does not own Featured or Catalog item rendering.
- Does not own store discovery or store resolution.
- Does not own buyer realtime subscriptions.
- Does not own seller-side identity or permissions.
- Uses the existing buyer authentication client and buyer data tables.
PRECEDENTS:
- Buyer authentication may coexist with seller identity for the same Auth user.
- Existing seller identity receives the higher-priority existing-login message.
- Buyer profile requires first name, last name, and a 10-digit mobile number.
- Network membership defaults to level 0.
- Store membership defaults to level 0.
- Existing buyer/store relationships are reused rather than duplicated.
DEPENDENTS:
- Requires window.supabaseBuyerAuthClient.
- Requires buyer account/profile DOM elements from index.html.
- Calls resolveBuyerStore() from buyer core when establishing a store relationship.
- refreshBuyerAccountDisplay() is called by buyer application initialization.
CURRENT UI ENTRY:
Buyer Storefront > Login / Account
ENTRY TRIGGERS:
- Buyer opens the Login / Account panel.
- Buyer chooses Create Account.
- Buyer submits Login or Create Account.
- Authenticated buyer requires profile completion.
- Buyer authentication state changes.

IN-MODULE ACTIONS:
- Login.
- Create Account.
- Existing-account check.
- Profile creation.
- Mobile-number formatting and validation.
- Buyer/store relationship creation.
- Logout.
- Account-panel close behavior.

EXIT TRIGGERS:
- Successful login with an existing completed buyer profile.
- Successful profile creation.
- Logout.
- Buyer closes or clicks outside the account panel.

DEVELOPMENT NOTES:
- This extraction is behavior-preserving modularization.
- Do not redesign buyer account behavior during this extraction.
- Full cleanup is deferred until the entire application modularization is complete
  and the full modularized build has passed regression testing.
*/
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
buyerAccountClose.className = "buyer-account-close";

if (buyerAccountPanel) {
  buyerAccountPanel.appendChild(buyerAccountClose);
}

let buyerAccountMode = "login";
let buyerProfileMobileDigits = "";

const buyerAuthenticatedView = document.createElement("div");
buyerAuthenticatedView.id = "buyer-authenticated-account";
buyerAuthenticatedView.hidden = true;

const buyerProfileSection = document.createElement("section");
buyerProfileSection.id = "buyer-profile-section";

const buyerProfileHeading = document.createElement("h3");
buyerProfileHeading.textContent = "Complete Buyer Profile";
buyerProfileHeading.className = "buyer-profile-heading";

const buyerProfileIntro = document.createElement("p");
buyerProfileIntro.textContent = "Add your name and mobile number to activate your buyer profile.";
buyerProfileIntro.className = "buyer-profile-intro";

const buyerProfileForm = document.createElement("form");
buyerProfileForm.id = "buyer-profile-form";

function createProfileField(labelText, id, type, autocomplete) {
  const label = document.createElement("label");
  label.textContent = labelText;
  label.setAttribute("for", id);
  label.className = "buyer-profile-label";

  const input = document.createElement("input");
  input.id = id;
  input.type = type;
  input.required = true;
  input.autocomplete = autocomplete;
  input.className = "buyer-profile-input";

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

const buyerProfileSaveButton = document.createElement("button");
buyerProfileSaveButton.type = "submit";
buyerProfileSaveButton.textContent = "Save Buyer Profile";
buyerProfileSaveButton.className = "buyer-profile-save";

[firstNameField.label, buyerProfileFirstNameInput, lastNameField.label, buyerProfileLastNameInput, mobileField.label, buyerProfileMobileInput, buyerProfileSaveButton].forEach((node) => {
  buyerProfileForm.appendChild(node);
});

const buyerProfileReady = document.createElement("p");
buyerProfileReady.textContent = "Buyer profile active.";
buyerProfileReady.className = "buyer-profile-ready";
buyerProfileReady.hidden = true;

buyerProfileSection.appendChild(buyerProfileHeading);
buyerProfileSection.appendChild(buyerProfileIntro);
buyerProfileSection.appendChild(buyerProfileForm);
buyerProfileSection.appendChild(buyerProfileReady);
buyerAuthenticatedView.appendChild(buyerProfileSection);

const buyerLogoutButton = document.createElement("button");
buyerLogoutButton.type = "button";
buyerLogoutButton.textContent = "Log Out";
buyerLogoutButton.className = "buyer-account-logout";
buyerAuthenticatedView.appendChild(buyerLogoutButton);

if (buyerAccountPanel) {
  buyerAccountPanel.appendChild(buyerAuthenticatedView);
}

const buyerAccountMessage = document.createElement("p");
buyerAccountMessage.id = "buyer-account-message";
buyerAccountMessage.setAttribute("aria-live", "polite");
if (buyerAccountPanel) {
  buyerAccountPanel.appendChild(buyerAccountMessage);
}

function showBuyerAccountMessage(message, kind = "normal") {
  buyerAccountMessage.textContent = message;

  buyerAccountMessage.classList.toggle(
    "buyer-account-message-highlighted",
    kind === "existing-account"
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

  buyerProfileIntro.hidden =
    false;

  buyerProfileForm.hidden =
    false;

  buyerProfileReady.hidden =
    true;

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

  buyerProfileIntro.hidden =
    true;

  buyerProfileForm.hidden =
    true;

  buyerProfileReady.hidden =
    false;
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

    buyerProfileForm.hidden =
      true;

    buyerProfileReady.hidden =
      true;

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
    buyerAccountForm.hidden =
      isLoggedIn;
  }

  if (
    buyerAccountLinks
  ) {
    buyerAccountLinks.hidden =
      isLoggedIn;
  }

  buyerAuthenticatedView.hidden =
    !isLoggedIn;
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
