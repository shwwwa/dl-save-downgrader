let selectedFile = null;
let detectedMode = null;

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const status = document.getElementById("status");
const detectedText = document.getElementById("detected");

dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
    handleFile(e.target.files[0]);
});

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    handleFile(e.dataTransfer.files[0]);
});

function isValidGzip(data) {
    return data[0] === 0x1f && data[1] === 0x8b;
}

function handleFile(file) {
    selectedFile = file;
    status.textContent = `Selected: ${file.name}`;
    detectVersion(file);
}

function detectVersion(file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const compressed = new Uint8Array(e.target.result);

            if (!isValidGzip(compressed)) {
                status.textContent = "Invalid .sav file.";
                return;
            }

            let decompressed = pako.ungzip(compressed);

            let hasC = false;
            let hasB = false;

            for (let i = 0; i <= 0x30; i++) {
                if (decompressed[i] === 0x43) hasC = true;
                if (decompressed[i] === 0x42) hasB = true;
            }

            const radios = document.querySelectorAll('input[name="mode"]');
            radios.forEach(r => {
                r.disabled = true;
                r.checked = false;
            });

            if (hasC && !hasB) {
                detectedMode = "downgrade";
                enableMode("downgrade");
                detectedText.textContent = "Detected: 1.51+";
            } 
            else if (hasB && !hasC) {
                detectedMode = "restore";
                enableMode("restore");
                detectedText.textContent = "Detected: 1.47";
            } 
            else {
                detectedMode = null;
                detectedText.textContent = "Unknown version. Cannot convert.";
                status.textContent = "Cannot determine file version.";
            }

        } catch {
            status.textContent = "Failed to read file.";
        }
    };

    reader.readAsArrayBuffer(file);
}

function enableMode(mode) {
    const radio = document.querySelector(`input[value="${mode}"]`);
    radio.disabled = false;
    radio.checked = true;
}

function processFile() {
    if (!selectedFile) {
        status.textContent = "❌ No file selected.";
        return;
    }

    if (!detectedMode) {
        status.textContent = "❌ Conversion blocked (unknown version).";
        return;
    }

    status.textContent = "Processing...";

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const compressed = new Uint8Array(e.target.result);
            let decompressed = pako.ungzip(compressed);

            let changes = 0;

            for (let i = 0; i <= 0x30; i++) {
                if (detectedMode === "downgrade" && decompressed[i] === 0x43) {
                    decompressed[i] = 0x42;
                    changes++;
                } else if (detectedMode === "restore" && decompressed[i] === 0x42) {
                    decompressed[i] = 0x43;
                    changes++;
                }
            }

            const recompressed = pako.gzip(decompressed);

            const blob = new Blob([recompressed], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;

            const suffix = detectedMode === "downgrade" ? "_downgraded" : "_restored";
            a.download = selectedFile.name.replace(".sav", `${suffix}.sav`);
            a.click();

            status.textContent = `✅ Done! ${changes} bytes modified.`;

        } catch (err) {
            console.error(err);
            status.textContent = "❌ Error during processing.";
        }
    };

    reader.readAsArrayBuffer(selectedFile);
}
