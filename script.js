let products = [];
let filteredProduct = null;
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
    // Ensure initial summary is shown (empty cart message)
    showOrderSummary();
  } catch (error) {
    console.error("Error fetching products:", error);
    document.getElementById('pricingOutputDiv').innerHTML = '<p style="color: red;">Error loading product data. Please try again later.</p>';
  }
};

function populateDropdowns() {
  const typeSelect = document.getElementById('typeSelect');
  const colorSelect = document.getElementById('colorSelect');
  // New: Get the category (Mens/Ladies/Kids) and size dropdowns
  const categorySelect = document.getElementById('categorySelect');
  const sizeSelect = document.getElementById('sizeSelect');

  // Reset all dropdowns initially
  typeSelect.innerHTML = '<option value="">Select Type</option>';
  colorSelect.innerHTML = '<option value="">Select Color</option>';
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  sizeSelect.innerHTML = '<option value="">Select Size</option>';
  resetPricingAndQuantityDisplay();


  // Populate type dropdown
  const types = [...new Set(products.map(p => p.type))].sort(); // Use Set for unique and sort
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

    // Reset color, category, size dropdowns
    colorSelect.innerHTML = '<option value="">Select Color</option>';
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    sizeSelect.innerHTML = '<option value="">Select Size</option>';
    resetPricingAndQuantityDisplay();


    // Populate color dropdown if variants exist
    if (product && product.variants) {
        const sortedVariants = [...product.variants].sort((a, b) => a.color.localeCompare(b.color));
        sortedVariants.forEach(variant => {
            const opt = document.createElement('option');
            opt.value = variant.color;
            opt.textContent = variant.color;
            colorSelect.appendChild(opt);
        });
    }

    // Reset filteredProduct and image preview
    filteredProduct = null;
    document.getElementById('previewImage').src = 'Catlogue_icon/default.png';
    showOrderSummary(); // Always update summary (empty if no product chosen)
  });

  // When a color is selected
  colorSelect.addEventListener('change', () => {
    updateImageAndPricing(); // This will now also populate category/size dropdowns
  });

  // When a category is selected
  categorySelect.addEventListener('change', () => {
    populateSizeDropdown();
  });

  // When a size is selected
  sizeSelect.addEventListener('change', () => {
    displaySelectedSizePricing();
  });
}

// Helper function to reset pricing and quantity display
function resetPricingAndQuantityDisplay() {
    document.getElementById('pricingOutputDiv').innerHTML = `
        <p>Please select a <strong>Type</strong> and <strong>Color</strong> to see pricing and sizes.</p>
        <div id="selectedSizePricing" style="display: none;">
            <p><strong>MRP:</strong> ₹<span id="displayMRP">0</span></p>
            <p><strong>Offer:</strong> ₹<span id="displayDiscountPrice">0</span></p>
            <label for="quantityInput">Quantity:</label>
            <input type="number" id="quantityInput" min="1" value="1" placeholder="Qty"/>
            <button id="addToCartSingleBtn" class="add-to-cart-btn" style="display: none;">Add to Cart</button>
        </div>
    `;
    // Re-attach listener for the new single Add to Cart button
    document.getElementById('addToCartSingleBtn').addEventListener('click', () => {
        addToCartSingleItem();
    });
}


function updateImageAndPricing() {
  const type = document.getElementById('typeSelect').value;
  const color = document.getElementById('colorSelect').value;
  const img = document.getElementById('previewImage');
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');
  const categorySelect = document.getElementById('categorySelect');


  const product = products.find(p => p.type === type);
  const variant = product?.variants.find(v => v.color === color);

  if (product && variant) {
    filteredProduct = { ...product, ...variant }; // This is our current selection context

    const imagePath = variant.page
      ? `Catlogue_icon/${type.toLowerCase()}-page-${variant.page}.jpg`
      : 'Catlogue_icon/default.png';

    img.src = imagePath;
    img.onerror = () => {
      img.src = 'Catlogue_icon/default.png';
    };

    // Populate Category dropdown based on selected product (Type+Color)
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    const categoriesOrder = ['Mens', 'Ladies', 'Kids'];
    categoriesOrder.forEach(cat => {
        if (filteredProduct.pricing[cat]) {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            categorySelect.appendChild(opt);
        }
    });

    // Reset size dropdown and pricing display
    document.getElementById('sizeSelect').innerHTML = '<option value="">Select Size</option>';
    resetPricingAndQuantityDisplay(); // This ensures pricing details are hidden until size is selected

  } else {
    filteredProduct = null;
    img.src = 'Catlogue_icon/default.png';
    pricingOutputDiv.innerHTML = `
      <p>Please select both <strong>Type</strong> and <strong>Color</strong>
      to see product details and pricing.</p>`;
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    document.getElementById('sizeSelect').innerHTML = '<option value="">Select Size</option>';
  }
  showOrderSummary(); // Always update summary when selection changes
}


