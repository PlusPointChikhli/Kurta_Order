let products = [];
let filteredProduct = null;

window.onload = async () => {
  try {
    const res = await fetch('products.json');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    products = await res.json();
    document.getElementById('previewImage').src = 'Catlogue_icon/default.png';
    populateDropdowns();
  } catch (error) {
    console.error("Error fetching products:", error);
    document.getElementById('pricingOutputDiv').innerHTML = '<p style="color: red;">Error loading product data. Please try again later.</p>';
  }
};

function populateDropdowns() {
  const typeSelect = document.getElementById('typeSelect');
  const colorSelect = document.getElementById('colorSelect');

  // Reset both dropdowns initially
  typeSelect.innerHTML = '<option value="">Select Type</option>';
  colorSelect.innerHTML = '<option value="">Select Color</option>';

  // Populate type dropdown
  const types = products.map(p => p.type);
  types.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });

  // When a type is selected
  typeSelect.addEventListener('change', () => {
    const selectedType = typeSelect.value;
    const product = products.find(p => p.type === selectedType);

    // Reset color dropdown
    colorSelect.innerHTML = '<option value="">Select Color</option>';

    // Populate color dropdown if variants exist
    if (product && product.variants) {
      product.variants.forEach(variant => {
        const opt = document.createElement('option');
        opt.value = variant.color;
        opt.textContent = variant.color;
        colorSelect.appendChild(opt);
      });
    }

    // Reset pricing, summary, and preview image
    document.getElementById('pricingOutputDiv').innerHTML = '<p>Please select a <strong>Type</strong> and <strong>Color</strong> to see pricing and sizes.</p>';
    document.getElementById('orderSummaryOutput').innerHTML = '';
    filteredProduct = null;
    updateImageAndPricing(); // reset image
  });

  // When a color is selected
  colorSelect.addEventListener('change', () => {
    updateImageAndPricing();
  });
}

function updateImageAndPricing() {
  const type = document.getElementById('typeSelect').value;
  const color = document.getElementById('colorSelect').value;
  const img = document.getElementById('previewImage');
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');

  const product = products.find(p => p.type === type);
  const variant = product?.variants.find(v => v.color === color);

  if (product && variant) {
    filteredProduct = { ...product, ...variant };

    const imagePath = variant.page
      ? `Catlogue_icon/${type.toLowerCase()}-page-${variant.page}.jpg`
      : 'Catlogue_icon/default.png';

    img.src = imagePath;
    img.onerror = () => {
      img.src = 'Catlogue_icon/default.png';
    };

    renderProductPricing(product); // Custom function to show size & price
  } else {
    filteredProduct = null;
    img.src = 'Catlogue_icon/default.png';
    pricingOutputDiv.innerHTML = `
      <p>Please select both <strong>Type</strong> and <strong>Color</strong> 
      to see product details and pricing.</p>`;
  }
}

function renderProductPricing(product) {
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');

  if (!product || !product.pricing) {
    pricingOutputDiv.innerHTML = '<p>No pricing available for this selection.</p>';
    return;
  }

  let htmlContent = '<h3>Available Sizes & Pricing:</h3>';
  const categoriesOrder = ['Mens', 'Ladies', 'Kids'];

  categoriesOrder.forEach(category => {
    if (product.pricing[category]) {
      htmlContent += `<h4>${category}'s:</h4><div class="category-sizes">`;

      const sizes = product.pricing[category];

      Object.keys(sizes).forEach(sizeKey => {
        const MRP = sizes[sizeKey].MRP;
        const discountPercentage = 0.25;
        const discountPrice = Math.round((MRP - (MRP * discountPercentage))/10)*10;

        htmlContent += `
          <div class="size-item">
            <label>${sizeKey}:</label>
            <input type="number" min="0" value="0"
              data-category="${category}"
              data-size="${sizeKey}"
              data-mrp="${MRP}"
              data-discount="${discountPrice}"
              class="qty-input"
              placeholder="Qty"/>
            <span class="mrp-price">MRP: ₹${MRP}</span>
            <span class="discount-price">Offer: ₹${discountPrice}</span>
          </div>`;
      });

      htmlContent += `</div>`;
    }
  });

  pricingOutputDiv.innerHTML = htmlContent;
}

