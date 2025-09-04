let products = [];
let filteredProduct = null;

// Custom dropdown elements
const customTypeDropdown = document.getElementById('customTypeDropdown');
const selectedType = document.getElementById('selectedType');
const typeOptions = document.getElementById('typeOptions');

const customColorDropdown = document.getElementById('customColorDropdown');
const selectedColor = document.getElementById('selectedColor');
const colorOptions = document.getElementById('colorOptions');

window.onload = async () => {
  try {
    const res = await fetch('products.json');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    products = await res.json();
    document.getElementById('previewImage').src = 'Catlogue_icon/default.png';
    document.getElementById("sendOrderWhatsapp").style.display = 'none'; // Initially hide the button
    
    // Hide color dropdown initially
    customColorDropdown.style.display = 'none';
    document.querySelector('label[for="colorSelect"]').style.display = 'none';

    populateCustomDropdowns();
    setupCustomDropdownListeners();
    // Initially hide similar products section
    document.getElementById('similarProductsSection').style.display = 'none';

  } catch (error) {
    console.error("Error fetching products:", error);
    document.getElementById('pricingOutputDiv').innerHTML = '<p style="color: red;">Error loading product data. Please try again later.</p>';
  }
};

function populateCustomDropdowns() {
  // Populate Type Dropdown
  const uniqueTypes = [...new Set(products.map(p => p.type))];
  typeOptions.innerHTML = ''; // Clear previous options
  uniqueTypes.forEach(type => {
    const optionItem = document.createElement('div');
    optionItem.classList.add('option-item');
    optionItem.dataset.value = type;
    optionItem.textContent = type;
    typeOptions.appendChild(optionItem);
  });

  // Color dropdown remains empty until a type is selected
  colorOptions.innerHTML = '';
  selectedColor.querySelector('span').textContent = 'Select Color';
}

function setupCustomDropdownListeners() {
  // Toggle Type dropdown
  selectedType.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent document click from closing immediately
    customTypeDropdown.classList.toggle('active');
    // Close color dropdown if open
    customColorDropdown.classList.remove('active');
  });

  // Select Type option
  typeOptions.addEventListener('click', (event) => {
    const selectedOption = event.target.closest('.option-item');
    if (selectedOption) {
      const type = selectedOption.dataset.value;
      selectedType.querySelector('span').textContent = type;
      document.getElementById('typeSelect').value = type; // Update hidden select
      customTypeDropdown.classList.remove('active');
      
      // Update color dropdown based on selected type
      populateColorDropdown(type);
      
      // Reset pricing, summary, and preview image
      document.getElementById('pricingOutputDiv').innerHTML = '<p>Please select a <strong>Type</strong> and <strong>Color</strong> to see pricing and sizes.</p>';
      document.getElementById('orderSummaryOutput').innerHTML = '';
      filteredProduct = null;
      updateImageAndPricing(); // This will show default image
      // Hide similar products section
      document.getElementById('similarProductsSection').style.display = 'none';
    }
  });

  // Toggle Color dropdown
  selectedColor.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent document click from closing immediately
    // Only open if a type is selected
    if (document.getElementById('typeSelect').value) {
      customColorDropdown.classList.toggle('active');
      // Close type dropdown if open
      customTypeDropdown.classList.remove('active');
    }
  });

  // Select Color option
  colorOptions.addEventListener('click', (event) => {
    const selectedOption = event.target.closest('.option-item');
    if (selectedOption) {
      const color = selectedOption.dataset.value;
      const imageSrc = selectedOption.querySelector('img').src; // Get image source

      selectedColor.innerHTML = `<img src="${imageSrc}" alt="${color}" style="width:24px;height:24px;border-radius:4px;margin-right:8px;object-fit:cover;"><span>${color}</span><span class="dropdown-arrow"></span>`;
      document.getElementById('colorSelect').value = color; // Update hidden select
      customColorDropdown.classList.remove('active');
      
      updateImageAndPricing();
      loadSimilarProducts(); // Load similar products when a color is selected
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    customTypeDropdown.classList.remove('active');
    customColorDropdown.classList.remove('active');
  });
}