function populateSizeDropdown() {
    const categorySelect = document.getElementById('categorySelect');
    const sizeSelect = document.getElementById('sizeSelect');
    const selectedCategory = categorySelect.value;

    sizeSelect.innerHTML = '<option value="">Select Size</option>'; // Reset size dropdown
    resetPricingAndQuantityDisplay(); // Hide price/qty until size is picked

    if (filteredProduct && selectedCategory && filteredProduct.pricing[selectedCategory]) {
        const sizes = filteredProduct.pricing[selectedCategory];
        let sortedSizes = Object.keys(sizes);

        // Sort sizes based on category type
        if (selectedCategory === 'Mens' || selectedCategory === 'Kids') {
            sortedSizes.sort((a, b) => parseInt(a) - parseInt(b));
        } else { // Ladies
            sortedSizes.sort((a, b) => a.localeCompare(b));
        }

        sortedSizes.forEach(sizeKey => {
            const opt = document.createElement('option');
            opt.value = sizeKey;
            opt.textContent = sizeKey;
            sizeSelect.appendChild(opt);
        });

        // If only one size, auto-select it
        if (sortedSizes.length === 1) {
            sizeSelect.value = sortedSizes[0];
            displaySelectedSizePricing(); // Trigger display for auto-selected size
        }
    }
}

function displaySelectedSizePricing() {
    const categorySelect = document.getElementById('categorySelect');
    const sizeSelect = document.getElementById('sizeSelect');
    const selectedCategory = categorySelect.value;
    const selectedSize = sizeSelect.value;

    const selectedSizePricingDiv = document.getElementById('selectedSizePricing');
    const displayMRP = document.getElementById('displayMRP');
    const displayDiscountPrice = document.getElementById('displayDiscountPrice');
    const quantityInput = document.getElementById('quantityInput');
    const addToCartSingleBtn = document.getElementById('addToCartSingleBtn');

    if (filteredProduct && selectedCategory && selectedSize &&
        filteredProduct.pricing[selectedCategory] &&
        filteredProduct.pricing[selectedCategory][selectedSize]) {

        const sizeDetails = filteredProduct.pricing[selectedCategory][selectedSize];
        const MRP = sizeDetails.MRP;
        const discountPercentage = 0.25;
        const discountPrice = Math.round((MRP - (MRP * discountPercentage)) / 10) * 10;

        displayMRP.textContent = MRP;
        displayDiscountPrice.textContent = discountPrice;
        quantityInput.value = 1; // Reset quantity to 1
        selectedSizePricingDiv.style.display = 'block'; // Show the pricing/qty section
        addToCartSingleBtn.style.display = 'inline-block'; // Show the Add to Cart button

        // Set data attributes on the quantity input for easier cart adding
        quantityInput.dataset.category = selectedCategory;
        quantityInput.dataset.size = selectedSize;
        quantityInput.dataset.mrp = MRP;
        quantityInput.dataset.discount = discountPrice;
        quantityInput.dataset.type = filteredProduct.type;
        quantityInput.dataset.color = filteredProduct.color;
        quantityInput.dataset.productNumber = filteredProduct.number;
        quantityInput.dataset.productPage = filteredProduct.page;
        quantityInput.dataset.productPdf = filteredProduct.pdf;

    } else {
        selectedSizePricingDiv.style.display = 'none'; // Hide if no valid size selected
        displayMRP.textContent = '0';
        displayDiscountPrice.textContent = '0';
        quantityInput.value = 1;
        addToCartSingleBtn.style.display = 'none';
    }
}


