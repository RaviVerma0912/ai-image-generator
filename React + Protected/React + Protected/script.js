const themeToggleButton = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const generateBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");

const API_KEY = "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";

const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
    "A cosmic beach with glowing sand and an aurora in the night sky",
    "A medieval marketplace with colorful tents and street performers",
    "A cyberpunk city with neon signs and flying cars at night",
    "A peaceful bamboo forest with a hidden ancient temple",
    "A giant turtle carrying a village on its back in the ocean",
];

// Set theme on saved preference or system default
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggleButton.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);

    // Ensure dimensions are multiples of 16 (AI model requirement)
    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;
    return { width: calculatedWidth, height: calculatedHeight };
};

const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if (!imgCard) return; // Ensure the card exists before updating

    imgCard.classList.remove("loading");
    imgCard.innerHTML = `
        <img src="${imgUrl}" class="result-img" />
        <div class="img-overlay">
            <a href="${imgUrl}" class="img-download-btn" download="generated-image-${imgIndex}.png">
                <i class="fa-solid fa-download"></i>
            </a>
        </div>`;
};

const generateimages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL = `https://router.huggingface.co/hf-inference/models/${selectedModel}`;
    const { width, height } = getImageDimensions(aspectRatio);
    generateBtn.setAttribute("disabled", "true"); // Disable the button to prevent multiple submissions

    const imagePromises = Array.from({ length: imageCount }, (_, i) => {
        return (async () => {
            try {
                const response = await fetch(MODEL_URL, {
                    headers: {
                        Authorization: `Bearer ${API_KEY}`,
                        "Content-Type": "application/json",
                        "x-use-cache": "false",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        inputs: promptText,
                        parameters: { width, height },
                        options: { wait_for_model: true, use_cache: false },
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData?.error || "Unknown error");
                }

                const result = await response.blob();
                updateImageCard(i, URL.createObjectURL(result));
            } catch (error) {
                console.error(`Error generating image ${i}:`, error.message);
                const imgCard = document.getElementById(`img-card-${i}`);
                if (imgCard) {
                    imgCard.classList.remove("loading");
                    imgCard.classList.add("error");
                    imgCard.innerHTML = `
                        <div class="status-container">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <p class="status-text">Failed to generate image</p>
                        </div>`;
                }
            }
        })();
    });

    await Promise.allSettled(imagePromises); // Ensure all promises are awaited
    generateBtn.removeAttribute("disabled",);
};

// Create placeholder cards with loading spinners
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = "";

    for (let i = 0; i < imageCount; i++) {
        gridGallery.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio};">
            <div class="status-container">
                <div class="spinner"></div>
                <p class="status-text">Generating...</p>
            </div>
        </div>`;
    }

    generateimages(selectedModel, imageCount, aspectRatio, promptText);
};

// Handle form submission
const handleFormSubmit = (e) => {
    e.preventDefault();

    // Get the values from the form
    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();

    if (!/^\d+\/\d+$/.test(aspectRatio)) {
        alert("Invalid aspect ratio. Please select a valid option.");
        return;
    }

    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

// Attach the form submission handler
promptForm.addEventListener("submit", handleFormSubmit);

// Switch theme on button click
const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggleButton.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// Fill prompt input with random example on button click
promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
});

themeToggleButton.addEventListener("click", toggleTheme);