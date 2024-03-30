document.addEventListener("DOMContentLoaded", function() {
  // Function to fetch details
  const fetchDetails = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const tab = tabs[0];

      const details = {};

      details.url = tab.url;

      details.domain = new URL(tab.url).hostname;;
      details.date = new Date().toLocaleString();

      let ssl = tab.url.startsWith("https://")

      const safetyInfo = {};

      // Check for Mixed Content
      safetyInfo.mixedContent = document.querySelectorAll("[src^='http://']").length > 0 ? "Found" : "None";

      // Check for Content Security Policy (CSP)
      safetyInfo.csp = document.querySelector("meta[http-equiv='Content-Security-Policy']") ? "Enabled" : "Disabled";

      // Check for Subresource Integrity (SRI)
      safetyInfo.sri = document.querySelectorAll("[integrity]").length > 0 ? "Enabled" : "Disabled";

      // Check for Permissions
      safetyInfo.permissions = navigator.permissions ? "Supported" : "Not Supported";

      // Check for Third-Party Scripts
      safetyInfo.thirdPartyScripts = !!document.querySelector("script[src^='https://cdnjs.cloudflare.com']") ? "Used" : "Not Used";

      // Check for Anti-Phishing Measures
      safetyInfo.antiPhishing = location.href.includes("https://") ? "Secure" : "Potentially Insecure";

      const performanceData = {};
      let { timing, timeOrigin } = JSON.parse(JSON.stringify(window.performance));

      performanceData.domCompleted = (timing.domComplete - timeOrigin)/1000; // ms to s
      performanceData.connectTime = (timing.connectEnd - timing.connectStart)/1000; //ms to s
      performanceData.domContentEvent = (timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart)/1000; //ms to s
      performanceData.responseTime = (timing.responseEnd - timing.requestStart)/1000; // ms to s
      performanceData.unloadEvent = (timing.unloadEventEnd - timing.unloadEventStart)/1000; // ms to s
      performanceData.domInteractive = (timing.domInteractive - timeOrigin)/1000; // ms to s
      performanceData.redirectTime = (timing.redirectEnd - timing.redirectStart)/1000; // ms to s

      displayDetails(details, ssl, safetyInfo, performanceData);
    });
  };



  // Function to display details
  const displayDetails = (details, ssl, safetyInfo, performanceData) => {

    document.getElementById("domain").textContent = details.domain;
    document.getElementById("url").textContent = details.url;
    document.getElementById("date").textContent = details.date;

    if (!ssl) {
      document.getElementById("sslInfo").classList.add("error-mark")
      document.getElementById("sslInfo").innerHTML = "Oops, Your website has not been SSL enabled.";
    } else {
      document.getElementById("sslInfo").classList.add("success-mark")
      document.getElementById("sslInfo").innerHTML = "You are viewing SSL enabled website.";
    }

    if(safetyInfo.mixedContent == "None") {
      document.getElementById("mixedContent").classList.add("success-mark")
      document.getElementById("mixedContent").innerHTML = " Website doesnt have mixed contents";
    }
    else {
      document.getElementById("mixedContent").classList.add("warning-mark")
      document.getElementById("mixedContent").innerHTML = " Contains mixed contents(such as images, stylesheets, etc.)";
    } 

    if(safetyInfo.csp == "Enabled") {
      document.getElementById("csp").classList.add("success-mark")
      document.getElementById("csp").innerHTML = " CSP header enabled";
    }
    else {
      document.getElementById("csp").classList.add("warning-mark")
      document.getElementById("csp").innerHTML = " CSP header not enabled";
    }

    if(safetyInfo.sri == "Enabled") {
      document.getElementById("sri").classList.add("success-mark")
      document.getElementById("sri").innerHTML = " Subresource Integrity enabled";
    }
    else {
      document.getElementById("sri").classList.add("warning-mark")
      document.getElementById("sri").innerHTML = " Subresource Integrity not enabled";
    }

    if(safetyInfo.permissions == "Supported") {
      document.getElementById("permissions").classList.add("success-mark")
      document.getElementById("permissions").innerHTML = "Website supports querying permissions";
    }
    else {
      document.getElementById("permissions").classList.add("warning-mark")
      document.getElementById("permissions").innerHTML = "Website does not support querying permissions";
    }

    if(safetyInfo.thirdPartyScripts == "Not Used") {
      document.getElementById("thirdPartyScripts").classList.add("success-mark")
      document.getElementById("thirdPartyScripts").innerHTML = "No third party scripts used";
    }
    else {
      document.getElementById("thirdPartyScripts").classList.add("warning-mark")
      document.getElementById("thirdPartyScripts").innerHTML = "Third party scripts found";
    }

    if(safetyInfo.antiPhishing == "Secure") {
      document.getElementById("antiPhishing").classList.add("success-mark")
      document.getElementById("antiPhishing").innerHTML = "Anti-Phishing enabled website";
    }
    else {
      document.getElementById("antiPhishing").classList.add("warning-mark")
      document.getElementById("antiPhishing").innerHTML = "Website may potentially Insecure";
    }

    document.getElementById("performance-dom-completed").innerHTML = performanceData.domCompleted + "s";
    document.getElementById("performance-connect-time").innerHTML = performanceData.connectTime + "s";
    document.getElementById("performance-dom-content").innerHTML = performanceData.domContentEvent + "s";
    document.getElementById("performance-response-time").innerHTML = performanceData.responseTime + "s";
    document.getElementById("performance-unload-event").innerHTML = performanceData.unloadEvent + "s";
    document.getElementById("performance-dom-interactive").innerHTML = performanceData.domInteractive + "s";
    document.getElementById("performance-redirect-time").innerHTML = performanceData.redirectTime + "s";

  };

  // Function to handle report button click
  const handleReportButtonClick = () => {
    fetchDetails();
  };

  // Attach click event listener to report button
  document.getElementById("report-btn").addEventListener("click", handleReportButtonClick);
});