function populateColorDropdown(selectedType) {
  const productsOfType = products.filter(p => p.type === selectedType);
  colorOptions.innerHTML = ''; // Clear previous options
  
  // Show color dropdown and label
  customColorDropdown.style.display = 'grid'; // Use grid to align with label
  document.querySelector('label[for="colorSelect"]').style.display = 'block';

  const addedColors = new Set();
  productsOfType.forEach(product => {
    if (product.variants) {
      product.variants.forEach(variant => {
        if (!addedColors.has(variant.color)) {
          addedColors.add(variant.color);

          const imagePath = `Catlogue_icon/${product.type.toLowerCase().replace(/\s/g, '')}-page-${variant.page}.jpg`;
          
          const optionItem = document.createElement('div');
          optionItem.classList.add('option-item');
          optionItem.dataset.value = variant.color;
          optionItem.innerHTML = `<img src="${imagePath}" alt="${variant.color} thumbnail"><span>${variant.color}</span>`;
          colorOptions.appendChild(optionItem);
        }
      });
    }
  });

  // Reset selected color display
  selectedColor.innerHTML = `<span>Select Color</span><span class="dropdown-arrow"></span>`;
  document.getElementById('colorSelect').value = ''; // Clear hidden select value
}

function updateImageAndPricing() {
  const type = document.getElementById('typeSelect').value;
  const color = document.getElementById('colorSelect').value;
  const img = document.getElementById('previewImage');
  const previewDiv = document.getElementById('imagePreviewContainer');
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');

  // Find the exact product with the selected type and then its variant with the selected color
  const product = products.find(p => p.type === type);
  const variant = product?.variants.find(v => v.color === color);

  if (product && variant) {
    // Combine product and variant details into filteredProduct
    filteredProduct = {
      type: product.type,
      pdf: product.pdf,
      pricing: product.pricing, // Use pricing from the main product
      ...variant, // Add variant details like color, page, number
    };

    const imagePath = variant.page
      ? `Catlogue_icon/${product.type.toLowerCase().replace(/\s/g, '')}-page-${variant.page}.jpg`
      : 'Catlogue_icon/default.png';

    // Remove the animation class first to reset the animation
    previewDiv.classList.remove('animate-flip');
    // We need a small delay to allow the class to be removed and re-added, triggering the animation again
    setTimeout(() => {
        img.src = imagePath;
        previewDiv.classList.add('animate-flip'); // Add the class to start the animation
    }, 10);

    img.onerror = () => {
      img.src = 'Catlogue_icon/default.png';
      console.warn(`Image not found: ${imagePath}. Displaying default.`);
      previewDiv.classList.remove('animate-flip'); // Remove animation on error
    };

    renderProductPricing(filteredProduct); // Pass the combined filteredProduct
  } else {
    filteredProduct = null;
    img.src = 'Catlogue_icon/default.png';
    previewDiv.classList.remove('animate-flip'); // Remove animation if selection is incomplete
    pricingOutputDiv.innerHTML = `
      <p>Please select both <strong>Type</strong> and <strong>Color</strong>
      to see product details and pricing.</p>`;
    document.getElementById('orderSummaryOutput').innerHTML = '';
    // Hide similar products section if selection is incomplete
    document.getElementById('similarProductsSection').style.display = 'none';
  }
}

