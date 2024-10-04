const industryCards = document.getElementById("industry-cards");
const templatesAndUpload = document.querySelector(".templates-and-upload");
const imageTemplates = document.getElementById("image-templates");
const selectedIndustryTitle = document.getElementById("selected-industry");
const uploadInput = document.getElementById("upload");
const uploadBtn = document.getElementById("upload-btn");
const loadingIndicator = document.querySelector(".loading");
const resultTable = document.getElementById("result-table");
const saveJsonBtn = document.getElementById("save-json-btn");
const errorMessageDiv = document.getElementById("error-message");

const industries = await fetch("config.json").then((res) => res.json());

// Generate industry cards
Object.entries(industries).forEach(([industry, data]) => {
  industryCards.insertAdjacentHTML(
    "beforeend",
    /* html */ `
    <div class="col-md-4 mb-4">
      <div class="card h-100" data-industry="${industry}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${data.title}</h5>
          <p class="card-text flex-grow-1">${data.context}</p>
          <button class="btn btn-primary explore-btn mt-auto">Explore</button>
        </div>
      </div>
    </div>
  `
  );
});

// Add click event listeners to explore buttons
document.querySelectorAll(".explore-btn").forEach((button) => {
  button.addEventListener("click", (event) => {
    const industry = event.target.closest(".card").getAttribute("data-industry");
    showTemplates(industry);
  });
});

function showTemplates(industry) {
  selectedIndustryTitle.textContent = industries[industry].title;
  imageTemplates.innerHTML = industries[industry].templates
    .map(
      (template) => /* html */ `
    <div class="col-md-4 mb-3">
      <div class="card h-100">
        <img src="${template.url}" class="card-img-top template-image" style="cursor: pointer; object-fit: cover; height: 200px;" data-url="${template.url}">
        <div class="card-body">
          <p class="card-text">${template.description}</p>
        </div>
      </div>
    </div>`
    )
    .join("");
  templatesAndUpload.style.display = "block";
}

// Move the event listener outside of showTemplates
imageTemplates.addEventListener("click", async (event) => {
  if (event.target.classList.contains("template-image")) {
    const response = await fetch(event.target.dataset.url);
    processImageFile(await response.blob());
  }
});

uploadInput.addEventListener(
  "change",
  (event) => (uploadBtn.style.display = event.target.files[0] ? "inline-block" : "none")
);

uploadBtn.addEventListener("click", async () => {
  if (uploadInput.files[0]) processImageFile(uploadInput.files[0]);
});

function processImageFile(file) {
  loadingIndicator.style.display = "block";
  const reader = new FileReader();
  reader.onload = async () => await sendImageToLLM(reader.result.split(",")[1]);
  reader.readAsDataURL(file);
}

async function sendImageToLLM(base64Image) {
  try {
    const response = await fetch("https://llmfoundry.straive.com/openai/v1/chat/completions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Extract information from this image and return it as a flat JSON object with values as scalars.",
          },
          {
            role: "user",
            content: [{ type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } }],
          },
        ],
      }),
    });
    const result = await response.json();
    loadingIndicator.style.display = "none";
    if (result.choices && result.choices[0] && result.choices[0].message) {
      displayResult(result.choices[0].message.content);
    } else {
      displayError("Unexpected response format: " + JSON.stringify(result));
    }
  } catch (error) {
    loadingIndicator.style.display = "none";
    displayError("Error processing image: " + error.message);
  }
}

function displayResult(content) {
  errorMessageDiv.style.display = "none";
  resultTable.innerHTML = "";

  try {
    let data = parseContent(content);
    renderJsonTable(data, resultTable);
    saveJsonBtn.style.display = "inline-block";
    saveJsonBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      a.download = "image-details.json";
      a.click();
      URL.revokeObjectURL(url);
    };
  } catch (error) {
    console.error("Error displaying result:", error);
    displayError("Unable to parse the result. Please try uploading a different image or selecting another template.");
  }
}

function parseContent(content) {
  try {
    return JSON.parse(content);
  } catch (jsonError) {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error("Unable to parse JSON from content");
  }
}

function renderJsonTable(data, table) {
  Object.entries(data).forEach(([key, value]) => {
    const row = table.insertRow();
    row.insertCell(0).textContent = key;

    if (typeof value === "object" && value !== null) {
      const nestedTable = document.createElement("table");
      nestedTable.className = "table table-bordered table-sm";
      renderJsonTable(value, nestedTable);
      row.insertCell(1).appendChild(nestedTable);
    } else {
      row.insertCell(1).textContent = value;
    }
  });
}

function displayError(message) {
  errorMessageDiv.textContent = message;
  errorMessageDiv.style.display = "block";
  resultTable.innerHTML = ""; // Clear any previous results
  saveJsonBtn.style.display = "none"; // Hide the save button
  // Scroll to the error message to ensure it's visible
  errorMessageDiv.scrollIntoView({ behavior: "smooth", block: "center" });
}
