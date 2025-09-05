let products = [];
let filteredProduct = null;

const typeButtonsContainer = document.getElementById('typeButtonsContainer');
const colorSelectionSection = document.getElementById('colorSelectionSection');
const colorGrid = document.getElementById('colorGrid');

window.onload = async () => {
  try {
    const res = await fetch('products.json');
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    products = await res.json();
    document.getElementById('previewImage').src = 'Catlogue_icon/default.png';
    document.getElementById("sendOrderWhatsapp").style.display = 'none';

    colorSelectionSection.style.display = 'none';
    document.getElementById('pricingOutputDiv').style.display = 'none';

    populateTypeButtons();

  } catch (error) {
    console.error("Error fetching products:", error);
    document.getElementById('pricingOutputDiv').innerHTML = '<p style="color: red;">Product data load hone mein error hai. Dobara try karein.</p>';
    document.getElementById('pricingOutputDiv').style.display = 'block';
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
      document.querySelectorAll('.type-button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      loadColorsForType(type);

      document.getElementById('pricingOutputDiv').style.display = 'none';
      document.getElementById('pricingOutputDiv').innerHTML = '<p>Pehle Type aur Color select karein.</p>';
      document.getElementById('orderSummaryOutput').innerHTML = '';
      document.getElementById('previewImage').src = 'Catlogue_icon/default.png';
      filteredProduct = null;
    });
    typeButtonsContainer.appendChild(button);
  });
}

function loadColorsForType(selectedType) {
  colorGrid.innerHTML = '';
  colorSelectionSection.style.display = 'block';

  const productOfType = products.find(p => p.type === selectedType);

  if (!productOfType || !productOfType.variants) {
    colorSelectionSection.style.display = 'none';
    return;
  }

  const addedColors = new Set();
  productOfType.variants.forEach(variant => {
    if (!addedColors.has(variant.color)) {
      addedColors.add(variant.color);

      const imagePath = `Catlogue_icon/${productOfType.type.toLowerCase().replace(/\s/g, '')}-page-${variant.page}.jpg`;
      const colorItem = document.createElement('div');
      colorItem.classList.add('color-item');
      colorItem.innerHTML = `
        <img src="${imagePath}" alt="${variant.color} ${productOfType.type}">
        <span>${variant.color}</span>
      `;
      colorItem.dataset.type = productOfType.type;
      colorItem.dataset.color = variant.color;

      colorItem.addEventListener('click', () => {
        const type = colorItem.dataset.type;
        const color = colorItem.dataset.color;

        document.querySelectorAll('.color-item').forEach(item => item.classList.remove('active'));
        colorItem.classList.add('active');

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
    pricingOutputDiv.style.display = 'block';
  } else {
    filteredProduct = null;
    img.src = 'Catlogue_icon/default.png';
    previewDiv.classList.remove('animate-flip');
    pricingOutputDiv.innerHTML = `<p>Pehle Type aur Color select karein.</p>`;
    pricingOutputDiv.style.display = 'block';
    document.getElementById('orderSummaryOutput').innerHTML = '';
  }
}

function renderProductPricing(product) {
  const pricingOutputDiv = document.getElementById('pricingOutputDiv');

  if (!product || !product.pricing) {
    pricingOutputDiv.innerHTML = '<p>Is product ke liye koi pricing available nahi hai.</p>';
    return;
  }
  const isPlainKurta = product.type === "Plain";
  let htmlContent = `
    <h3>Available Sizes & Pricing for <span style="color: #2980b9;">${product.color}</span> <span style="color: #3498db;">${product.type}</span> Kurta:</h3>
    <p class="instruction-text-2">
      <strong>Step 2:</strong> Har size ke liye quantity daalein.
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
        const discountPrice = Math.round((mrp - (mrp * discountPercentage)) / 10) * 10;
        categoryHtml += `
          <div class="size-item">
            <label>${sizeKey}:</label>
            <input type="number" min="0" value="0"
              data-category="${category}"
              data-size="${sizeKey}"
              data-mrp="${mrp}"
              data-discount="${discountPrice}"
              class="qty-input"
              placeholder="Qty"/>
            ${!isPlainKurta ? `<span class="mrp-price"> ₹${mrp}</span>` : `<span class="mrp-price"> ₹${mrp}</span>`}
            ${!isPlainKurta ? `<span class="discount-price">Offer: ₹${discountPrice}</span>` : ''}
          </div>`;
      });
      categoryHtml += `</div>`;
      tabPane.innerHTML = categoryHtml;
    } else {
      tabPane.innerHTML = `<p class="no-sizes-msg">Is product ke liye ${category} sizes available nahi hain.</p>`;
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
    orderSummaryOutput.innerHTML = '<p class="error-message">Pehle koi product select karein (Type aur Color).</p>';
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

      const priceToUse = isPlainKurta ? mrp : discountPrice;

      const itemDetails = {
        size,
        quantity,
        price: priceToUse,
        lineTotal: quantity * priceToUse
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
        htmlSummary += `<h4>Category: ${category}</h4><table><thead><tr><th>Size</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>`;

        selectedItemsByCategory[category].forEach(item => {
          htmlSummary += `<tr><td>${item.size}</td><td>${item.quantity}</td><td>₹${item.price}</td><td>₹${item.lineTotal.toFixed(2)}</td></tr>`;
        });

        htmlSummary += `</tbody></table>`;
      }
    });

    htmlSummary += `<p><strong>Total Items:</strong> ${totalItems}</p>`;
    htmlSummary += `<p><strong>Overall Total:</strong> ₹${totalPrice.toFixed(2)}</p>`;

    whatsappButton.style.display = 'block';
  } else {
    htmlSummary = '<p>Order ke liye koi item select nahi kiya gaya hai. Kripya quantity daalein.</p>';
    whatsappButton.style.display = 'none';
  }

  orderSummaryOutput.innerHTML = htmlSummary;

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
  if (!filteredProduct || !summaries.selectedItems || Object.keys(summaries.selectedItems).length === 0) {
    alert("Kripya product (Type aur Color) select karein aur quantities daalein, phir order bhejein.");
    return;
  }
  const customerName = document.getElementById('customerName').value.trim();
  const address = document.getElementById('deliveryAddress').value.trim();
  const contact = document.getElementById('contactNumber').value.trim();
  if (!customerName || !contact || !address) {
    alert("Kripya Customer Ka Naam, Address, aur Contact Number bharein, phir order bhejein.");
    return;
  }
  const mobileRegex = /^\d{10}$/;
  if (!mobileRegex.test(contact)) {
    alert("Kripya sahi 10-digit ka contact number daalein.");
    return;
  }
  let whatsappMessage = `Namaste! Main ek group order dena chahta hoon:\n\n`;
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
  whatsappMessage += `*Poora Total: ₹${summaries.totalPrice}* `;
  whatsappMessage += `\n\n👥 *Customer Ka Naam:* ${customerName} \n🏠 *Address:* ${address} \n📞 *Contact:* ${contact} \n🗓️ *Tarikh: ${new Date().toLocaleDateString("en-IN")}`;
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
        alert("Kripya PDF banane se pehle saari customer details bharein.");
        return;
    }
    if (!filteredProduct || !summaries.selectedItems || Object.keys(summaries.selectedItems).length === 0) {
        alert("Kripya PDF banane ke liye product select karein aur quantities daalein.");
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
                doc.text(`Size: ${item.size} - Qty: ${item.quantity} - Price: ₹${item.price} - Total: ₹${item.lineTotal}`, 15, y);
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
    doc.text(`Overall Total: ₹${summaries.totalPrice}`, 10, y);
    y += 7;
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