function renderProductPricing(product) {
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');

  if (!product || !product.pricing) {
    pricingOutputDiv.innerHTML = '<p>No pricing available for this selection.</p>';
    return;
  }

  const isPlainKurta = product.type === "Plain";

  let htmlContent = `
    <h3>Available Sizes & Pricing for  <span style="color: #2980b9;">${product.color}</span> <span style="color: #3498db;">${product.type}</span> Kurta:</h3>
    <p class="instruction-text-2">
      <strong>Step 2:</strong> Enter the quantity for each size you want to order.
    </p>
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

  const categoriesOrder = ['mens', 'ladies', 'kids'];

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
        const mrp = sizes[sizeKey].mrp;
        const discountPercentage = 0.25; // 25% discount
        const discountPrice = Math.round((mrp - (mrp * discountPercentage)) / 10) * 10; // Round to nearest 10

        // Conditionally render based on whether it's a plain kurta
        categoryHtml += `
          <div class="size-item ${isPlainKurta ? 'plain-kurta-item' : ''}">
            <label>${sizeKey}:</label>
            <input type="number" min="0" value="0"
              data-category="${category}"
              data-size="${sizeKey}"
              data-mrp="${mrp}"
              data-discount="${discountPrice}"
              class="qty-input"
              placeholder="Qty"/>
            ${!isPlainKurta ? `<span class="mrp-price"> ₹${mrp}</span>` : ''}
            ${!isPlainKurta ? `<span class="discount-price">Offer: ₹${discountPrice}</span>` : ''}
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
  const whatsappButton = document.getElementById("sendOrderWhatsapp");

  if (!filteredProduct) {
    orderSummaryOutput.innerHTML = '<p class="error-message">Please select a product (Type and Color) first.</p>';
    whatsappButton.style.display = 'none'; // Keep it hidden
    return { html: '', selectedItems: null, totalItems: 0, totalPrice: 0 };
  }

  const isPlainKurta = filteredProduct.type === "Plain";
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
        lineTotal: isPlainKurta ? quantity : quantity * discountPrice
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
    const categoriesOrder = ['mens', 'ladies', 'kids'];

    categoriesOrder.forEach(category => {
      if (selectedItemsByCategory[category] && selectedItemsByCategory[category].length > 0) {
        if (!isPlainKurta) {
          htmlSummary += `<h4>Category: ${category}</h4><table><thead><tr><th>Size</th><th>Qty</th><th>Offer Price</th><th>Total</th></tr></thead><tbody>`;
        } else {
          htmlSummary += `<h4>Category: ${category}</h4><table><thead><tr><th>Size</th><th>Qty</th></tr></thead><tbody>`;
        }

        selectedItemsByCategory[category].forEach(item => {
          if (!isPlainKurta) {
            htmlSummary += `<tr><td>${item.size}</td><td>${item.quantity}</td><td>₹${item.discountPrice}</td><td>₹${item.lineTotal}</td></tr>`;
          } else {
            htmlSummary += `<tr><td>${item.size}</td><td>${item.quantity}</td></tr>`;
          }
        });

        htmlSummary += `</tbody></table>`;
      }
    });

    htmlSummary += `<p><strong>Total Items:</strong> ${totalItems}</p>`;
    if (!isPlainKurta) {
        htmlSummary += `<p><strong>Overall Total:</strong> ₹${totalPrice.toFixed(2)}</p>`;
    }
    whatsappButton.style.display = 'block'; // Show button if there are items
  } else {
    htmlSummary = '<p>No items selected for order. Please enter quantities.</p>';
    whatsappButton.style.display = 'none'; // Hide button if no items
  }

  orderSummaryOutput.innerHTML = htmlSummary;

  return {
    html: htmlSummary,
    selectedItems: selectedItemsByCategory,
    totalItems,
    totalPrice: isPlainKurta ? 'N/A' : totalPrice.toFixed(2)
  };
}

document.getElementById("orderSummaryButton").addEventListener("click", showOrderSummary);

