document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("best-stock-vis");

    // Example stock prices
    const prices = [7, 1, 5, 3, 6, 4];

    const chart = document.createElement("div");
    chart.style.display = "flex";
    chart.style.alignItems = "flex-end";
    chart.style.height = "200px";
    chart.style.gap = "10px";
    chart.style.marginBottom = "20px";

    const status = document.createElement("div");

    container.appendChild(chart);
    container.appendChild(status);

    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function visualizeStock(prices) {
        chart.innerHTML = "";
        status.textContent = "";

        const bars = prices.map(price => {
            const bar = document.createElement("div");
            bar.style.height = (price * 3) + "px";
            bar.style.width = "30px";
            bar.style.background = "#90caf9";
            bar.style.position = "relative";
            bar.innerHTML = `<span style="position:absolute;top:-20px;width:100%;text-align:center;font-size:14px;">${price}</span>`;
            chart.appendChild(bar);
            return bar;
        });

        let minPrice = prices[0];
        let minIndex = 0;
        let maxProfit = 0;
        let buyIndex = 0, sellIndex = 0;

        for (let i = 1; i < prices.length; i++) {
            bars[i].style.background = "#ffeb3b"; // Current day
            bars[minIndex].style.background = "#4caf50"; // Buy day

            await delay(1000);

            if (prices[i] - minPrice > maxProfit) {
                maxProfit = prices[i] - minPrice;
                buyIndex = minIndex;
                sellIndex = i;
                status.textContent = `New max profit: ${maxProfit} (buy at day ${buyIndex}, sell at day ${sellIndex})`;
            }

            if (prices[i] < minPrice) {
                minPrice = prices[i];
                minIndex = i;
                status.textContent = `New min price found: ${minPrice} at day ${minIndex}`;
            }

            // Reset colors
            bars[i].style.background = "#90caf9";
            bars[minIndex].style.background = "#90caf9";
        }

        // Final highlight
        bars[buyIndex].style.background = "#4caf50"; // green
        bars[sellIndex].style.background = "#f44336"; // red
        status.textContent = `Buy on day ${buyIndex} ($${prices[buyIndex]}), Sell on day ${sellIndex} ($${prices[sellIndex]}) → Max profit = ${maxProfit}`;
    }

    visualizeStock(prices);
});
