// Main application logic for KKU WiFi & EDR Security Scorecard Dashboard

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // State Management
  let currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
  let activeGradeFilter = "all";
  let activeSearchQuery = "";
  
  // Charts & Map instances
  let trendChartInstance = null;
  let radarChartInstance = null;
  let mapInstance = null;
  let tileLayerInstance = null;
  let markersGroup = null;

  // Cache DOM Elements
  const categoriesContainer = document.getElementById("categories-container");
  const facultyTableBody = document.getElementById("faculty-table-body");
  const facultySearch = document.getElementById("faculty-search");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const overallRecommendationsList = document.getElementById("overall-recommendations-list");
  
  // Modal Elements
  const detailModal = document.getElementById("detail-modal");
  const modalBox = document.getElementById("modal-box");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const btnCloseModalFooter = document.getElementById("btn-modal-close-footer");
  const btnModalResolve = document.getElementById("btn-modal-resolve");

  // Modal Tab Elements
  const tabIssuesBtn = document.getElementById("tab-issues-btn");
  const tabAssetsBtn = document.getElementById("tab-assets-btn");
  const modalTabIssues = document.getElementById("modal-tab-issues");
  const modalTabAssets = document.getElementById("modal-tab-assets");
  const modalTabsNav = document.getElementById("modal-tabs-nav");
  const modalAssetList = document.getElementById("modal-asset-list");
  
  // Theme Toggle Elements
  const btnThemeToggle = document.getElementById("btn-theme-toggle");

  // Notifications Elements
  const btnNotif = document.getElementById("btn-notif");
  const notifDropdown = document.getElementById("notif-dropdown");
  const notifListContainer = document.getElementById("notif-list-container");
  const notifCount = document.getElementById("notif-count");
  const notifBadge = document.getElementById("notif-badge");

  // Scanner Elements
  const btnScan = document.getElementById("btn-scan");
  const scanIcon = document.getElementById("scan-icon");
  const scanBtnText = document.getElementById("scan-btn-text");
  const toastScan = document.getElementById("toast-scan");
  const lastScannedSidebar = document.getElementById("last-scanned-sidebar");
  const lastScannedMain = document.getElementById("last-scanned-main");
  const btnExport = document.getElementById("btn-export");

  // Mobile Menu Elements
  const btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
  const mobileSidebar = document.getElementById("mobile-sidebar");
  const mobileSidebarContent = document.getElementById("mobile-sidebar-content");
  const btnCloseSidebar = document.getElementById("btn-close-sidebar");
  const mobileNav = document.getElementById("mobile-nav");
  const mobileScanWidget = document.getElementById("mobile-scan-widget");

  // Copy sidebar items to mobile
  const sidebarNavItems = document.querySelector("#sidebar nav").innerHTML;
  mobileNav.innerHTML = sidebarNavItems;
  mobileScanWidget.innerHTML = document.querySelector("#sidebar .p-6:last-child").innerHTML;

  // Bind mobile scan button event after clone
  const btnScanMobile = mobileScanWidget.querySelector("#btn-scan");
  if (btnScanMobile) {
    btnScanMobile.addEventListener("click", () => triggerScanAnimation());
  }

  // Set initial scan times
  updateScanTimestamps(SECURITY_MOCK_DATA.overallScore.lastScanned);

  // Load Initial Layout, Charts & Map
  renderDashboard();

  // ดึงข้อมูลจริงจาก local proxy server (หากผู้ใช้งานเปิดรัน Node.js server.js)
  fetch("/api/scorecard?domain=kku.ac.th")
    .then(res => res.json())
    .then(apiData => {
      if (apiData.source === 'real_api') {
        // อัปเดตข้อมูลคะแนนภาพรวมจริงลงในตัวแปรหลัก
        SECURITY_MOCK_DATA.overallScore.score = apiData.score;
        SECURITY_MOCK_DATA.overallScore.grade = apiData.grade;
        
        // แมปคะแนนรายด้านจริง (Network, Patch, App, DNS)
        apiData.categories.forEach(apiCat => {
          const matchCat = SECURITY_MOCK_DATA.categories.find(c => c.id === apiCat.id);
          if (matchCat) {
            matchCat.score = apiCat.score;
            matchCat.grade = apiCat.grade;
          }
        });
        
        // อัปเดตการเรนเดอร์แดชบอร์ดใหม่ทั้งหมด
        renderDashboard();
        
        // แสดง Toast แจ้งเตือนความสำเร็จ
        showToast("เชื่อมต่อข้อมูลจริงสำเร็จ", "อัปเดตสถิติจริงของ kku.ac.th จาก SecurityScorecard API แล้ว", "emerald");
      }
    })
    .catch(err => {
      console.log("Mock Mode Active: รันผ่าน Local Static File (ไม่ได้สตาร์ท Node server.js)");
    });

  // Define global function for Map Popups to call
  window.triggerFacultyModalFromMap = (facId) => {
    const fac = SECURITY_MOCK_DATA.faculties.find(f => f.id === facId);
    if (fac) {
      openFacultyModal(fac);
    }
  };

  // ================= THEME HANDLER =================
  btnThemeToggle.addEventListener("click", () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      currentTheme = "light";
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      currentTheme = "dark";
    }
    // Redraw charts & map with correct theme colors
    initCharts();
    initMap();
  });

  // ================= SCAN INFRASTRUCTURE MOCK =================
  btnScan.addEventListener("click", () => {
    triggerScanAnimation();
  });

  function triggerScanAnimation() {
    // Disable scan buttons
    btnScan.disabled = true;
    if (btnScanMobile) btnScanMobile.disabled = true;

    // Show Scan banner
    toastScan.classList.remove("hidden");
    toastScan.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Animate scan icon
    scanIcon.classList.add("animate-spin");
    scanBtnText.innerText = "กำลังสแกนวิเคราะห์...";

    let progress = 0;
    const progressSpan = toastScan.querySelector("span:last-child");
    const interval = setInterval(() => {
      progress += 20;
      progressSpan.innerText = `${progress}%`;
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Hide Scan banner
        toastScan.classList.add("hidden");
        
        // Reset button
        scanIcon.classList.remove("animate-spin");
        scanBtnText.innerText = "สแกนระบบอีกครั้ง";
        btnScan.disabled = false;
        if (btnScanMobile) {
          btnScanMobile.disabled = false;
          btnScanMobile.querySelector("#scan-icon").classList.remove("animate-spin");
          btnScanMobile.querySelector("#scan-btn-text").innerText = "สแกนระบบอีกครั้ง";
        }

        // Update Scan Timestamps
        const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        updateScanTimestamps(nowStr);

        // Slightly adjust mock scores to show data update
        SECURITY_MOCK_DATA.overallScore.score = 80; // +1 point improvement
        SECURITY_MOCK_DATA.overallScore.grade = "B";
        SECURITY_MOCK_DATA.faculties.find(f => f.id === 'sci').score = 86; // Sci improvement
        SECURITY_MOCK_DATA.faculties.find(f => f.id === 'sci').edrInstallRate = 90; // EDR installed on more machines
        SECURITY_MOCK_DATA.categories.find(c => c.id === 'network').score = 83; // Network improvement

        // Re-render
        renderDashboard();

        // Show completed toast
        showToast("ตรวจวิเคราะห์ความปลอดภัยเสร็จสิ้น", "สแกน WiFi & EDR มข. สำเร็จและปรับคะแนนล่าสุดให้แล้ว (+1 คะแนนรวมดีขึ้น)", "emerald");
      }
    }, 500);
  }

  function updateScanTimestamps(timeStr) {
    const formatted = timeStr;
    lastScannedMain.innerText = formatted;
    lastScannedSidebar.innerText = `สแกนล่าสุด: ${formatted}`;
    
    // Update inside mobile widget if cloned
    const mobileLastScanned = mobileScanWidget.querySelector("#last-scanned-sidebar");
    if (mobileLastScanned) {
      mobileLastScanned.innerText = `สแกนล่าสุด: ${formatted}`;
    }
  }

  // ================= MAIN RENDERING FUNCTION =================
  function renderDashboard() {
    renderOverallScore();
    renderCategories();
    renderFacultyTable();
    renderOverallRecommendations();
    renderNotifications();
    initCharts();
    initMap();
    lucide.createIcons();
  }

  // Overall Score Circular Gauge
  function renderOverallScore() {
    const overall = SECURITY_MOCK_DATA.overallScore;
    
    // Display elements
    document.getElementById("grade-display").innerText = overall.grade;
    document.getElementById("score-display").innerText = `${overall.score} / 100`;
    document.getElementById("stat-total-devices").innerText = `${overall.totalDevices.toLocaleString()} เครื่อง`;
    document.getElementById("stat-active-alerts").innerText = `${overall.activeAlerts} รายการ`;

    // Map color classes
    const gradeLabel = document.getElementById("grade-label");
    if (overall.score >= 90) {
      gradeLabel.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i> ปลอดภัยสูง (Low Risk)`;
      gradeLabel.className = "mt-2 text-xs font-extrabold text-emerald-500 flex items-center gap-1.5 uppercase";
    } else if (overall.score >= 70) {
      gradeLabel.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 text-amber-500"></i> ความเสี่ยงปานกลาง (Medium Risk)`;
      gradeLabel.className = "mt-2 text-xs font-extrabold text-amber-500 flex items-center gap-1.5 uppercase";
    } else {
      gradeLabel.innerHTML = `<i data-lucide="shield-alert" class="w-4 h-4 text-rose-500"></i> ความเสี่ยงสูงวิกฤต (High Risk)`;
      gradeLabel.className = "mt-2 text-xs font-extrabold text-rose-500 flex items-center gap-1.5 uppercase";
    }

    // Set SVG path dashoffset
    const progressRing = document.getElementById("gauge-progress");
    const radius = progressRing.r.baseVal.value;
    const circumference = 2 * Math.PI * radius; // 2 * PI * 60 approx 377
    const offset = circumference - (overall.score / 100) * circumference;
    progressRing.style.strokeDasharray = `${circumference} ${circumference}`;
    progressRing.style.strokeDashoffset = offset;
  }

  // Render 4 Main Pillars
  function renderCategories() {
    categoriesContainer.innerHTML = "";
    
    SECURITY_MOCK_DATA.categories.forEach(cat => {
      let colorClass = "emerald";
      let textClass = "text-emerald-500";
      let bgClass = "bg-emerald-500/10";
      let borderClass = "border-emerald-500/20";

      if (cat.score >= 90) {
        colorClass = "emerald";
        textClass = "text-emerald-500";
        bgClass = "bg-emerald-500/10";
        borderClass = "border-emerald-500/20";
      } else if (cat.score >= 80) {
        colorClass = "teal";
        textClass = "text-teal-500";
        bgClass = "bg-teal-500/10";
        borderClass = "border-teal-500/20";
      } else if (cat.score >= 70) {
        colorClass = "amber";
        textClass = "text-amber-500";
        bgClass = "bg-amber-500/10";
        borderClass = "border-amber-500/20";
      } else {
        colorClass = "rose";
        textClass = "text-rose-500";
        bgClass = "bg-rose-500/10";
        borderClass = "border-rose-500/20";
      }

      const card = document.createElement("div");
      card.className = `metric-card cursor-pointer hover-scale hover-shadow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-4 hover:border-${colorClass}-500/30 dark:hover:border-${colorClass}-500/40`;
      
      // Indicators summary list
      let indicatorHtml = "";
      cat.indicators.forEach(ind => {
        let statusIcon = `<i data-lucide="check" class="w-3.5 h-3.5 text-emerald-500"></i>`;
        if (ind.status === "warning") {
          statusIcon = `<i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-500"></i>`;
        } else if (ind.status === "fail") {
          statusIcon = `<i data-lucide="x" class="w-3.5 h-3.5 text-rose-500"></i>`;
        }
        
        indicatorHtml += `
          <div class="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span class="mt-0.5">${statusIcon}</span>
            <span class="truncate" title="${ind.name}: ${ind.detail}">${ind.name}</span>
          </div>
        `;
      });

      card.innerHTML = `
        <div class="space-y-3">
          <!-- Card Header -->
          <div class="flex items-center justify-between">
            <div class="${bgClass} ${textClass} p-2 rounded-xl border ${borderClass}">
              <i data-lucide="${cat.icon}" class="w-5 h-5"></i>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-400 dark:text-slate-500">${cat.status}</span>
              <span class="text-sm font-extrabold ${bgClass} ${textClass} px-2 py-0.5 rounded-lg border ${borderClass}">${cat.grade}</span>
            </div>
          </div>
          
          <!-- Score Info -->
          <div>
            <h4 class="font-extrabold text-sm dark:text-white line-clamp-1">${cat.name.split(" (")[0]}</h4>
            <div class="flex items-baseline gap-1 mt-1">
              <span class="text-2xl font-black dark:text-white">${cat.score}</span>
              <span class="text-xs font-semibold text-slate-400">/100</span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
            <div class="h-1.5 rounded-full ${cat.score >= 90 ? 'bg-emerald-500' : cat.score >= 80 ? 'bg-teal-500' : cat.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'}" style="width: ${cat.score}%"></div>
          </div>
        </div>

        <hr class="border-slate-100 dark:border-slate-800">

        <!-- Indicators -->
        <div class="space-y-2">
          ${indicatorHtml}
        </div>
      `;

      card.addEventListener("click", () => openCategoryModal(cat));
      categoriesContainer.appendChild(card);
    });
  }

  // Render Faculty Data Table
  function renderFacultyTable() {
    facultyTableBody.innerHTML = "";
    
    // Filter and search
    const filteredFaculties = SECURITY_MOCK_DATA.faculties.filter(fac => {
      const matchSearch = fac.name.toLowerCase().includes(activeSearchQuery.toLowerCase()) || 
                          fac.nameEn.toLowerCase().includes(activeSearchQuery.toLowerCase());
      const matchGrade = activeGradeFilter === "all" || fac.grade === activeGradeFilter;
      return matchSearch && matchGrade;
    });

    if (filteredFaculties.length === 0) {
      facultyTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
            <i data-lucide="search-code" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
            <p class="text-sm font-semibold">ไม่พบข้อมูลคณะที่คุณกำลังค้นหา</p>
          </td>
        </tr>
      `;
      lucide.createIcons();
      return;
    }

    filteredFaculties.forEach(fac => {
      const row = document.createElement("tr");
      row.className = "hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors";
      
      // Determine grade color
      let gradeColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      if (fac.grade === "B") gradeColor = "text-teal-500 bg-teal-500/10 border-teal-500/20";
      else if (fac.grade === "C") gradeColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
      else if (fac.grade === "D") gradeColor = "text-orange-500 bg-orange-500/10 border-orange-500/20";
      else if (fac.grade === "F") gradeColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";

      // Alert Badge
      const alertBadge = fac.criticalAlerts > 0 
        ? `<span class="inline-flex items-center gap-1 text-xs font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full animate-pulse-gentle">
            <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i> ${fac.criticalAlerts} ข้อ
           </span>`
        : `<span class="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i> ปลอดภัย
           </span>`;

      // EDR Rate Color
      let edrColor = "text-emerald-500";
      if (fac.edrInstallRate < 70) edrColor = "text-rose-500";
      else if (fac.edrInstallRate < 90) edrColor = "text-amber-500";

      row.innerHTML = `
        <td class="px-6 py-4">
          <div>
            <div class="font-bold text-slate-800 dark:text-slate-200">${fac.name}</div>
            <div class="text-xs text-slate-400 dark:text-slate-500">${fac.nameEn}</div>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <div class="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full hidden sm:block">
              <div class="h-2 rounded-full ${fac.edrInstallRate >= 90 ? 'bg-emerald-500' : fac.edrInstallRate >= 70 ? 'bg-amber-500' : 'bg-rose-500'}" style="width: ${fac.edrInstallRate}%"></div>
            </div>
            <span class="text-xs font-extrabold ${edrColor}">${fac.edrInstallRate}%</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center text-slate-600 dark:text-slate-400 font-semibold">${fac.devices}</td>
        <td class="px-6 py-4 text-center text-slate-600 dark:text-slate-400 font-semibold">${fac.openPorts}</td>
        <td class="px-6 py-4 text-center">${alertBadge}</td>
        <td class="px-6 py-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <span class="font-extrabold text-slate-800 dark:text-slate-100">${fac.score}</span>
            <span class="text-xs text-slate-400">/100</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="inline-block text-center w-8 py-0.5 text-xs font-extrabold rounded-lg border ${gradeColor}">${fac.grade}</span>
        </td>
        <td class="px-6 py-4 text-right">
          <button class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold text-xs flex items-center gap-1 ml-auto">
            <span>ตรวจสอบ</span>
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </button>
        </td>
      `;

      row.addEventListener("click", () => openFacultyModal(fac));
      facultyTableBody.appendChild(row);
    });

    lucide.createIcons();
  }

  // Search & Filter Listeners
  facultySearch.addEventListener("input", (e) => {
    activeSearchQuery = e.target.value;
    renderFacultyTable();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => {
        b.classList.remove("active", "bg-white", "dark:bg-slate-700", "text-slate-800", "dark:text-slate-200", "shadow-sm");
        b.classList.add("text-slate-500", "dark:text-slate-400", "font-medium");
      });
      
      btn.classList.add("active", "bg-white", "dark:bg-slate-700", "text-slate-800", "dark:text-slate-200", "shadow-sm");
      btn.classList.remove("text-slate-500", "dark:text-slate-400", "font-medium");
      
      activeGradeFilter = btn.dataset.grade;
      renderFacultyTable();
    });
  });

  // Render Overall Recommendations List (from all faculties issues)
  function renderOverallRecommendations() {
    overallRecommendationsList.innerHTML = "";
    
    // Collect all issues across all faculties
    let allIssues = [];
    SECURITY_MOCK_DATA.faculties.forEach(fac => {
      fac.issues.forEach(issue => {
        allIssues.push({
          facultyName: fac.name,
          ...issue
        });
      });
    });

    // Sort issues by severity (Critical > High > Medium > Low)
    const severityWeight = { "Critical": 4, "High": 3, "Medium": 2, "Low": 1 };
    allIssues.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

    // Render top 4 recommendations
    const topIssues = allIssues.slice(0, 4);

    if (topIssues.length === 0) {
      overallRecommendationsList.innerHTML = `
        <div class="col-span-2 bg-slate-50 dark:bg-slate-800/40 p-8 rounded-2xl text-center text-slate-400">
          <i data-lucide="check-check" class="w-8 h-8 mx-auto mb-2 text-emerald-500"></i>
          <p class="text-sm font-bold text-slate-700 dark:text-slate-300">ยินดีด้วย! ไม่พบรายการข้อเสนอแนะเร่งด่วน</p>
          <p class="text-xs mt-1">ระบบทั้งหมดได้รับการปกป้องและการติดตั้ง EDR ปลอดภัยแล้ว</p>
        </div>
      `;
      return;
    }

    topIssues.forEach(issue => {
      let icon = "alert-circle";
      let iconBg = "bg-rose-500/10 text-rose-500";
      
      if (issue.severity === "Critical") {
        icon = "flame";
        iconBg = "bg-rose-600/15 text-rose-600 animate-pulse";
      } else if (issue.severity === "High") {
        icon = "shield-alert";
        iconBg = "bg-rose-500/10 text-rose-500";
      } else if (issue.severity === "Medium") {
        icon = "alert-triangle";
        iconBg = "bg-amber-500/10 text-amber-500";
      } else {
        icon = "info";
        iconBg = "bg-slate-500/10 text-slate-500";
      }

      const card = document.createElement("div");
      card.className = "bg-slate-50 dark:bg-slate-800/35 border border-slate-100 dark:border-slate-850 p-5 rounded-2xl flex items-start gap-4 hover-scale";
      card.innerHTML = `
        <div class="p-2.5 rounded-xl ${iconBg}">
          <i data-lucide="${icon}" class="w-5 h-5"></i>
        </div>
        <div class="space-y-2 flex-grow min-w-0">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-xs font-bold text-slate-400 dark:text-slate-500">${issue.facultyName}</span>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
              issue.severity === 'Critical' ? 'bg-rose-600/20 text-rose-600' :
              issue.severity === 'High' ? 'bg-rose-500/20 text-rose-500' :
              issue.severity === 'Medium' ? 'bg-amber-500/20 text-amber-500' :
              'bg-slate-500/20 text-slate-500'
            }">${issue.severity}</span>
          </div>
          <h4 class="font-extrabold text-sm dark:text-white truncate" title="${issue.title}">${issue.title}</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">${issue.desc}</p>
          <div class="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 p-2.5 rounded-xl text-xs mt-2">
            <span class="font-bold text-blue-600 dark:text-blue-400">วิธีแก้ไข:</span>
            <span class="text-slate-600 dark:text-slate-300 ml-1">${issue.recommendation}</span>
          </div>
        </div>
      `;

      overallRecommendationsList.appendChild(card);
    });
  }

  // Render notifications dropdown menu
  function renderNotifications() {
    notifListContainer.innerHTML = "";
    const alerts = SECURITY_MOCK_DATA.topAlerts;
    notifCount.innerText = `${alerts.length} เหตุการณ์`;
    
    if (alerts.length === 0) {
      notifBadge.classList.add("hidden");
      notifListContainer.innerHTML = `
        <div class="px-4 py-6 text-center text-xs text-slate-400">
          <i data-lucide="check-circle" class="w-6 h-6 mx-auto mb-2 text-emerald-500"></i>
          <span>ไม่มีการแจ้งเตือนความเสี่ยงค้างอยู่</span>
        </div>
      `;
      return;
    } else {
      notifBadge.classList.remove("hidden");
    }

    alerts.forEach(alert => {
      let sevBg = "bg-rose-500";
      if (alert.severity === "Critical") sevBg = "bg-rose-600 animate-pulse";
      else if (alert.severity === "Medium") sevBg = "bg-amber-500";

      const item = document.createElement("div");
      item.className = "px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-b border-slate-100 dark:border-slate-850 last:border-b-0 cursor-pointer transition-all flex items-start gap-2.5";
      item.innerHTML = `
        <span class="w-2 h-2 rounded-full ${sevBg} mt-1.5 flex-shrink-0"></span>
        <div class="flex-grow min-w-0">
          <div class="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
            <span class="font-bold text-slate-500 dark:text-slate-400">${alert.faculty}</span>
            <span>${alert.time}</span>
          </div>
          <p class="text-xs text-slate-700 dark:text-slate-300 font-bold truncate">${alert.type}</p>
        </div>
      `;

      item.addEventListener("click", () => {
        notifDropdown.classList.add("hidden");
        const foundFac = SECURITY_MOCK_DATA.faculties.find(f => f.name === alert.faculty);
        if (foundFac) openFacultyModal(foundFac);
      });
      notifListContainer.appendChild(item);
    });
  }

  // Notifications Toggle
  btnNotif.addEventListener("click", (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!btnNotif.contains(e.target) && !notifDropdown.contains(e.target)) {
      notifDropdown.classList.add("hidden");
    }
  });

  // ================= MODAL DRILL-DOWN HANDLERS =================
  
  // Tab Switching Logic
  function switchModalTab(tab) {
    if (tab === "issues") {
      tabIssuesBtn.className = "flex-grow text-center pb-2.5 text-xs font-extrabold border-b-2 border-blue-500 text-blue-500 focus:outline-none transition-all";
      tabAssetsBtn.className = "flex-grow text-center pb-2.5 text-xs font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-all";
      modalTabIssues.classList.remove("hidden");
      modalTabAssets.classList.add("hidden");
    } else {
      tabAssetsBtn.className = "flex-grow text-center pb-2.5 text-xs font-extrabold border-b-2 border-blue-500 text-blue-500 focus:outline-none transition-all";
      tabIssuesBtn.className = "flex-grow text-center pb-2.5 text-xs font-semibold border-b-2 border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-all";
      modalTabIssues.classList.add("hidden");
      modalTabAssets.classList.remove("hidden");
    }
  }

  tabIssuesBtn.addEventListener("click", () => switchModalTab("issues"));
  tabAssetsBtn.addEventListener("click", () => switchModalTab("assets"));

  function openFacultyModal(fac) {
    // Show tabs navigation
    modalTabsNav.classList.remove("hidden");
    // Switch to issues tab by default
    switchModalTab("issues");

    // Fill basic details
    document.getElementById("modal-title").innerText = fac.name;
    document.getElementById("modal-subtitle").innerText = fac.nameEn;
    document.getElementById("modal-score").innerText = `${fac.score}/100`;
    document.getElementById("modal-grade").innerText = fac.grade;
    
    // Set color based on grade
    const gradeSpan = document.getElementById("modal-grade");
    gradeSpan.className = "text-2xl font-black";
    if (fac.grade === "A") gradeSpan.classList.add("text-emerald-500");
    else if (fac.grade === "B") gradeSpan.classList.add("text-teal-500");
    else if (fac.grade === "C") gradeSpan.classList.add("text-amber-500");
    else if (fac.grade === "D") gradeSpan.classList.add("text-orange-500");
    else gradeSpan.classList.add("text-rose-500");

    const sumSpan = document.getElementById("modal-alerts-summary");
    sumSpan.innerText = `${fac.criticalAlerts} ความเสี่ยง (${fac.openPorts} พอร์ตเปิด) | EDR: ${fac.edrInstallRate}%`;
    sumSpan.className = fac.criticalAlerts > 0 ? "text-sm font-extrabold text-rose-500 leading-8" : "text-sm font-extrabold text-emerald-500 leading-8";

    // Set header icon
    const iconContainer = document.getElementById("modal-icon-container");
    iconContainer.className = "p-2.5 rounded-xl text-white " + (fac.criticalAlerts > 0 ? "bg-rose-500" : "bg-emerald-500");
    iconContainer.innerHTML = fac.criticalAlerts > 0 ? `<i data-lucide="shield-alert" class="w-6 h-6"></i>` : `<i data-lucide="check-circle" class="w-6 h-6"></i>`;

    // Fill Issues List (Tab 1)
    const issueList = document.getElementById("modal-issue-list");
    issueList.innerHTML = "";

    if (fac.issues.length === 0) {
      issueList.innerHTML = `
        <div class="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center text-emerald-600 dark:text-emerald-400">
          <i data-lucide="shield-check" class="w-8 h-8 mx-auto mb-2"></i>
          <span class="font-bold text-sm">ไม่พบช่องโหว่ความปลอดภัยค้างอยู่ในคณะนี้</span>
          <p class="text-xs mt-1 text-slate-500 dark:text-slate-400">สัญญาณ WiFi, อุปกรณ์ปลายทาง และการอัปเดต EDR ได้รับการป้องกันอย่างเต็มที่</p>
        </div>
      `;
    } else {
      fac.issues.forEach(issue => {
        const item = document.createElement("div");
        item.className = "bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4.5 rounded-2xl space-y-3";
        item.innerHTML = `
          <div class="flex items-center justify-between">
            <span class="font-extrabold text-sm dark:text-slate-200 line-clamp-1">${issue.title}</span>
            <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${issue.severityColor}">${issue.severity}</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${issue.desc}</p>
          <div class="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 p-3 rounded-xl text-xs space-y-1">
            <div class="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <i data-lucide="wrench" class="w-3.5 h-3.5"></i>
              <span>แนวทางแก้ไขเชิงปฏิบัติ:</span>
            </div>
            <div class="text-slate-600 dark:text-slate-300 pl-4.5">${issue.recommendation}</div>
          </div>
        `;
        issueList.appendChild(item);
      });
    }

    // Fill Web Assets (Tab 2)
    modalAssetList.innerHTML = "";
    if (!fac.assets || fac.assets.length === 0) {
      modalAssetList.innerHTML = `
        <div class="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
          <i data-lucide="link-2-off" class="w-6 h-6 mx-auto mb-1 opacity-60"></i>
          <span>ไม่มีรายการตรวจสอบเว็บไซต์ในคณะนี้</span>
        </div>
      `;
    } else {
      fac.assets.forEach(asset => {
        const isHttp = asset.startsWith("http://");
        let sslStatusHtml = "";
        let assetBadgeHtml = "";

        if (isHttp) {
          sslStatusHtml = `<span class="text-rose-500 flex items-center gap-1"><i data-lucide="lock-open" class="w-3 h-3"></i> HTTP (ไม่มี SSL)</span>`;
          assetBadgeHtml = `<span class="text-[9px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">WARNING</span>`;
        } else {
          sslStatusHtml = `<span class="text-emerald-500 flex items-center gap-1"><i data-lucide="lock" class="w-3 h-3"></i> HTTPS Secure</span>`;
          assetBadgeHtml = `<span class="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">SECURE</span>`;
        }

        const itemDiv = document.createElement("div");
        itemDiv.className = "bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs hover:border-slate-200 dark:hover:border-slate-700 transition-all";
        itemDiv.innerHTML = `
          <div class="flex-grow min-w-0 pr-4">
            <a href="${asset}" target="_blank" class="font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate block" title="${asset}">${asset.replace("https://", "").replace("http://", "")}</a>
            <div class="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
              ${sslStatusHtml}
              <span>•</span>
              <span>สถานะ: เชื่อมต่อได้</span>
            </div>
          </div>
          <div class="flex-shrink-0">
            ${assetBadgeHtml}
          </div>
        `;
        modalAssetList.appendChild(itemDiv);
      });
    }

    // Modal Action
    btnModalResolve.onclick = () => {
      closeModal();
      showToast("ส่งใบงานความปลอดภัยแล้ว", `ระบบได้ส่งแจ้งเตือนการแก้ไข EDR/WiFi ไปยังผู้ดูแลไอทีของ ${fac.name} เรียบร้อยแล้ว`, "blue");
    };

    openModal();
  }

  function openCategoryModal(cat) {
    // Hide tabs navigation on category details
    modalTabsNav.classList.add("hidden");
    switchModalTab("issues");

    document.getElementById("modal-title").innerText = cat.name.split(" (")[0];
    document.getElementById("modal-subtitle").innerText = cat.name.split(" (")[1] ? cat.name.split(" (")[1].replace(")", "") : "";
    document.getElementById("modal-score").innerText = `${cat.score}/100`;
    document.getElementById("modal-grade").innerText = cat.grade;
    
    const gradeSpan = document.getElementById("modal-grade");
    gradeSpan.className = "text-2xl font-black";
    if (cat.score >= 90) gradeSpan.classList.add("text-emerald-500");
    else if (cat.score >= 80) gradeSpan.classList.add("text-teal-500");
    else if (cat.score >= 70) gradeSpan.classList.add("text-amber-500");
    else gradeSpan.classList.add("text-rose-500");

    // Alerts summary
    let sumText = "";
    if (cat.id === "network") sumText = `เปิด ${cat.details.openPorts} พอร์ตควบคุม (เกรด SSL: ${cat.details.sslGrade})`;
    else if (cat.id === "patch") sumText = `พบเวอร์ชันเก่า ${cat.details.outdatedSystems} ระบบ (${cat.details.cvesDetected} ช่องโหว่ EDR/OS)`;
    else if (cat.id === "appsec") sumText = `ขาดการตั้งค่า HTTP Security Headers ${cat.details.missingHeaders} รายการ`;
    else if (cat.id === "dns") sumText = `นโยบาย DMARC: ${cat.details.dmarcPolicy}`;

    const sumSpan = document.getElementById("modal-alerts-summary");
    sumSpan.innerText = sumText;
    sumSpan.className = cat.score < 80 ? "text-sm font-extrabold text-rose-500 leading-8" : "text-sm font-extrabold text-emerald-500 leading-8";

    // Set header icon
    const iconContainer = document.getElementById("modal-icon-container");
    iconContainer.className = `p-2.5 rounded-xl text-white bg-${cat.color === 'rose' ? 'rose-500' : cat.color === 'amber' ? 'amber-500' : 'emerald-500'}`;
    iconContainer.innerHTML = `<i data-lucide="${cat.icon}" class="w-6 h-6"></i>`;

    // Fill indicators list
    const issueList = document.getElementById("modal-issue-list");
    issueList.innerHTML = "";

    cat.indicators.forEach(ind => {
      let iconColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      let statusText = "PASS";
      if (ind.status === "warning") {
        iconColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
        statusText = "WARNING";
      } else if (ind.status === "fail") {
        iconColor = "text-rose-500 bg-rose-500/10 border-rose-500/20";
        statusText = "FAIL";
      }

      const item = document.createElement("div");
      item.className = "bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-start gap-4";
      item.innerHTML = `
        <span class="inline-block text-center w-20 py-0.5 text-[10px] font-bold rounded-md border ${iconColor} flex-shrink-0 mt-0.5">${statusText}</span>
        <div>
          <span class="font-extrabold text-sm dark:text-slate-200 block">${ind.name}</span>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">${ind.detail}</p>
        </div>
      `;
      issueList.appendChild(item);
    });

    btnModalResolve.onclick = () => {
      closeModal();
      showToast("ส่งอีเมลแจ้งเตือนหน่วยงานหลัก", `ส่งคำแนะนำแก้ไขระบบความมั่นคงปลอดภัยส่วนกลางของมหาวิทยาลัยสำเร็จ`, "emerald");
    };

    openModal();
  }

  function openModal() {
    detailModal.classList.remove("hidden");
    detailModal.classList.add("flex");
    setTimeout(() => {
      modalBox.classList.remove("scale-95", "opacity-0");
      modalBox.classList.add("scale-100", "opacity-100");
    }, 50);
    lucide.createIcons();
  }

  function closeModal() {
    modalBox.classList.remove("scale-100", "opacity-100");
    modalBox.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      detailModal.classList.add("hidden");
      detailModal.classList.remove("flex");
    }, 150);
  }

  btnCloseModal.addEventListener("click", closeModal);
  btnCloseModalFooter.addEventListener("click", closeModal);
  
  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) closeModal();
  });

  // ================= TOAST NOTIFICATION SYSTEM =================
  function showToast(title, desc, color = "emerald") {
    const toast = document.getElementById("toast-notification");
    const iconBg = document.getElementById("toast-icon-bg");
    const icon = document.getElementById("toast-icon");
    const toastTitle = document.getElementById("toast-title");
    const toastDesc = document.getElementById("toast-desc");

    toastTitle.innerText = title;
    toastDesc.innerText = desc;

    iconBg.className = "p-1.5 rounded-lg text-white";
    if (color === "emerald") {
      iconBg.classList.add("bg-emerald-500");
      icon.setAttribute("data-lucide", "check");
    } else if (color === "blue") {
      iconBg.classList.add("bg-blue-600");
      icon.setAttribute("data-lucide", "send");
    } else if (color === "amber") {
      iconBg.classList.add("bg-amber-500");
      icon.setAttribute("data-lucide", "alert-triangle");
    }

    lucide.createIcons();

    // Show
    toast.classList.remove("translate-y-20", "opacity-0");
    toast.classList.add("translate-y-0", "opacity-100");

    // Hide after 3.5s
    setTimeout(() => {
      toast.classList.remove("translate-y-0", "opacity-100");
      toast.classList.add("translate-y-20", "opacity-0");
    }, 3500);
  }

  // ================= SIDEBAR MOBILE TOGGLES =================
  btnToggleSidebar.addEventListener("click", () => {
    mobileSidebar.classList.remove("hidden");
    setTimeout(() => {
      mobileSidebarContent.classList.remove("-translate-x-full");
    }, 50);
  });

  function closeMobileSidebar() {
    mobileSidebarContent.classList.add("-translate-x-full");
    setTimeout(() => {
      mobileSidebar.classList.add("hidden");
    }, 300);
  }

  btnCloseSidebar.addEventListener("click", closeMobileSidebar);
  mobileSidebar.addEventListener("click", (e) => {
    if (e.target === mobileSidebar) closeMobileSidebar();
  });

  // Export report print
  btnExport.addEventListener("click", () => {
    window.print();
  });

  // ================= INITIALIZE CHARTS (CHART.JS) =================
  function initCharts() {
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "rgba(75, 85, 99, 0.15)" : "rgba(229, 231, 235, 0.6)";
    const textColor = isDark ? "#9ca3af" : "#4b5563";
    const angleLineColor = isDark ? "rgba(75, 85, 99, 0.3)" : "rgba(209, 213, 219, 0.8)";
    
    if (trendChartInstance) trendChartInstance.destroy();
    if (radarChartInstance) radarChartInstance.destroy();

    // 1. Line Trend Chart
    const ctxTrend = document.getElementById("chart-trend").getContext("2d");
    const trendGradient = ctxTrend.createLinearGradient(0, 0, 0, 300);
    if (isDark) {
      trendGradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
      trendGradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");
    } else {
      trendGradient.addColorStop(0, "rgba(59, 130, 246, 0.2)");
      trendGradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");
    }

    const trendLabels = SECURITY_MOCK_DATA.overallScore.trend.map(d => d.month);
    const trendValues = SECURITY_MOCK_DATA.overallScore.trend.map(d => d.score);

    trendChartInstance = new Chart(ctxTrend, {
      type: "line",
      data: {
        labels: trendLabels,
        datasets: [{
          label: "คะแนนเฉลี่ยรวม",
          data: trendValues,
          fill: true,
          backgroundColor: trendGradient,
          borderColor: "#3b82f6",
          borderWidth: 3,
          pointBackgroundColor: "#2563eb",
          pointBorderColor: isDark ? "#0f172a" : "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            padding: 12,
            titleFont: { size: 13, weight: "bold", family: "Inter, Sarabun" },
            bodyFont: { size: 12, family: "Inter, Sarabun" },
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)",
            titleColor: isDark ? "#ffffff" : "#1f2937",
            bodyColor: isDark ? "#9ca3af" : "#4b5563",
            borderColor: isDark ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.8)",
            borderWidth: 1,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: textColor,
              font: { family: "Inter, Sarabun", size: 11 }
            }
          },
          y: {
            min: 50,
            max: 100,
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: { family: "Inter", size: 11 },
              stepSize: 10
            }
          }
        }
      }
    });

    // 2. Radar Category Chart
    const ctxRadar = document.getElementById("chart-radar").getContext("2d");
    const radarLabels = SECURITY_MOCK_DATA.categories.map(c => c.name.split(" (")[0]);
    const radarValues = SECURITY_MOCK_DATA.categories.map(c => c.score);

    radarChartInstance = new Chart(ctxRadar, {
      type: "radar",
      data: {
        labels: radarLabels,
        datasets: [{
          label: "คะแนนที่ได้",
          data: radarValues,
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
          borderColor: "#10b981",
          borderWidth: 2,
          pointBackgroundColor: "#059669",
          pointBorderColor: isDark ? "#0f172a" : "#ffffff",
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            padding: 12,
            titleFont: { size: 12, weight: "bold", family: "Inter, Sarabun" },
            bodyFont: { size: 11, family: "Inter, Sarabun" },
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)",
            titleColor: isDark ? "#ffffff" : "#1f2937",
            bodyColor: isDark ? "#9ca3af" : "#4b5563",
            borderColor: isDark ? "rgba(75, 85, 99, 0.3)" : "rgba(229, 231, 235, 0.8)",
            borderWidth: 1,
            displayColors: false
          }
        },
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              display: false
            },
            grid: {
              color: gridColor
            },
            angleLines: {
              color: angleLineColor
            },
            pointLabels: {
              color: textColor,
              font: {
                family: "Inter, Sarabun",
                size: 11,
                weight: "600"
              }
            }
          }
        }
      }
    });
  }

  // Global handler for Logo Image errors (falls back to abbreviation text)
  window.handleLogoError = (imgEl, abbr, color, fallbackIcon) => {
    imgEl.style.display = 'none';
    const parent = imgEl.parentElement;
    // Render text label inside circle
    parent.innerHTML = `
      <div class="w-full h-full flex items-center justify-center font-black text-[9px] tracking-tighter" style="color: ${color};">
        ${abbr}
      </div>
    `;
  };

  // ================= INITIALIZE MAP (LEAFLET.JS) =================
  function initMap() {
    const isDark = document.documentElement.classList.contains("dark");
    const tileUrl = isDark 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    if (!mapInstance) {
      mapInstance = L.map("map", {
        center: [16.4743, 102.8230], // Center of KKU scientific campus area
        zoom: 14.5,
        zoomControl: true,
        scrollWheelZoom: false
      });
      markersGroup = L.layerGroup().addTo(mapInstance);
    }

    if (tileLayerInstance) {
      mapInstance.removeLayer(tileLayerInstance);
    }

    tileLayerInstance = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstance);

    // Clear previous markers
    markersGroup.clearLayers();

    // Render Markers color-coded by grade/risk with specific faculty logo icons
    SECURITY_MOCK_DATA.faculties.forEach(fac => {
      let color = "#10b981"; // emerald
      if (fac.grade === "B") color = "#14b8a6"; // teal
      else if (fac.grade === "C") color = "#f59e0b"; // amber
      else if (fac.grade === "D") color = "#f97316"; // orange
      else if (fac.grade === "F") color = "#ef4444"; // rose

      // Pulse circle marker HTML with faculty logo image inside + text label below
      const markerHtml = `
        <div class="relative w-12 h-14 flex flex-col items-center justify-center">
          <!-- Circle Emblem -->
          <div class="relative w-9 h-9 flex items-center justify-center">
            <!-- Pulse Outer Ring -->
            <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full opacity-60" style="background-color: ${color}40;"></span>
            
            <!-- Inner Logo Circle -->
            <div class="relative w-8 h-8 rounded-full border-2 bg-white dark:bg-slate-900 shadow-md flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-110" style="border-color: ${color};">
              <img src="${fac.logoUrl || ''}" class="w-6 h-6 object-contain rounded-full" onerror="window.handleLogoError(this, '${fac.abbr || fac.id.toUpperCase()}', '${color}', '${fac.icon || 'building'}')" />
            </div>
          </div>
          
          <!-- Text Label below marker (matches screenshot) -->
          <div class="mt-0.5 bg-slate-950/90 text-white dark:bg-slate-900/95 border border-slate-700/60 text-[8px] font-black px-1 py-0.5 rounded shadow-sm leading-none text-center min-w-[30px] uppercase">
            ${fac.abbr || fac.id.toUpperCase()}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-leaflet-marker',
        iconSize: [48, 56],
        iconAnchor: [24, 28]
      });

      const marker = L.marker(fac.coords, { icon: customIcon });

      // Custom Leaflet Popup content
      const popupContent = `
        <div class="p-1 font-sans text-slate-800 dark:text-slate-200">
          <div class="font-extrabold text-xs mb-0.5 text-slate-900 dark:text-slate-50">${fac.name}</div>
          <div class="text-[10px] text-slate-400 dark:text-slate-500 mb-1.5">${fac.nameEn}</div>
          <div class="space-y-1 text-xs border-t border-slate-100 dark:border-slate-850 pt-1.5">
            <div class="flex items-center justify-between gap-6">
              <span class="text-slate-500 dark:text-slate-400">คะแนนความปลอดภัย:</span>
              <span class="font-black text-slate-800 dark:text-slate-100">${fac.score}/100</span>
            </div>
            <div class="flex items-center justify-between gap-6">
              <span class="text-slate-500 dark:text-slate-400">ระดับเกรดความเสี่ยง:</span>
              <span class="font-extrabold" style="color: ${color};">${fac.grade}</span>
            </div>
            <div class="flex items-center justify-between gap-6">
              <span class="text-slate-500 dark:text-slate-400">การติดตั้ง EDR Agent:</span>
              <span class="font-bold text-slate-800 dark:text-slate-100">${fac.edrInstallRate}%</span>
            </div>
          </div>
          <button class="w-full mt-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg transition-all shadow-md shadow-blue-500/10" onclick="window.triggerFacultyModalFromMap('${fac.id}')">
            ตรวจสอบจุดอ่อน
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'custom-leaflet-popup'
      });

      markersGroup.addLayer(marker);
    });

    // Refresh Lucide icons to render inside map markers
    lucide.createIcons();
  }

});
