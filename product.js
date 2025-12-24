/* ================= product.js =================
   - load selectedProduct from localStorage
   - render: image, name, rating, price
   - quantity stepper
   - add to cart (localStorage b4d_cart[])
================================================= */

const CART_KEY = "b4d_cart";      // ✅ samain dengan cart.html
const LEGACY_CART_KEY = "cart";  // ✅ jaga-jaga data lama kamu

document.addEventListener("DOMContentLoaded", () => {
  // navbar auth button
  const authBtn = document.getElementById("authBtn");
  if (window.Auth && authBtn) {
    if (Auth.isLoggedIn()) {
      authBtn.textContent = "👤";
      authBtn.classList.remove("login-black");
      authBtn.onclick = () => (window.location.href = "account.html");
    } else {
      authBtn.textContent = "Login";
      authBtn.classList.add("login-black");
      authBtn.onclick = () => (window.location.href = "login.html");
    }
  }

  const p = readSelectedProduct();
  if (!p) {
    window.location.href = "fashion.html";
    return;
  }

  // refs
  const pImg = document.getElementById("pImg");
  const pName = document.getElementById("pName");
  const pStars = document.getElementById("pStars");
  const pRateText = document.getElementById("pRateText");
  const pPrice = document.getElementById("pPrice");

  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");
  const qtyVal = document.getElementById("qtyVal");

  const btnAdd = document.getElementById("btnAdd");

  // render
  if (pImg) pImg.style.backgroundImage = `url("${p.img}")`;
  if (pName) pName.textContent = p.name;
  if (pPrice) pPrice.textContent = formatRupiah(p.price);

  const rating = clampRating(p.rating);
  if (pRateText) pRateText.textContent = `(${rating.toFixed(1)})`;
  if (pStars) pStars.textContent = starsFromRating(rating);

  // qty behavior
  function getQty() {
    const n = parseInt(String(qtyVal?.value || "1").replace(/\D/g, ""), 10);
    return isNaN(n) ? 1 : Math.max(1, Math.min(99, n));
  }
  function setQty(n) {
    if (!qtyVal) return;
    qtyVal.value = String(Math.max(1, Math.min(99, n)));
  }

  if (qtyMinus) qtyMinus.addEventListener("click", () => setQty(getQty() - 1));
  if (qtyPlus) qtyPlus.addEventListener("click", () => setQty(getQty() + 1));
  if (qtyVal) {
    qtyVal.addEventListener("input", () => setQty(getQty()));
    qtyVal.addEventListener("blur", () => setQty(getQty()));
  }

  // actions (demo)
  wireAction("actCompare", "Compare feature coming soon.");
  wireAction("actAsk", "Ask a question feature coming soon.");
  wireAction("actShare", () => {
    const text = `${p.name} — ${formatRupiah(p.price)}`;
    navigator.clipboard?.writeText(text);
    alert("Copied product info to clipboard.");
  });

  // add to cart
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      const qty = getQty();

      // ✅ cart.html expects: { id, name, price, image, color, qty }
      addToCart({
        id: p.id,
        name: p.name,
        price: Number(p.price || 0),
        image: p.img,               // ✅ cart pakai "image", bukan "img"
        color: p.color || "Red",     // optional, biar mirip mockup
        qty
      });

      alert("Added to cart.");
      // optional: langsung lempar ke cart
      // window.location.href = "cart.html";
    });
  }
});

// ---------- helpers ----------
function readSelectedProduct() {
  try {
    const raw = localStorage.getItem("selectedProduct");
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || !p.id || !p.name || !p.img) return null;
    return p;
  } catch {
    return null;
  }
}

function formatRupiah(num) {
  return "Rp " + Number(num || 0).toLocaleString("id-ID");
}

function clampRating(r) {
  r = Number(r || 0);
  if (isNaN(r)) r = 0;
  return Math.max(0, Math.min(5, r));
}

/* return 5-char stars string using full/half/empty
   Full: ★  Half: ⯨ (kalau font ga support, ganti "½")
   Empty: ☆
*/
function starsFromRating(r) {
  const full = Math.floor(r);
  const half = (r - full) >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  const halfChar = "⯨"; // fallback: "½"
  return "★".repeat(full) + (half ? halfChar : "") + "☆".repeat(empty);
}

/* ✅ baca cart baru, kalau kosong coba legacy */
function getCart() {
  try {
    const now = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    if (Array.isArray(now) && now.length) return now;

    const legacy = JSON.parse(localStorage.getItem(LEGACY_CART_KEY)) || [];
    return Array.isArray(legacy) ? legacy : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ✅ merge qty by id */
function addToCart(item) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.id === item.id);

  if (idx >= 0) {
    cart[idx].qty = Math.min(99, (Number(cart[idx].qty || 0) + Number(item.qty || 1)));
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: Number(item.price || 0),
      image: item.image,
      color: item.color || "Red",
      qty: Math.max(1, Math.min(99, Number(item.qty || 1))),
    });
  }

  saveCart(cart);
}

function wireAction(id, handler) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof handler === "function") handler();
    else alert(handler);
  });
}