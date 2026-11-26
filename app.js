// DuniaOTP - Client Logic
let balance = 25000;
let activeOrder = null;
let orderTimerInterval = null;
let otpTimeout = null;

// DOM
const userBalanceEl = document.getElementById("userBalance");
const btnOpenDeposit = document.getElementById("btnOpenDeposit");
const modalDeposit = document.getElementById("modalDeposit");
const btnCloseDeposit = document.getElementById("btnCloseDeposit");
const depBtns = document.querySelectorAll(".dep-btn");
const depAmountDisplay = document.getElementById("depAmountDisplay");
const btnSimulateDeposit = document.getElementById("btnSimulateDeposit");

const selectService = document.getElementById("selectService");
const selectCountry = document.getElementById("selectCountry");
const btnOrderNumber = document.getElementById("btnOrderNumber");
const btnOrderPrice = document.getElementById("btnOrderPrice");

const activeOrderBubble = document.getElementById("activeOrderBubble");
const ordService = document.getElementById("ordService");
const ordCountry = document.getElementById("ordCountry");
const ordNumber = document.getElementById("ordNumber");
const orderTimer = document.getElementById("orderTimer");

const otpStatusBox = document.getElementById("otpStatusBox");
const otpSpinner = document.getElementById("otpSpinner");
const otpStatusText = document.getElementById("otpStatusText");

const otpResultCard = document.getElementById("otpResultCard");
const otpCodeDisplay = document.getElementById("otpCodeDisplay");
const btnCopyOtp = document.getElementById("btnCopyOtp");
const otpSender = document.getElementById("otpSender");

const btnCancelOrder = document.getElementById("btnCancelOrder");
const btnResendSms = document.getElementById("btnResendSms");
const btnSmartBuyDemo = document.getElementById("btnSmartBuyDemo");

// Service change price
selectService.addEventListener("change", () => {
  const selectedOpt = selectService.options[selectService.selectedIndex];
  const price = parseInt(selectedOpt.dataset.price, 10);
  btnOrderPrice.textContent = "Rp " + price.toLocaleString("id-ID");
});

// Update balance display
function updateBalance(newBal) {
  balance = newBal;
  userBalanceEl.textContent = "Rp " + balance.toLocaleString("id-ID");
}

// Deposit Modal Logic
btnOpenDeposit.addEventListener("click", () => {
  modalDeposit.classList.add("show");
});
btnCloseDeposit.addEventListener("click", () => {
  modalDeposit.classList.remove("show");
});

depBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    depBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const amt = parseInt(btn.dataset.amount, 10);
    depAmountDisplay.textContent = "Rp " + amt.toLocaleString("id-ID");
  });
});

btnSimulateDeposit.addEventListener("click", () => {
  const activeBtn = document.querySelector(".dep-btn.active");
  const amt = parseInt(activeBtn.dataset.amount, 10);
  updateBalance(balance + amt);
  modalDeposit.classList.remove("show");
  showToast("✅ Deposit Berhasil! Saldo bertambah Rp " + amt.toLocaleString("id-ID"));
});

// Generate Random Phone
function generateVirtualNumber(prefix) {
  const rand = Math.floor(10000000 + Math.random() * 90000000);
  return prefix + " " + String(rand).substring(0, 4) + "-" + String(rand).substring(4);
}

// Order Virtual Number
btnOrderNumber.addEventListener("click", () => {
  if (activeOrder) {
    showToast("⚠️ Anda masih memiliki sewa nomor aktif.");
    return;
  }

  const sOpt = selectService.options[selectService.selectedIndex];
  const cOpt = selectCountry.options[selectCountry.selectedIndex];
  const price = parseInt(sOpt.dataset.price, 10);

  if (balance < price) {
    showToast("❌ Saldo tidak mencukupi! Silakan topup deposit terlebih dahulu.");
    modalDeposit.classList.add("show");
    return;
  }

  // Deduct balance
  updateBalance(balance - price);

  const phone = generateVirtualNumber(cOpt.dataset.prefix);
  activeOrder = {
    service: sOpt.dataset.name,
    country: cOpt.dataset.name,
    price: price,
    phone: phone,
    timeRemaining: 120
  };

  // Render UI
  ordService.textContent = activeOrder.service;
  ordCountry.textContent = activeOrder.country;
  ordNumber.textContent = activeOrder.phone;

  otpStatusBox.style.display = "flex";
  otpSpinner.style.display = "block";
  otpStatusText.textContent = "Menunggu SMS kode OTP dari provider...";
  otpResultCard.style.display = "none";
  activeOrderBubble.style.display = "block";

  showToast("🚀 Nomor virtual berhasil disewa: " + phone);

  // Start Timer
  startOrderCountdown();

  // Simulate OTP arriving after 5 seconds
  otpTimeout = setTimeout(() => {
    simulateIncomingOtp();
  }, 5000);
});