// Modified addToCart to work with single quantity input
function addToCartSingleItem() {
    const quantityInput = document.getElementById('quantityInput');
    const quantity = parseInt(quantityInput.value);

    if (quantity <= 0 || isNaN(quantity)) {
        alert("Please enter a valid quantity greater than 0.");
        return;
    }

    // Get data directly from the quantityInput's dataset
    const item = {
        type: quantityInput.dataset.type,
        color: quantityInput.dataset.color,
        productNumber: quantityInput.dataset.productNumber,
        productPage: quantityInput.dataset.productPage,
        productPdf: quantityInput.dataset.productPdf,
        category: quantityInput.dataset.category,
        size: quantityInput.dataset.size,
        mrp: parseFloat(quantityInput.dataset.mrp),
        discountPrice: parseFloat(quantityInput.dataset.discount),
        quantity: quantity,
        lineTotal: quantity * parseFloat(quantityInput.dataset.discount)
    };

    // Check if item already exists in cart (same type, color, category, size)
    const existingItemIndex = cart.findIndex(
        cartItem => cartItem.type === item.type &&
                    cartItem.color === item.color &&
                    cartItem.category === item.category &&
                    cartItem.size === item.size
    );

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
        cart[existingItemIndex].lineTotal += item.lineTotal;
        alert(`Updated quantity for ${item.type} - ${item.color} (${item.category}'s ${item.size}). New quantity: ${cart[existingItemIndex].quantity}`);
    } else {
        cart.push(item);
        alert(`Added ${quantity} of ${item.type} - ${item.color} (${item.category}'s ${item.size}) to cart!`);
    }

    // --- Reset selection for "Add More Item" flow ---
    document.getElementById('typeSelect').value = ''; // Clear type
    document.getElementById('colorSelect').innerHTML = '<option value="">Select Color</option>'; // Clear color
    document.getElementById('categorySelect').innerHTML = '<option value="">Select Category</option>'; // Clear category
    document.getElementById('sizeSelect').innerHTML = '<option value="">Select Size</option>'; // Clear size
    resetPricingAndQuantityDisplay(); // Clear pricing/qty display
    document.getElementById('previewImage').src = 'Catlogue_icon/default.png'; // Reset image
    filteredProduct = null; // Clear filtered product context
    // --- End Reset ---

    showOrderSummary(); // Update the displayed summary immediately
}


// showOrderSummary, removeFromCart, clearCart, sendOrderWhatsapp remain mostly the same
// because they operate on the 'cart' array, which is updated by addToCartSingleItem.

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
        // Use a unique key that identifies the specific product (not just variant)
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
        htmlSummary += `<p>📄 Catalogue: Page ${productGroup.productPage || 'N/A'} | File: ${productGroup.productPdf || 'N/A'}</p>`; // Handle missing page/pdf
        whatsappTextSummary += `🧥 *Product:* ${productGroup.type} – ${productGroup.color} – No. ${productGroup.productNumber || 'N/A'}\n`;
        whatsappTextSummary += `📄 *Catalogue:* Page ${productGroup.productPage || 'N/A'} | File: ${productGroup.productPdf || 'N/A'}\n`;

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

function clearCart() {
    if (confirm("Are you sure you want to clear your entire cart?")) {
        cart = []; // Empty the cart array
        alert("Cart has been cleared!");
        showOrderSummary(); // Update the displayed summary
        // Optionally, reset product selection dropdowns or pricing div
        document.getElementById('typeSelect').value = '';
        document.getElementById('colorSelect').innerHTML = '<option value="">Select Color</option>';
        document.getElementById('categorySelect').innerHTML = '<option value="">Select Category</option>';
        document.getElementById('sizeSelect').innerHTML = '<option value="">Select Size</option>';
        resetPricingAndQuantityDisplay();
        document.getElementById('previewImage').src = 'Catlogue_icon/default.png';
        filteredProduct = null;
    }
}


document.getElementById("orderSummaryButton").addEventListener("click", showOrderSummary);

document.getElementById("sendOrderWhatsapp").addEventListener("click", () => {
    const summaries = showOrderSummary(); // Regenerate summary to ensure it's up-to-date

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