function showOrderSummary() {
  const orderSummaryOutput = document.getElementById('orderSummaryOutput');

  if (!filteredProduct) {
    orderSummaryOutput.innerHTML = '<p class="error-message">Please select a product (Type and Color) first.</p>';
    return { html: '', whatsapp: 'Please select a product first.' };
  }

  const qtyInputs = document.querySelectorAll('#pricingOutputDiv .qty-input');
  const selectedItemsByCategory = {};
  let totalItems = 0;
  let totalPrice = 0;

  qtyInputs.forEach(input => {
    const quantity = parseInt(input.value);
    if (quantity > 0) {
      const category = input.dataset.category;
      const size = input.dataset.size;
      const mrp = parseFloat(input.dataset.mrp);
      const discountPrice = parseFloat(input.dataset.discount);

      const itemDetails = {
        size,
        quantity,
        mrp,
        discountPrice,
        lineTotal: quantity * discountPrice
      };

      if (!selectedItemsByCategory[category]) selectedItemsByCategory[category] = [];
      selectedItemsByCategory[category].push(itemDetails);

      totalItems += quantity;
      totalPrice += itemDetails.lineTotal;
    }
  });

  let htmlSummary = '';
  let whatsappTextSummary = '';

  if (Object.keys(selectedItemsByCategory).length > 0) {
    htmlSummary += `<h3>Order Summary for ${filteredProduct.color} (${filteredProduct.type})</h3>`;
    const categoriesOrder = ['Mens', 'Ladies', 'Kids'];

    categoriesOrder.forEach(category => {
      if (selectedItemsByCategory[category]) {
        htmlSummary += `<h4>Category: ${category}</h4><table><thead><tr><th>Size</th><th>Qty</th><th>MRP</th><th>Discount</th><th>Total</th></tr></thead><tbody>`;
        whatsappTextSummary += `*Category: ${category}*\n- Size - Qty - Price - Total\n`;

        selectedItemsByCategory[category].forEach(item => {
          htmlSummary += `<tr><td>${item.size}</td><td>${item.quantity}</td><td>₹${item.mrp}</td><td>₹${item.discountPrice}</td><td>₹${item.lineTotal}</td></tr>`;
          whatsappTextSummary += `- ${item.size} - ${item.quantity} - ₹${item.discountPrice} - ₹${item.lineTotal}\n`;
        });

        htmlSummary += `</tbody></table>`;
        whatsappTextSummary += `\n`;
      }
    });

    htmlSummary += `<p><strong>Total Items:</strong> ${totalItems}</p><p><strong>Overall Total:</strong> ₹${totalPrice.toFixed(2)}</p>`;
    whatsappTextSummary += `*Total Items:* ${totalItems}\n*Overall Total:* ₹${totalPrice}`;
  } else {
    htmlSummary = '<p>No items selected for order. Please enter quantities.</p>';
    whatsappTextSummary = 'No items selected for order. Please enter quantities.';
  }

  orderSummaryOutput.innerHTML = htmlSummary;

  return { html: htmlSummary, whatsapp: whatsappTextSummary };
}

document.getElementById("orderSummaryButton").addEventListener("click", showOrderSummary);

document.getElementById("sendOrderWhatsapp").addEventListener("click", () => {
  const summaries = showOrderSummary();

  if (!filteredProduct) {
    alert("Please select a product (Type and Color) and enter quantities before sending the order.");
    return;
  }

  const groupName = document.getElementById('groupName').value.trim();
  const address = document.getElementById('deliveryAddress').value.trim();
  const contact = document.getElementById('contactNumber').value.trim();

  if (!groupName || !address || !contact) {
    alert("Please fill in Group Name, Delivery Address, and Contact Number before sending the order.");
    return;
  }

  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(contact)) {
    alert("Please enter a valid 10-digit contact number.");
    return;
  }

  let finalWhatsappMessage = `Hi! I want to place a group order:\n\n`;
  finalWhatsappMessage += `🧥 *Product:* ${filteredProduct.type} – ${filteredProduct.color} – No. ${filteredProduct.number}\n`;
  finalWhatsappMessage += `📄 *Catalogue:* Page ${filteredProduct.page} | File: ${filteredProduct.pdf}\n\n`;
  finalWhatsappMessage += summaries.whatsapp;
  finalWhatsappMessage += `\n\n👥 *Group Name:* ${groupName}`;
  finalWhatsappMessage += `\n🏠 *Address:* ${address}`;
  finalWhatsappMessage += `\n📞 *Contact:* ${contact}`;
  finalWhatsappMessage += `\n🗓️ *Date:* ${new Date().toLocaleDateString("en-IN")}`;
  finalWhatsappMessage += `\n\n📦 Thanks for your group order!`;

  const whatsappURL = `https://wa.me/918866244409?text=${encodeURIComponent(finalWhatsappMessage)}`;
  window.open(whatsappURL, "_blank");
});