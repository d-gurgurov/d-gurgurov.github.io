document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("best-stock-vis");

    // Sample stock prices
    const prices = [7, 1, 5, 3, 6, 4];

    // Display containers
    const arrayContainer = document.createElement("div");
    arrayContainer.style.display = "flex";
    arrayContainer.style.gap = "10px";
    arrayContainer.style.marginBottom = "20px";

    const status = document.createElement("div");
    const profitDisplay = document.createElement("pre");
    profitDisplay.style.background = "#f4f4f4";
    profitDisplay.style.padding = "10px";

    container.appendChild(arrayContainer);
    container.appendChild(status);
    container.appendChild(profitDisplay);

    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function visualizeBestTime(prices) {
        arrayContainer.innerHTML = "";
        status.textContent = "";
        profitDisplay.textContent = "";

        const boxes = prices.map((price, i) => {
            const box = document.createElement("div");
            box.textContent = price;
            box.style.padding = "10px 15px";
            box.style.border = "2px solid #333";
            box.style.borderRadius = "5px";
            box.style.fontSize = "18px";
            box.style.transition = "0.3s";
            arrayContainer.appendChild(box);
            return box;
        });

        let minPrice = prices[0];
        let minIndex = 0;
        let maxProfit = 0;
        let buyIndex = 0, sellIndex = 0;

        for (let i = 1; i < prices.length; i++) {
            boxes[i].style.background = "#ffeb3b"; // highlight current price
            boxes[minIndex].style.background = "#4caf50"; // current min price (buy)

            status.textContent = `Day ${i}: Current price = ${prices[i]}, Min price = ${minPrice}`;

            await delay(1000);

            const profit = prices[i] - minPrice;
            if (profit > maxProfit) {
                maxProfit = profit;
                buyIndex = minIndex;
                sellIndex = i;
                status.textContent = `New max profit ${maxProfit} (Buy at day ${buyIndex}, Sell at day ${sellIndex})`;
            }

            if (prices[i] < minPrice) {
                minPrice = prices[i];
                minIndex = i;
                status.textContent = `New min price found: ${minPrice} at day ${minIndex}`;
            }

            profitDisplay.textContent = `Current Max Profit: ${maxProfit}\nBuy at Day ${buyIndex} ($${prices[buyIndex]})\nSell at Day ${sellIndex} ($${prices[sellIndex]})`;

            // Reset styles
            boxes[i].style.background = "#ccc";
            boxes[minIndex].style.background = "#ccc";
        }

        // Final highlight
        boxes[buyIndex].style.background = "#4caf50"; // green = buy
        boxes[sellIndex].style.background = "#f44336"; // red = sell
        status.textContent = `Done. Max profit = ${maxProfit} (Buy on day ${buyIndex}, Sell on day ${sellIndex})`;
    }

    visualizeBestTime(prices);
});
