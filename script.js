let selectedFile = null;

const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const status = document.getElementById("status");

dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
    selectedFile = e.target.files[0];
    status.textContent = `Selected: ${selectedFile.name}`;
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

    selectedFile = e.dataTransfer.files[0];
    status.textContent = `Selected: ${selectedFile.name}`;
});

function isValidGzip(data) {
    return data[0] === 0x1f && data[1] === 0x8b;
}

function getMode() {
    return document.querySelector('input[name="mode"]:checked').value;
}

function processFile() {
    if (!selectedFile) {
        status.textContent = "Please select a file.";
        return;
    }

    status.textContent = "Processing...";

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const compressed = new Uint8Array(e.target.result);

            if (!isValidGzip(compressed)) {
                status.textContent = "❌ Invalid .sav file (not gzip).";
                return;
            }

            let decompressed;
            try {
                decompressed = pako.ungzip(compressed);
            } catch {
                status.textContent = "❌ Failed to decompress file.";
                return;
            }

            if (decompressed.length < 0x31) {
                status.textContent = "❌ File too small / corrupted.";
                return;
            }

            const mode = getMode();
            let changes = 0;

            for (let i = 0; i <= 0x30; i++) {
                if (mode === "downgrade" && decompressed[i] === 0x43) {
                    decompressed[i] = 0x42;
                    changes++;
                } else if (mode === "restore" && decompressed[i] === 0x42) {
                    decompressed[i] = 0x43;
                    changes++;
                }
            }

            if (changes === 0) {
                status.textContent = "No matching bytes found. File may already be in target version.";
                return;
            }

            const recompressed = pako.gzip(decompressed);

            const blob = new Blob([recompressed], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;

            a.download = selectedFile.name;
            a.click();

            status.textContent = `Done! ${changes} bytes modified.`;

        } catch (err) {
            console.error(err);
            status.textContent = "Unexpected error.";
        }
    };

    reader.readAsArrayBuffer(selectedFile);
}