function startOrderCountdown() {
  if (orderTimerInterval) clearInterval(orderTimerInterval);
  orderTimerInterval = setInterval(() => {
    if (!activeOrder) {
      clearInterval(orderTimerInterval);
      return;
    }
    const mins = Math.floor(activeOrder.timeRemaining / 60);
    const secs = activeOrder.timeRemaining % 60;
    orderTimer.textContent = (mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs;

    activeOrder.timeRemaining--;
    if (activeOrder.timeRemaining < 0) {
      clearInterval(orderTimerInterval);
      handleOrderTimeout();
    }
  }, 1000);
}

function simulateIncomingOtp() {
  if (!activeOrder) return;
  const randOtp = Math.floor(100000 + Math.random() * 900000);
  const formattedOtp = String(randOtp).substring(0, 3) + "-" + String(randOtp).substring(3);

  otpSpinner.style.display = "none";
  otpStatusText.textContent = "✓ SMS berhasil diterima secara instan!";
  otpCodeDisplay.textContent = formattedOtp;
  otpSender.textContent = activeOrder.service + " Security Verification";
  otpResultCard.style.display = "block";

  showToast("📬 SMS OTP Masuk: " + formattedOtp);
}

function handleOrderTimeout() {
  if (!activeOrder) return;
  // Auto refund
  updateBalance(balance + activeOrder.price);
  showToast("⏱️ Waktu habis. Saldo Rp " + activeOrder.price.toLocaleString("id-ID") + " telah di-refund 100%.");
  resetOrder();
}

btnCancelOrder.addEventListener("click", () => {
  if (!activeOrder) return;
  clearTimeout(otpTimeout);
  updateBalance(balance + activeOrder.price);
  showToast("🔄 Nomor dibatalkan. Saldo Rp " + activeOrder.price.toLocaleString("id-ID") + " telah di-refund 100%.");
  resetOrder();
});

btnResendSms.addEventListener("click", () => {
  if (!activeOrder) return;
  showToast("🔄 Meminta pengiriman ulang SMS dari provider...");
  otpStatusText.textContent = "Meminta SMS ulang...";
  setTimeout(() => {
    simulateIncomingOtp();
  }, 3000);
});

btnCopyOtp.addEventListener("click", () => {
  const code = otpCodeDisplay.textContent.replace("-", "").trim();
  navigator.clipboard.writeText(code).then(() => {
    showToast("📋 Kode OTP " + code + " berhasil disalin ke clipboard!");
  }).catch(() => {
    showToast("📋 Kode: " + code);
  });
});

function resetOrder() {
  activeOrder = null;
  if (orderTimerInterval) clearInterval(orderTimerInterval);
  activeOrderBubble.style.display = "none";
}

// SmartBuy Demo
btnSmartBuyDemo.addEventListener("click", () => {
  selectService.value = "wa";
  selectCountry.value = "id";
  const sOpt = selectService.options[selectService.selectedIndex];
  btnOrderPrice.textContent = "Rp " + parseInt(sOpt.dataset.price, 10).toLocaleString("id-ID");
  showToast("⚡ SmartBuy AI: Memilih Indonesia (+62) untuk WhatsApp (Success Rate 98.7% - Termurah)");
  btnOrderNumber.click();
});

// Toast Helper
function showToast(msg) {
  const container = document.getElementById("toastContainer");
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