document.getElementById("sendOrderWhatsapp").addEventListener("click", () => {
  const summaries = showOrderSummary();

  if (!filteredProduct || !summaries.selectedItems || Object.keys(summaries.selectedItems).length === 0) {
    alert("Please select a product (Type and Color) and enter quantities before sending the order.");
    return;
  }

  const customerName = document.getElementById('customerName').value.trim();
  const address = document.getElementById('deliveryAddress').value.trim();
  const contact = document.getElementById('contactNumber').value.trim();

  if (!customerName || !contact) {
    alert("Please fill in Customer Name and Contact Number before sending the order.");
    return;
  }

  if (!address) {
    alert("Please fill in Delivery Address before sending the order.");
    return;
  }


  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(contact)) {
    alert("Please enter a valid 10-digit contact number.");
    return;
  }

  const isPlainKurta = filteredProduct.type === "Plain";

  let whatsappMessage = `Hi! I want to place a group order:\n\n`;

  whatsappMessage += `*Product:* ${filteredProduct.type} – ${filteredProduct.color} – No. ${filteredProduct.number}\n📄 *Catalogue:* Page ${filteredProduct.page} | File: ${filteredProduct.pdf ?? 'N/A'} \n\n`;

  const categoriesOrder = ['mens', 'ladies', 'kids'];
  let itemsSummary = [];
  categoriesOrder.forEach(category => {
    if (summaries.selectedItems[category]) {
      const sizeItems = summaries.selectedItems[category].map(item => `${item.size}-${item.quantity}`).join(' , ');
      itemsSummary.push(`*${category}:* ${sizeItems}`);
    }
  });
  whatsappMessage += itemsSummary.join(' \n ');

  whatsappMessage += ` \n *Total Items:* ${summaries.totalItems} \n\n`;
  if (!isPlainKurta) {
    whatsappMessage += `*Overall Total: ₹${summaries.totalPrice}* `;
  }

  whatsappMessage += `\n\n👥 *Customer Name:* ${customerName} \n🏠 *Address:* ${address} \n📞 *Contact:* ${contact} \n🗓️ *Date: ${new Date().toLocaleDateString("en-IN")}`;

  const whatsappURL = `https://wa.me/919722609460?text=${encodeURIComponent(whatsappMessage)}`;
  window.open(whatsappURL, "_blank");
});

document.getElementById("downloadPdfButton").addEventListener("click", () => {
    const { jsPDF } = window.jspdf;
    const summaries = showOrderSummary();

    const customerName = document.getElementById('customerName').value.trim();
    const address = document.getElementById('deliveryAddress').value.trim();
    const contact = document.getElementById('contactNumber').value.trim();

    if (!customerName || !contact || !address) {
        alert("Please fill in all customer details before generating the PDF.");
        return;
    }

    if (!filteredProduct || !summaries.selectedItems || Object.keys(summaries.selectedItems).length === 0) {
        alert("Please select a product and enter quantities to generate the PDF.");
        return;
    }

    const doc = new jsPDF();
    let y = 10;

    // Shop Info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PLUS POINT", 10, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Exclusive Men's Wear", 10, y);
    y += 5;
    doc.text("Address: Garden Road, Chikhli.", 10, y);
    y += 5;
    doc.text("WhatsApp: 8866244409", 10, y);
    y += 5;
    doc.text("Instagram: @pluspointchikhli", 10, y);

    // Order Summary Heading
    y += 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER SUMMARY", 10, y);
    y += 10;

    // Product Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Product: ${filteredProduct.type} – ${filteredProduct.color}`, 10, y);
    y += 7;
    doc.text(`Catalogue: Page ${filteredProduct.page} | File: ${filteredProduct.pdf ?? 'N/A'}`, 10, y);
    y += 15;

    // Ordered Items by Category
    const categoriesOrder = ['mens', 'ladies', 'kids'];
    categoriesOrder.forEach(category => {
        if (summaries.selectedItems[category]) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`Category: ${category}`, 10, y);
            y += 7;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            summaries.selectedItems[category].forEach(item => {
                doc.text(`Size: ${item.size} - Qty: ${item.quantity}`, 15, y);
                y += 5;
            });
            y += 5;
        }
    });

    // Total Items & Price
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Items: ${summaries.totalItems}`, 10, y);
    y += 7;
    if (filteredProduct.type !== "Plain") {
        doc.text(`Overall Total: ₹${summaries.totalPrice}`, 10, y);
        y += 7;
    }

    // Customer Details
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Your Details:", 10, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Customer Name: ${customerName}`, 10, y);
    y += 5;
    doc.text(`Address: ${address}`, 10, y);
    y += 5;
    doc.text(`Contact: ${contact}`, 10, y);

    // Save PDF
    doc.save(`order-${filteredProduct.type}-${filteredProduct.color}.pdf`);
});


