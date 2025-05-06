document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("number-of-1-bits-vis");

    const inputNumber = 29; // example number

    // UI containers
    const divisionSteps = document.createElement("div");
    divisionSteps.style.display = "flex";
    divisionSteps.style.flexDirection = "column";
    divisionSteps.style.gap = "8px";
    divisionSteps.style.marginBottom = "20px";

    const binaryDisplay = document.createElement("div");
    binaryDisplay.style.display = "flex";
    binaryDisplay.style.gap = "10px";
    binaryDisplay.style.marginTop = "10px";

    const status = document.createElement("div");

    container.appendChild(divisionSteps);
    container.appendChild(status);
    container.appendChild(binaryDisplay);

    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function visualizeNumberOf1Bits(n) {
        status.textContent = `Converting number ${n} to binary using division...`;

        let bits = [];
        let step = 0;
        let current = n;

        while (current > 0) {
            const quotient = Math.floor(current / 2);
            const remainder = current % 2;

            const stepRow = document.createElement("div");
            stepRow.style.display = "flex";
            stepRow.style.gap = "10px";
            stepRow.innerHTML = `
                <div style="padding: 6px 10px; border: 2px solid #333; border-radius: 5px;">${current}</div>
                <div style="padding: 6px 10px; border: 2px solid #333; border-radius: 5px;">Quotient: ${quotient}</div>
                <div style="padding: 6px 10px; border: 2px solid #333; border-radius: 5px; background:#ffeb3b;">Remainder (Bit): ${remainder}</div>
            `;

            divisionSteps.appendChild(stepRow);

            const bitBox = document.createElement("div");
            bitBox.textContent = remainder;
            bitBox.style.padding = "10px 15px";
            bitBox.style.border = "2px solid #333";
            bitBox.style.borderRadius = "5px";
            bitBox.style.fontSize = "18px";
            bitBox.style.background = "#ccc";
            binaryDisplay.insertBefore(bitBox, binaryDisplay.firstChild); // reverse order

            bits.push(remainder);
            current = quotient;
            step++;

            await delay(800);
        }

        const oneCount = bits.filter(b => b === 1).length;
        status.textContent = `Done. Binary of ${n} is ${bits.reverse().join('')} → Number of 1s: ${oneCount}`;
    }

    visualizeNumberOf1Bits(inputNumber);
});
