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

            let decompressed = pako.ungzip(compressed);

            for (let i = 0; i <= 0x30; i++) {
                if (decompressed[i] === 0x43) {
                    decompressed[i] = 0x42;
                }
            }

            const recompressed = pako.gzip(decompressed);

            const blob = new Blob([recompressed], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = selectedFile.name;
            a.click();

            status.textContent = "Done! File downloaded.";

        } catch (err) {
            console.error(err);
            status.textContent = "Error processing file.";
        }
    };

    reader.readAsArrayBuffer(selectedFile);
}