// New function to load similar products
function loadSimilarProducts() {
  const similarProductsGrid = document.getElementById('similarProductsGrid');
  const similarProductsSection = document.getElementById('similarProductsSection');
  similarProductsGrid.innerHTML = ''; // Clear previous similar products

  if (!filteredProduct) {
    similarProductsSection.style.display = 'none';
    return;
  }

  similarProductsSection.style.display = 'block'; // Show the section

  const currentType = filteredProduct.type;
  const currentColor = filteredProduct.color;

  // Filter products to find similar ones (same type, different colors)
  const similarProducts = products
    .filter(p => p.type === currentType) // Same type
    .flatMap(p => p.variants.map(v => ({ // Get all variants
      type: p.type,
      color: v.color,
      page: v.page
    })))
    .filter(v => v.color !== currentColor) // Exclude the currently selected color
    .reduce((acc, current) => { // Ensure unique colors only
      const x = acc.find(item => item.color === current.color);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, [])
    .slice(0, 4); // Get up to 4 similar products

  if (similarProducts.length > 0) {
    similarProducts.forEach(prod => {
      const imagePath = `Catlogue_icon/${prod.type.toLowerCase().replace(/\s/g, '')}-page-${prod.page}.jpg`;
      const productItem = document.createElement('div');
      productItem.classList.add('similar-product-item');
      productItem.innerHTML = `
        <img src="${imagePath}" alt="${prod.color} ${prod.type}">
        <span>${prod.color}</span>
      `;
      // Optional: Add click listener to select this product
      productItem.addEventListener('click', () => {
        // Find the full product and variant to set dropdowns
        const fullProduct = products.find(p => p.type === prod.type);
        const fullVariant = fullProduct?.variants.find(v => v.color === prod.color);

        if (fullProduct && fullVariant) {
          // Update custom dropdown for type
          selectedType.querySelector('span').textContent = fullProduct.type;
          document.getElementById('typeSelect').value = fullProduct.type;

          // Update color dropdown options and select the color
          populateColorDropdown(fullProduct.type); // Repopulate colors first
          selectedColor.innerHTML = `<img src="${imagePath}" alt="${fullVariant.color}" style="width:24px;height:24px;border-radius:4px;margin-right:8px;object-fit:cover;"><span>${fullVariant.color}</span><span class="dropdown-arrow"></span>`;
          document.getElementById('colorSelect').value = fullVariant.color;
          
          updateImageAndPricing(); // Re-render everything
          loadSimilarProducts(); // Reload similar products based on new selection
        }
      });
      similarProductsGrid.appendChild(productItem);
    });
  } else {
    similarProductsSection.style.display = 'none'; // Hide if no similar products
  }
}

// Event listener for the "More Like This" button (optional, can trigger loadSimilarProducts)
document.querySelector('.more-like-this-btn').addEventListener('click', () => {
  // You can define what "More Like This" means. Here, it already loads similar products
  // when a color is selected. This button could, for instance, scroll to the similar products section.
  const similarProductsSection = document.getElementById('similarProductsSection');
  if (similarProductsSection.style.display === 'block') {
    similarProductsSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    alert("Please select a product type and color first to see similar products.");
  }
});

