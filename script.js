let products = [];
let filteredProduct = null;
// 1. Introduce a cart array to hold selected items
let cart = [];

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
  const types = [...new Set(products.map(p => p.type))]; // Use Set to get unique types
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
        // Sort variants by color for consistent order
        const sortedVariants = [...product.variants].sort((a, b) => a.color.localeCompare(b.color));
        sortedVariants.forEach(variant => {
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

    renderProductPricing(filteredProduct); // Pass filteredProduct to render pricing
  } else {
    filteredProduct = null;
    img.src = 'Catlogue_icon/default.png';
    pricingOutputDiv.innerHTML = `
      <p>Please select both <strong>Type</strong> and <strong>Color</strong>
      to see product details and pricing.</p>`;
  }
  // Always update summary when selection changes to reflect current cart state
  showOrderSummary();
}

function renderProductPricing(currentFilteredProduct) { // Renamed parameter for clarity
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');

  if (!currentFilteredProduct || !currentFilteredProduct.pricing) {
    pricingOutputDiv.innerHTML = '<p>No pricing available for this selection.</p>';
    return;
  }

  let htmlContent = `<h3>Available Sizes & Pricing for ${currentFilteredProduct.type} - ${currentFilteredProduct.color}:</h3>`;
  const categoriesOrder = ['Mens', 'Ladies', 'Kids'];

  categoriesOrder.forEach(category => {
    if (currentFilteredProduct.pricing[category]) {
      htmlContent += `<h4>${category}'s:</h4><div class="category-sizes">`;

      const sizes = currentFilteredProduct.pricing[category];

      // Sort sizes for consistent display, assuming numeric sizes for Mens/Kids and alphanumeric for Ladies
      const sortedSizes = Object.keys(sizes).sort((a, b) => {
          if (category === 'Mens' || category === 'Kids') {
              return parseInt(a) - parseInt(b);
          }
          return a.localeCompare(b);
      });

      sortedSizes.forEach(sizeKey => {
        const MRP = sizes[sizeKey].MRP;
        const discountPercentage = 0.25;
        const discountPrice = Math.round((MRP - (MRP * discountPercentage))/10)*10;

        // 2. Add an "Add to Cart" button and data attributes for the item
        htmlContent += `
          <div class="size-item">
            <label>${sizeKey}:</label>
            <input type="number" min="0" value="0"
              class="qty-input"
              data-category="${category}"
              data-size="${sizeKey}"
              data-mrp="${MRP}"
              data-discount="${discountPrice}"
              data-type="${currentFilteredProduct.type}"
              data-color="${currentFilteredProduct.color}"
              data-product-number="${currentFilteredProduct.number}"
              data-product-page="${currentFilteredProduct.page}"
              data-product-pdf="${currentFilteredProduct.pdf}"
              placeholder="Qty"/>
            <span class="mrp-price">MRP: ₹${MRP}</span>
            <span class="discount-price">Offer: ₹${discountPrice}</span>
            <button class="add-to-cart-btn"
                data-category="${category}"
                data-size="${sizeKey}"
                data-mrp="${MRP}"
                data-discount="${discountPrice}"
                data-type="${currentFilteredProduct.type}"
                data-color="${currentFilteredProduct.color}"
                data-product-number="${currentFilteredProduct.number}"
                data-product-page="${currentFilteredProduct.page}"
                data-product-pdf="${currentFilteredProduct.pdf}"
            >Add to Cart</button>
          </div>`;
      });

      htmlContent += `</div>`;
    }
  });

  pricingOutputDiv.innerHTML = htmlContent;

  // 3. Attach event listeners to the new "Add to Cart" buttons
  document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      const btn = event.target;
      const qtyInput = btn.previousElementSibling.previousElementSibling.previousElementSibling; // Get the quantity input
      addToCart(qtyInput, btn); // Pass both for data and quantity
    });
  });
}

