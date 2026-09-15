// ==========================================================================
// VELOURA — Admin: Category Management (with image upload)
// ==========================================================================

let ADMIN_CATS = [];
let ADMIN_CAT_ITEM_COUNTS = {};

document.addEventListener("admin-authorized", initCategoriesPage);

async function initCategoriesPage() {
  await loadCategoriesAdmin();

  document.querySelector("#add-category-btn").addEventListener("click", () => openCategoryModal());
  document.querySelector("#cat-modal-cancel").addEventListener("click", closeCategoryModal);
  document.querySelector("#category-modal").addEventListener("click", (e) => {
    if (e.target.id === "category-modal") closeCategoryModal();
  });
  document.querySelector("#category-form").addEventListener("submit", saveCategory);
  document.querySelector("#category-image").addEventListener("change", uploadCategoryImage);
}

async function loadCategoriesAdmin() {
  const tbody = document.querySelector("#categories-table-body");
  tbody.innerHTML = `<tr><td colspan="4">Loading...</td></tr>`;

  const [{ data: cats, error: catErr }, { data: items, error: itemErr }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("menu_items").select("category_id"),
  ]);

  if (catErr) {
    console.error(catErr);
    tbody.innerHTML = `<tr><td colspan="4">Failed to load categories.</td></tr>`;
    return;
  }

  ADMIN_CATS = cats || [];
  ADMIN_CAT_ITEM_COUNTS = {};
  (items || []).forEach((i) => {
    if (!i.category_id) return;
    ADMIN_CAT_ITEM_COUNTS[i.category_id] = (ADMIN_CAT_ITEM_COUNTS[i.category_id] || 0) + 1;
  });

  renderCategoriesTable();
}

function renderCategoriesTable() {
  const tbody = document.querySelector("#categories-table-body");
  if (ADMIN_CATS.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No categories yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = ADMIN_CATS.map(
    (c) => `
    <tr>
      <td>${c.name}</td>
      <td>${c.description || "—"}</td>
      <td>${ADMIN_CAT_ITEM_COUNTS[c.id] || 0}</td>
      <td class="admin-actions">
        <button data-edit="${c.id}">Edit</button>
        <button data-delete="${c.id}">Delete</button>
      </td>
    </tr>`
  ).join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) =>
    btn.addEventListener("click", () => openCategoryModal(btn.dataset.edit))
  );
  tbody.querySelectorAll("[data-delete]").forEach((btn) =>
    btn.addEventListener("click", () => deleteCategory(btn.dataset.delete))
  );
}

function openCategoryModal(id) {
  const form = document.querySelector("#category-form");
  form.reset();
  document.querySelector("#category-image-url").value = "";

  if (id) {
    const cat = ADMIN_CATS.find((c) => c.id === id);
    document.querySelector("#cat-modal-title").textContent = "Edit Category";
    document.querySelector("#category-id").value = cat.id;
    document.querySelector("#category-name").value = cat.name;
    document.querySelector("#category-description").value = cat.description || "";
    document.querySelector("#category-image-url").value = cat.image_url || "";
  } else {
    document.querySelector("#cat-modal-title").textContent = "Add Category";
    document.querySelector("#category-id").value = "";
  }

  document.querySelector("#category-modal").classList.add("open");
}

function closeCategoryModal() {
  document.querySelector("#category-modal").classList.remove("open");
}

async function uploadCategoryImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const url = await uploadToVelouraStorage(file, "categories");
    document.querySelector("#category-image-url").value = url;
    showToast("Image uploaded");
  } catch (err) {
    console.error(err);
    showToast("Image upload failed", "error");
  }
}

async function saveCategory(e) {
  e.preventDefault();
  const id = document.querySelector("#category-id").value;
  const payload = {
    name: document.querySelector("#category-name").value.trim(),
    description: document.querySelector("#category-description").value.trim(),
    image_url: document.querySelector("#category-image-url").value || null,
  };

  try {
    if (id) {
      const { error } = await supabase.from("categories").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("categories").insert(payload);
      if (error) throw error;
    }
    showToast("Category saved");
    closeCategoryModal();
    await loadCategoriesAdmin();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}

async function deleteCategory(id) {
  if (!confirm("Delete this category? Menu items in it will become uncategorized.")) return;
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    showToast("Category deleted");
    await loadCategoriesAdmin();
  } catch (err) {
    console.error(err);
    showToast(friendlyError(err), "error");
  }
}
