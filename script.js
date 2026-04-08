function processFile() {
    const input = document.getElementById("fileInput");
    const status = document.getElementById("status");

    if (!input.files.length) {
        status.textContent = "Please select a file";
        return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const compressed = new Uint8Array(e.target.result);
            let decompressed = pako.ungzip(compressed);

            for (let i = 0; i <= 0x30; i++) {
                if (decompressed[i] === 0x43) { // 'C'
                    decompressed[i] = 0x42;     // 'B'
                }
            }

            const recompressed = pako.gzip(decompressed);

            const blob = new Blob([recompressed], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.click();

            status.textContent = "Done! File downloaded.";

        } catch (err) {
            console.error(err);
            status.textContent = "Error processing file.";
        }
    };

    reader.readAsArrayBuffer(file);
}