// 3. Create an addToCart function
function addToCart(qtyInput, sourceButton) {
  const quantity = parseInt(qtyInput.value);

  if (quantity <= 0 || isNaN(quantity)) {
    alert("Please enter a valid quantity greater than 0.");
    return;
  }

  const item = {
    type: sourceButton.dataset.type,
    color: sourceButton.dataset.color,
    productNumber: sourceButton.dataset.productNumber,
    productPage: sourceButton.dataset.productPage,
    productPdf: sourceButton.dataset.productPdf,
    category: sourceButton.dataset.category,
    size: sourceButton.dataset.size,
    mrp: parseFloat(sourceButton.dataset.mrp),
    discountPrice: parseFloat(sourceButton.dataset.discount),
    quantity: quantity,
    lineTotal: quantity * parseFloat(sourceButton.dataset.discount)
  };

  // Check if item already exists in cart (same type, color, category, size)
  const existingItemIndex = cart.findIndex(
    cartItem => cartItem.type === item.type &&
                cartItem.color === item.color &&
                cartItem.category === item.category &&
                cartItem.size === item.size
  );

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    cart[existingItemIndex].quantity += quantity;
    cart[existingItemIndex].lineTotal += item.lineTotal;
    alert(`Updated quantity for ${item.type} - ${item.color} (${item.category}'s ${item.size}). New quantity: ${cart[existingItemIndex].quantity}`);
  } else {
    // Add new item to cart
    cart.push(item);
    alert(`Added ${quantity} of ${item.type} - ${item.color} (${item.category}'s ${item.size}) to cart!`);
  }

  // Reset the quantity input to 0 after adding to cart
  qtyInput.value = 0;
  showOrderSummary(); // Update the displayed summary immediately
}


// 4. Modify showOrderSummary to use the cart array
function showOrderSummary() {
  const orderSummaryOutput = document.getElementById('orderSummaryOutput');

  if (cart.length === 0) {
    orderSummaryOutput.innerHTML = '<p class="info-message">Your cart is empty. Please add items.</p>';
    document.getElementById('sendOrderWhatsapp').disabled = true; // Disable WhatsApp button if cart is empty
    return { html: '', whatsapp: 'Cart is empty.' };
  }

  document.getElementById('sendOrderWhatsapp').disabled = false; // Enable WhatsApp button if cart has items

  // Group items by product (Type-Color)
  const groupedCart = cart.reduce((acc, item) => {
    const key = `${item.type}-${item.color}-${item.productNumber}`;
    if (!acc[key]) {
      acc[key] = {
        type: item.type,
        color: item.color,
        productNumber: item.productNumber,
        productPage: item.productPage,
        productPdf: item.productPdf,
        itemsByCategory: {},
        totalItemsForProduct: 0,
        totalPriceForProduct: 0
      };
    }
    if (!acc[key].itemsByCategory[item.category]) {
      acc[key].itemsByCategory[item.category] = [];
    }
    acc[key].itemsByCategory[item.category].push(item);
    acc[key].totalItemsForProduct += item.quantity;
    acc[key].totalPriceForProduct += item.lineTotal;
    return acc;
  }, {});


  let htmlSummary = '<h2>Your Cart Summary</h2>';
  let whatsappTextSummary = 'Hi! I want to place a group order:\n\n';
  let overallTotalItems = 0;
  let overallTotalPrice = 0;

  const productKeys = Object.keys(groupedCart).sort(); // Sort products for consistent output

  productKeys.forEach(key => {
    const productGroup = groupedCart[key];

    htmlSummary += `<div class="product-group-summary">`;
    htmlSummary += `<h3>🧥 Product: ${productGroup.type} – ${productGroup.color} – No. ${productGroup.productNumber}</h3>`;
    htmlSummary += `<p>📄 Catalogue: Page ${productGroup.productPage} | File: ${productGroup.productPdf}</p>`;
    whatsappTextSummary += `🧥 *Product:* ${productGroup.type} – ${productGroup.color} – No. ${productGroup.productNumber}\n`;
    whatsappTextSummary += `📄 *Catalogue:* Page ${productGroup.productPage} | File: ${productGroup.productPdf}\n`;

    const categoriesOrder = ['Mens', 'Ladies', 'Kids'];
    categoriesOrder.forEach(category => {
      if (productGroup.itemsByCategory[category]) {
        htmlSummary += `<h4>Category: ${category}</h4><table><thead><tr><th>Size</th><th>Qty</th><th>MRP</th><th>Offer Price</th><th>Total</th><th></th></tr></thead><tbody>`;
        whatsappTextSummary += `*Category: ${category}*\n- Size - Qty - Price - Total\n`;

        productGroup.itemsByCategory[category].forEach(item => {
          htmlSummary += `
            <tr>
              <td>${item.size}</td>
              <td>${item.quantity}</td>
              <td>₹${item.mrp}</td>
              <td>₹${item.discountPrice}</td>
              <td>₹${item.lineTotal.toFixed(2)}</td>
              <td><button class="remove-from-cart-btn"
                          data-type="${item.type}"
                          data-color="${item.color}"
                          data-category="${item.category}"
                          data-size="${item.size}">Remove</button></td>
            </tr>`;
          whatsappTextSummary += `- ${item.size} - ${item.quantity} - ₹${item.discountPrice} - ₹${item.lineTotal.toFixed(2)}\n`;
        });
        htmlSummary += `</tbody></table>`;
        whatsappTextSummary += `\n`;
      }
    });

    htmlSummary += `<p><strong>Product Total Items:</strong> ${productGroup.totalItemsForProduct}</p><p><strong>Product Total Price:</strong> ₹${productGroup.totalPriceForProduct.toFixed(2)}</p>`;
    whatsappTextSummary += `*Product Total Items:* ${productGroup.totalItemsForProduct}\n*Product Total Price:* ₹${productGroup.totalPriceForProduct.toFixed(2)}\n\n`;

    overallTotalItems += productGroup.totalItemsForProduct;
    overallTotalPrice += productGroup.totalPriceForProduct;

    htmlSummary += `</div><hr>`; // Separator between different products in summary
  });

  htmlSummary += `<div class="overall-summary">`;
  htmlSummary += `<p><strong>Overall Total Items in Cart:</strong> ${overallTotalItems}</p>`;
  htmlSummary += `<p><strong>Overall Grand Total:</strong> ₹${overallTotalPrice.toFixed(2)}</p>`;
  htmlSummary += `<button id="clearCartButton" style="background-color: #f44336; color: white; padding: 10px 20px; border: none; cursor: pointer; border-radius: 5px;">Clear Cart</button>`;
  htmlSummary += `</div>`;


  whatsappTextSummary += `*Overall Total Items in Cart:* ${overallTotalItems}\n*Overall Grand Total:* ₹${overallTotalPrice.toFixed(2)}`;

  orderSummaryOutput.innerHTML = htmlSummary;

  // Add event listeners for remove buttons
  document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
    button.addEventListener('click', removeFromCart);
  });

  // Add event listener for clear cart button
  document.getElementById('clearCartButton').addEventListener('click', clearCart);

  return { html: htmlSummary, whatsapp: whatsappTextSummary };
}

