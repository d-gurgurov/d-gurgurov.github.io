document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("two-sum-vis");

    // Sample data
    const nums = [2, 7, 11, 15, 8];
    const target = 10;

    // Create display elements
    const arrayContainer = document.createElement("div");
    arrayContainer.style.display = "flex";
    arrayContainer.style.gap = "10px";
    arrayContainer.style.marginBottom = "20px";

    const status = document.createElement("div");
    const mapDisplay = document.createElement("pre");
    mapDisplay.style.background = "#f4f4f4";
    mapDisplay.style.padding = "10px";

    // Add to container
    container.appendChild(arrayContainer);
    container.appendChild(status);
    container.appendChild(mapDisplay);

    const delay = ms => new Promise(res => setTimeout(res, ms));

    async function visualizeTwoSum(nums, target) {
        const map = {};
        arrayContainer.innerHTML = "";
        status.textContent = "";
        mapDisplay.textContent = "";

        // Create UI elements
        const boxes = nums.map(num => {
            const box = document.createElement("div");
            box.textContent = num;
            box.style.padding = "10px 15px";
            box.style.border = "2px solid #333";
            box.style.borderRadius = "5px";
            box.style.fontSize = "18px";
            box.style.transition = "0.3s";
            arrayContainer.appendChild(box);
            return box;
        });

        for (let i = 0; i < nums.length; i++) {
            boxes[i].style.background = "#ffeb3b"; // highlight
            status.textContent = `Checking index ${i} (value = ${nums[i]})...`;
            await delay(1000);

            const diff = target - nums[i];
            if (map.hasOwnProperty(diff)) {
                boxes[i].style.background = "#8bc34a";
                boxes[map[diff]].style.background = "#8bc34a";
                status.textContent = `Found: ${nums[i]} + ${diff} = ${target} at indices [${map[diff]}, ${i}]`;
                return;
            }

            map[nums[i]] = i;
            mapDisplay.textContent = JSON.stringify(map, null, 2);
            boxes[i].style.background = "#ccc";
        }

        status.textContent = "No solution found.";
    }

    visualizeTwoSum(nums, target);
});
