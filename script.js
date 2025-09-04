let products = [];
let filteredProduct = null;

const typeButtonsContainer = document.getElementById('typeButtonsContainer');
const colorSelectionSection = document.getElementById('colorSelectionSection'); // Renamed
const colorGrid = document.getElementById('colorGrid'); // Renamed

window.onload = async () => {
  try {
    const res = await fetch('products.json');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    products = await res.json();
    document.getElementById('previewImage').src = 'Catlogue_icon/default.png';
    document.getElementById("sendOrderWhatsapp").style.display = 'none';
    
    // Initially hide color selection section
    colorSelectionSection.style.display = 'none';
    // Hide pricing output initially
    document.getElementById('pricingOutputDiv').style.display = 'none';

    populateTypeButtons();

  } catch (error) {
    console.error("Error fetching products:", error);
    document.getElementById('pricingOutputDiv').innerHTML = '<p style="color: red;">Error loading product data. Please try again later.</p>';
    document.getElementById('pricingOutputDiv').style.display = 'block'; // Show error message
  }
};

function populateTypeButtons() {
  typeButtonsContainer.innerHTML = '';
  const uniqueTypes = [...new Set(products.map(p => p.type))];
  uniqueTypes.forEach(type => {
    const button = document.createElement('button');
    button.classList.add('type-button');
    button.textContent = type;
    button.dataset.type = type;
    button.addEventListener('click', () => {
      // Deactivate all type buttons
      document.querySelectorAll('.type-button').forEach(btn => btn.classList.remove('active'));
      // Activate the clicked type button
      button.classList.add('active');
      
      // Load colors for the selected type
      loadColorsForType(type);
      
      // Reset other sections
      document.getElementById('pricingOutputDiv').style.display = 'none'; // Hide pricing until color is selected
      document.getElementById('pricingOutputDiv').innerHTML = '<p>Please select a <strong>Type</strong> and <strong>Color</strong> to see pricing and sizes.</p>';
      document.getElementById('orderSummaryOutput').innerHTML = '';
      document.getElementById('previewImage').src = 'Catlogue_icon/default.png';
      filteredProduct = null;
    });
    typeButtonsContainer.appendChild(button);
  });
}

// Renamed from loadSimilarProducts to loadColorsForType
function loadColorsForType(selectedType) {
  colorGrid.innerHTML = ''; // Clear previous colors
  colorSelectionSection.style.display = 'block'; // Show the section

  const productOfType = products.find(p => p.type === selectedType);

  if (!productOfType || !productOfType.variants) {
    colorSelectionSection.style.display = 'none';
    return;
  }

  const addedColors = new Set();
  productOfType.variants.forEach(variant => {
    if (!addedColors.has(variant.color)) {
      addedColors.add(variant.color);

      // Construct image path for color selection thumbnails
      const imagePath = `Catlogue_icon/${productOfType.type.toLowerCase().replace(/\s/g, '')}-page-${variant.page}.jpg`;
      const colorItem = document.createElement('div'); // Renamed from productItem
      colorItem.classList.add('color-item'); // Renamed class
      colorItem.innerHTML = `
        <img src="${imagePath}" alt="${variant.color} ${productOfType.type}">
        <span>${variant.color}</span>
      `;
      colorItem.dataset.type = productOfType.type;
      colorItem.dataset.color = variant.color;
      colorItem.dataset.page = variant.page; // Store page for direct image loading

      colorItem.addEventListener('click', () => {
        const type = colorItem.dataset.type;
        const color = colorItem.dataset.color;
        
        // Remove active class from all color items
        document.querySelectorAll('.color-item').forEach(item => item.classList.remove('active'));
        // Add active class to the clicked item
        colorItem.classList.add('active');

        // Update the main preview image and pricing
        updateImageAndPricing(type, color);
      });

      colorGrid.appendChild(colorItem);
    }
  });
}

function updateImageAndPricing(type, color) {
  const img = document.getElementById('previewImage');
  const previewDiv = document.getElementById('imagePreviewContainer');
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');

  const product = products.find(p => p.type === type);
  const variant = product?.variants.find(v => v.color === color);

  if (product && variant) {
    filteredProduct = {
      type: product.type,
      pdf: product.pdf,
      pricing: product.pricing,
      ...variant,
    };

    const imagePath = `Catlogue_icon/${product.type.toLowerCase().replace(/\s/g, '')}-page-${variant.page}.jpg`;

    previewDiv.classList.remove('animate-flip');
    setTimeout(() => {
        img.src = imagePath;
        previewDiv.classList.add('animate-flip');
    }, 10);

    img.onerror = () => {
      img.src = 'Catlogue_icon/default.png';
      console.warn(`Image not found: ${imagePath}. Displaying default.`);
      previewDiv.classList.remove('animate-flip');
    };

    renderProductPricing(filteredProduct);
    pricingOutputDiv.style.display = 'block'; // Show pricing div once a color is selected
  } else {
    filteredProduct = null;
    img.src = 'Catlogue_icon/default.png';
    previewDiv.classList.remove('animate-flip');
    pricingOutputDiv.innerHTML = `<p>Please select both <strong>Type</strong> and <strong>Color</strong> to see product details and pricing.</p>`;
    pricingOutputDiv.style.display = 'block'; // Show message
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
    <h3>Available Sizes & Pricing for <span style="color: #2980b9;">${product.color}</span> <span style="color: #3498db;">${product.type}</span> Kurta:</h3>
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
      const sortedSizeKeys = Object.keys(sizes).sort((a, b) => {
        const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', '6XL'];
        const indexA = sizeOrder.indexOf(a.toUpperCase());
        const indexB = sizeOrder.indexOf(b.toUpperCase());
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        return a.localeCompare(b);
      });
      sortedSizeKeys.forEach(sizeKey => {
        const mrp = sizes[sizeKey].MRP;
        const discountPercentage = 0.25;
        const discountPrice = isPlainKurta ? 0 : Math.round((mrp - (mrp * discountPercentage)) / 10) * 10;
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
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.dataset.tab;
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
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
    whatsappButton.style.display = 'none';
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
    whatsappButton.style.display = 'block';
  } else {
    htmlSummary = '<p>No items selected for order. Please enter quantities.</p>';
    whatsappButton.style.display = 'none';
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
  if (!customerName || !contact || !address) {
    alert("Please fill in Customer Name, Address, and Contact Number before sending the order.");
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
    y += 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ORDER SUMMARY", 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Product: ${filteredProduct.type} – ${filteredProduct.color}`, 10, y);
    y += 7;
    doc.text(`Catalogue: Page ${filteredProduct.page} | File: ${filteredProduct.pdf ?? 'N/A'}`, 10, y);
    y += 15;
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
    y += 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Items: ${summaries.totalItems}`, 10, y);
    y += 7;
    if (filteredProduct.type !== "Plain") {
        doc.text(`Overall Total: ₹${summaries.totalPrice}`, 10, y);
        y += 7;
    }
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
    doc.save(`order-${filteredProduct.type}-${filteredProduct.color}.pdf`);
});


// Event listener for the "More Like This" button
document.querySelector('.more-like-this-btn').addEventListener('click', () => {
    const colorSelectionSection = document.getElementById('colorSelectionSection'); // Renamed
    if (colorSelectionSection.style.display === 'block') {
        colorSelectionSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        alert("Please select a product type first to see available colors.");
    }
});