// Function to remove an item from the cart
function removeFromCart(event) {
    const btn = event.target;
    const { type, color, category, size } = btn.dataset;

    const indexToRemove = cart.findIndex(item =>
        item.type === type &&
        item.color === color &&
        item.category === category &&
        item.size === size
    );

    if (indexToRemove > -1) {
        const removedItem = cart.splice(indexToRemove, 1)[0];
        alert(`Removed ${removedItem.type} - ${removedItem.color} (${removedItem.category}'s ${removedItem.size}) from cart.`);
        showOrderSummary(); // Update summary after removal
    }
}

// Function to clear the entire cart
function clearCart() {
    if (confirm("Are you sure you want to clear your entire cart?")) {
        cart = []; // Empty the cart array
        alert("Cart has been cleared!");
        showOrderSummary(); // Update the displayed summary
        // Optionally, reset product selection dropdowns or pricing div
        // document.getElementById('typeSelect').value = '';
        // document.getElementById('colorSelect').value = '';
        // document.getElementById('pricingOutputDiv').innerHTML = '';
        // document.getElementById('previewImage').src = 'Catlogue_icon/default.png';
    }
}


document.getElementById("orderSummaryButton").addEventListener("click", showOrderSummary);

document.getElementById("sendOrderWhatsapp").addEventListener("click", () => {
  const summaries = showOrderSummary();

  if (cart.length === 0) {
    alert("Your cart is empty. Please add items before sending the order.");
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

  let finalWhatsappMessage = summaries.whatsapp; // Start with the cart summary

  finalWhatsappMessage += `\n\n👥 *Group Name:* ${groupName}`;
  finalWhatsappMessage += `\n🏠 *Address:* ${address}`;
  finalWhatsappMessage += `\n📞 *Contact:* ${contact}`;
  finalWhatsappMessage += `\n🗓️ *Date:* ${new Date().toLocaleDateString("en-IN")}`;


  const whatsappURL = `https://wa.me/918866244409?text=${encodeURIComponent(finalWhatsappMessage)}`;
  window.open(whatsappURL, "_blank");
});

