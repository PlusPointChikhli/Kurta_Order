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
  // Ensure types are unique
  const uniqueTypes = [...new Set(products.map(p => p.type))];
  uniqueTypes.forEach(type => {
    const opt = document.createElement('option');
    opt.value = type;
    opt.textContent = type;
    typeSelect.appendChild(opt);
  });

  // When a type is selected
  typeSelect.addEventListener('change', () => {
    const selectedType = typeSelect.value;
    // Get all products of the selected type to find all available colors for that type
    const productsOfType = products.filter(p => p.type === selectedType);

    // Reset color dropdown
    colorSelect.innerHTML = '<option value="">Select Color</option>';

    // Populate color dropdown with unique colors for the selected type
    const uniqueColors = [...new Set(productsOfType.flatMap(p => p.variants ? p.variants.map(v => v.color) : []))];
    uniqueColors.forEach(color => {
      const opt = document.createElement('option');
      opt.value = color;
      opt.textContent = color;
      colorSelect.appendChild(opt);
    });

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

  // Find the exact product with the selected type and then its variant with the selected color
  const product = products.find(p => p.type === type);
  const variant = product?.variants.find(v => v.color === color);

  if (product && variant) {
    // Combine product and variant details into filteredProduct
    filteredProduct = {
      type: product.type,
      pricing: product.pricing, // Use pricing from the main product
      ...variant, // Add variant details like color, page, pdf, number
    };

    const imagePath = variant.page
      ? `Catlogue_icon/${product.type.toLowerCase().replace(/\s/g, '')}-page-${variant.page}.jpg` // Ensure correct image path based on type and page
      : 'Catlogue_icon/default.png';

    img.src = imagePath;
    img.onerror = () => {
      img.src = 'Catlogue_icon/default.png';
      console.warn(`Image not found: ${imagePath}. Displaying default.`);
    };

    renderProductPricing(filteredProduct); // Pass the combined filteredProduct
  } else {
    filteredProduct = null;
    img.src = 'Catlogue_icon/default.png';
    pricingOutputDiv.innerHTML = `
      <p>Please select both <strong>Type</strong> and <strong>Color</strong>
      to see product details and pricing.</p>`;
    document.getElementById('orderSummaryOutput').innerHTML = ''; // Clear summary if selection is incomplete
  }
}

function renderProductPricing(product) {
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');

  if (!product || !product.pricing) {
    pricingOutputDiv.innerHTML = '<p>No pricing available for this selection.</p>';
    return;
  }

  let htmlContent = `
    <h3> Available Sizes & Pricing For  <span style="color: Navy;">${product.color}</span> <span style="color: BlueViolet;">${product.type}</span> Kurta:</h3>
    <div class="tabs">
      <div class="tab-buttons">
        <button class="tab-button active" data-tab="mens">Mens</button>
        <button class="tab-button" data-tab="ladies">Ladies</button>
        <button class="tab-button" data-tab="kids">Kids</button>
      </div>
      <div class="tab-content">
        <div id="mens-tab" class="tab-pane active"></div>
        <div id="ladies-tab" class="tab-pane"></div>
        <div id="kids-tab" class="tab-pane"></div>
      </div>
    </div>
  `;
  pricingOutputDiv.innerHTML = htmlContent;

  const categoriesOrder = ['Mens', 'Ladies', 'Kids'];

  categoriesOrder.forEach(category => {
    const tabPane = document.getElementById(`${category.toLowerCase()}-tab`);
    if (product.pricing[category] && Object.keys(product.pricing[category]).length > 0) {
      let categoryHtml = `<h4>${category}'s Sizes:</h4><div class="category-sizes">`;

      const sizes = product.pricing[category];

      // Sort sizes for consistent display (e.g., S, M, L, XL, XXL)
      const sortedSizeKeys = Object.keys(sizes).sort((a, b) => {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL']; // Define your order
        const indexA = sizeOrder.indexOf(a.toUpperCase());
        const indexB = sizeOrder.indexOf(b.toUpperCase());
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        return a.localeCompare(b); // Fallback for other sizes
      }); 

      sortedSizeKeys.forEach(sizeKey => {
        const MRP = sizes[sizeKey].MRP;
        const discountPercentage = 0.25; // 25% discount
        const discountPrice = Math.round((MRP - (MRP * discountPercentage)) / 10) * 10; // Round to nearest 10

        categoryHtml += `
          <div class="size-item">
            <label>${sizeKey}:</label>
            <input type="number" min="0" value="0"
              data-category="${category}"
              data-size="${sizeKey}"
              data-mrp="${MRP}"
              data-discount="${discountPrice}"
              class="qty-input"
              placeholder="Qty"/>
            <span class="mrp-price"> ₹${MRP}</span>
            <span class="discount-price">Offer: ₹${discountPrice}</span>
          </div>`;
      });
      categoryHtml += `</div>`;
      tabPane.innerHTML = categoryHtml;
    } else {
      tabPane.innerHTML = `<p class="no-sizes-msg">No ${category} sizes available for this product.</p>`;
    }
  });

  // Add event listeners for tab switching
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;

      // Deactivate all buttons and panes
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

      // Activate clicked button and corresponding pane
      button.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}


function showOrderSummary() {
  const orderSummaryOutput = document.getElementById('orderSummaryOutput');

  if (!filteredProduct) {
    orderSummaryOutput.innerHTML = '<p class="error-message">Please select a product (Type and Color) first.</p>';
    // Return a structured object indicating an error
    return {
      html: '',
      selectedItems: null,
      totalItems: 0,
      totalPrice: 0
    };
  }

  // Select all qty inputs from the pricing section
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

  if (Object.keys(selectedItemsByCategory).length > 0) {
    htmlSummary += `<h3>Order Summary for ${filteredProduct.color} (${filteredProduct.type})</h3>`;
    // Ensure consistent category order for summary
    const categoriesOrder = ['Mens', 'Ladies', 'Kids'];

    categoriesOrder.forEach(category => {
      if (selectedItemsByCategory[category] && selectedItemsByCategory[category].length > 0) {
        htmlSummary += `<h4>Category: ${category}</h4><table><thead><tr><th>Size</th><th>Qty</th><th>Offer Price</th><th>Total</th></tr></thead><tbody>`;

        selectedItemsByCategory[category].forEach(item => {
          htmlSummary += `<tr><td>${item.size}</td><td>${item.quantity}</td><td>₹${item.discountPrice}</td><td>₹${item.lineTotal}</td></tr>`;
        });

        htmlSummary += `</tbody></table>`;
      }
    });

    htmlSummary += `<p><strong>Total Items:</strong> ${totalItems}</p><p><strong>Overall Total:</strong> ₹${totalPrice.toFixed(2)}</p>`;
  } else {
    htmlSummary = '<p>No items selected for order. Please enter quantities.</p>';
  }

  orderSummaryOutput.innerHTML = htmlSummary;

  // Return a single object with all the necessary data
  return {
    html: htmlSummary,
    selectedItems: selectedItemsByCategory,
    totalItems,
    totalPrice: totalPrice.toFixed(2)
  };
}

document.getElementById("orderSummaryButton").addEventListener("click", showOrderSummary);

document.getElementById("sendOrderWhatsapp").addEventListener("click", () => {
  const summaries = showOrderSummary();

  // Handle case where no product is selected or no items are added
  if (!filteredProduct || !summaries.selectedItems || Object.keys(summaries.selectedItems).length === 0) {
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

  // Build the WhatsApp message based on the desired format
  let whatsappMessage = `Hi! I want to place a group order: `;

  // First line: Product details
  // Use optional chaining `?.` to safely access the pdf property and use 'N/A' if it doesn't exist
  whatsappMessage += `Product: ${filteredProduct.type} – ${filteredProduct.color} – No. ${filteredProduct.number} | Catalogue: Page ${filteredProduct.page} | File: ${filteredProduct.pdf1 ?? 'N/A'}\n`;

  // Second line: Itemized list by category
  const categoriesOrder = ['Mens', 'Ladies', 'Kids'];
  let itemsSummary = [];
  categoriesOrder.forEach(category => {
    if (summaries.selectedItems[category]) {
      const sizeItems = summaries.selectedItems[category].map(item => `${item.size}-${item.quantity}`).join(', ');
      itemsSummary.push(`${category}: ${sizeItems}`);
    }
  });
  whatsappMessage += itemsSummary.join(' | ');

  // Third line: Totals
  whatsappMessage += ` | Total Items: ${summaries.totalItems} | Overall Total: ₹${summaries.totalPrice} | `;

  // Fourth line onwards: Customer details
  whatsappMessage += `Group Name: ${groupName} | Address: ${address} | Contact: ${contact} | Date: ${new Date().toLocaleDateString("en-IN")}`;

  const whatsappURL = `https://wa.me/919722609460?text=${encodeURIComponent(whatsappMessage)}`;
  window.open(whatsappURL, "_blank");
});