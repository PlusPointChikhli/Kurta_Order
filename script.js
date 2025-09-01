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
    document.getElementById("sendOrderWhatsapp").style.display = 'none'; // Initially hide the button
    populateDropdowns();
  } catch (error) {
    console.error("Error fetching products:", error);
    document.getElementById('pricingOutputDiv').innerHTML = '<p style="color: red;">Error loading product data. Please try again later.</p>';
  }
};

function populateDropdowns() {
  const typeSelect = document.getElementById('typeSelect');
  const colorSelect = document.getElementById('colorSelect');
  const colorLabel = document.querySelector('label[for="colorSelect"]');

  // Initially hide the color select and its label
  colorSelect.style.display = 'none';
  colorLabel.style.display = 'none';

  // Reset both dropdowns initially
  typeSelect.innerHTML = '<option value="">Select Kurta Type</option>';
  colorSelect.innerHTML = '<option value="">Select Color</option>';

  // Populate type dropdown
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
    
    // Show color dropdown only if a type is selected
    if (selectedType) {
      colorSelect.style.display = 'block';
      colorLabel.style.display = 'block';
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
    } else {
      // Hide color dropdown if no type is selected
      colorSelect.style.display = 'none';
      colorLabel.style.display = 'none';
    }

    // Reset pricing, summary, and preview image
    document.getElementById('pricingOutputDiv').innerHTML = '<p>Please select a <strong>Type</strong> and <strong>Color</strong> to see pricing and sizes.</p>';
    document.getElementById('orderSummaryOutput').innerHTML = '';
    filteredProduct = null;
    updateImageAndPricing();
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
    <h3> Available Sizes & Pricing For  <span style="color: Navy;">${product.color}</span> <span style="color: BlueViolet;">${product.type}</span> Kurta:</h3>
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

        // Conditionally render based on whether it's a Plain Kurta
        categoryHtml += `
          <div class="size-item ${isPlainKurta ? 'plain-kurta-item' : ''}">
            <label>${sizeKey}:</label>
            <input type="number" min="0" value="0"
              data-category="${category}"
              data-size="${sizeKey}"
              data-mrp="${MRP}"
              data-discount="${discountPrice}"
              class="qty-input"
              placeholder="Qty"/>
            ${!isPlainKurta ? `<span class="mrp-price"> ₹${MRP}</span>` : ''}
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
    const categoriesOrder = ['Mens', 'Ladies', 'Kids'];

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

  const categoriesOrder = ['Mens', 'Ladies', 'Kids'];
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
    doc.text("Exclusive Men'swear", 10, y);
    y += 5;
    doc.text("Address: Garden Road, Chikhli.", 10, y);
    y += 5;
    doc.text("WhatsApp: 8866244409", 10, y);
    y += 5;
    doc.text("Instagram: PLUSPOINTCHIKHLI", 10, y);

    // Order Summary Heading
    y += 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Order Summary", 10, y);
    y += 10;

    // Product Details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Product: ${filteredProduct.type} – ${filteredProduct.color}`, 10, y);
    y += 7;
    doc.text(`Catalogue: Page ${filteredProduct.page} | File: ${filteredProduct.pdf ?? 'N/A'}`, 10, y);
    y += 15;

    // Ordered Items by Category
    const categoriesOrder = ['Mens', 'Ladies', 'Kids'];
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
    doc.save(`Order-${filteredProduct.type}-${filteredProduct.color}.pdf`);
});
