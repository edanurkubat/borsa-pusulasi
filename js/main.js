/* js/main.js — Başlangıç */

document.addEventListener("DOMContentLoaded", () => {
  showTableSkeleton();
  initData();
  initChartHover();
  window.addEventListener("resize", drawChart);

  document.querySelectorAll(".tftab").forEach((btn) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".tftab").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const tf = TF_MAP[this.textContent.trim()];
      if (tf) {
        activeInterval = tf.interval;
        activeLimit = tf.limit;
        fetchCandleForActive(tf.interval, tf.limit);
      }
    });
  });

  document.querySelectorAll(".type-btn").forEach((btn, i) => {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".type-btn").forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const types = ["limit", "market", "oco"];
      orderType = types[i];
      handleOrderTypeChange(orderType);
    });
  });
});