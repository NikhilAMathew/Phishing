document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const realtimeNotificationsSwitch = document.getElementById('togg-1');
  const blockPhishingSwitch = document.getElementById('togg-2');

  // Update switch appearance based on the extension state
  function updateSwitch(isEnabled) {
    toggleSwitch.checked = isEnabled;
  }

  // Retrieve the current state of the extension from Chrome storage
  chrome.storage.sync.get(['isEnabled', 'realtimeNotifications', 'blockPhishing'], function(data) {
    const isEnabled = data.isEnabled !== undefined ? data.isEnabled : false;
    const realtimeNotifications = data.realtimeNotifications !== undefined ? data.realtimeNotifications : false;
    const blockPhishing = data.blockPhishing !== undefined ? data.blockPhishing : false;

    updateSwitch(isEnabled);
    realtimeNotificationsSwitch.checked = realtimeNotifications;
    blockPhishingSwitch.checked = blockPhishing;

    // Perform actions based on checkbox values
    if (isEnabled && realtimeNotifications && blockPhishing) {
      // Add your code here for real-time notifications and blocking phishing sites
    }
  });

  // Event listeners for the other checkboxes
  realtimeNotificationsSwitch.addEventListener('change', function() {
    const realtimeNotifications = this.checked;
    chrome.storage.sync.set({ realtimeNotifications });
  });

  blockPhishingSwitch.addEventListener('change', function() {
    const blockPhishing = this.checked;
    chrome.storage.sync.set({ blockPhishing });
  });

  // Send the updated state to the background script
  toggleSwitch.addEventListener('change', function() {
    const isEnabled = this.checked;
    const realtimeNotifications = realtimeNotificationsSwitch.checked;
    const blockPhishing = blockPhishingSwitch.checked;

    // Save the state to Chrome storage
    chrome.storage.sync.set({ isEnabled, realtimeNotifications, blockPhishing });

    // Send message to background script to update the state
    chrome.runtime.sendMessage({ action: "updateState", state: isEnabled });
  });

    var settingsBtn = document.getElementById('settings-btn');
    var homeBtn = document.getElementById('home-btn');
    var analyseBtn = document.getElementById('report-btn');
    
    var homeCard = document.getElementById('home');
    var settingsCard = document.getElementById('settings');
    var analyseCard = document.getElementById('analyse');

    if (settingsBtn && homeBtn && analyseBtn && homeCard && settingsCard && analyseCard ) {
      settingsBtn.addEventListener('click', function () {
        homeCard.style.display = 'none';
        settingsCard.style.display = 'block';
        analyseCard.style.display = 'none';
      });

      analyseBtn.addEventListener('click', function () {
        homeCard.style.display = 'none';
        settingsCard.style.display = 'none';
        analyseCard.style.display = 'block';
      });

      homeBtn.addEventListener('click', function () {
        homeCard.style.display = 'block';
        settingsCard.style.display = 'none';
        analyseCard.style.display = 'none';
      });
    } else {
      console.error('Could not find required elements in the DOM.');
    }

// Listen for messages from the background script
// chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
//   // Check if the message contains decision and URL
//   if (message.action === 'updateUI') {
//     var decision = message.decision;
//     var url = message.url;
//     // Update the UI with the decision and URL
//     console.log("Received decision:", decision);
//     console.log("URL:", url);
//     // Update UI based on decision and URL
//     updatePopup(decision, url);
//   }
// });

});

  // Function to update UI with current tab URL and decision result
  function updatePopup(decision, url) {
    const el = document.getElementById("site_score");
    const el2 = document.getElementById("site_msg");
    const urlElement = document.getElementById("current_url");
    const reportButton = document.getElementById("reportButton");
    const viewButton = document.getElementById("viewButton");
  
    if (!el || !el2 || !urlElement) {
      console.error('One or more UI elements are null');
      return;
    }
  
    const setStatus = (text, color, message, showReport) => {
      el.textContent = text;
      el.style.color = color;
      el2.textContent = message;
      showReport ? showReportButton() : hideReportButton();
    };
  
    switch (decision) {
      case "PHISHING":
        setStatus("Phishing", "red", "This website is not safe to use.", true);
        break;
      case "SAFE":
        setStatus("Safe", "#4FE34F", "This website is safe to use.", false);
        break;
      default:
        setStatus("Unknown", "black", "Unable to determine safety.", false);
    }
  
    urlElement.textContent = `${url}`;
  
    if (viewButton) {
      viewButton.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: 'viewAnyway', url });
      });
    }
  
    chrome.tabs.query({ active: true, currentWindow: true }, ({ 0: tab }) => {
      tab && tab.id && chrome.tabs.sendMessage(tab.id, { action: 'updateWarningUrl', url });
    });
  }
  
  function showReportButton() {
    const reportButton = document.getElementById("reportButton");
    reportButton && (reportButton.style.display = "block");
  }
  
  function hideReportButton() {
    const reportButton = document.getElementById("reportButton");
    reportButton && (reportButton.style.display = "none");
  }

document.addEventListener('DOMContentLoaded', async function () {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab?.url;

    if (currentUrl) {

      fetch('http://127.0.0.1:5000/check_url', 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: currentUrl })
      })
      .then(response => response.json())
      .then(data => {
        console.log("in popup ",data)
        updatePopup(data.decision, currentUrl)
      })
      .catch(error => console.error('Error:', error));
    } 
    else {
      throw new Error('Unable to get current tab URL');
    }
  } catch (error) {
    console.error('Error checking URL:', error);
  }
});


// Function to toggle email section visibility
function toggleEmailSection() {
    const ifYesDiv = document.getElementById("ifYes");
    const linkedEmailDiv = document.getElementById("linkedEmail");
    const notificationText = document.getElementById("notificationText");

    if (ifYesDiv.style.display === "none" || ifYesDiv.style.display === "") {
        ifYesDiv.style.display = "block";
        linkedEmailDiv.style.display = "none";
        notificationText.textContent = "Link your email id for getting notifications";
    } else {
        ifYesDiv.style.display = "none";
        linkedEmailDiv.style.display = "block";
        notificationText.textContent = "Linked Email: " + userEmail;
    }

    // Save state to Chrome storage
    chrome.storage.sync.set({ emailSectionState: ifYesDiv.style.display === "block" });
}

// Function to verify email
function verifyEmail() {
    const emailInput = document.getElementById("Category");
    const linkedEmailValue = document.getElementById("linkedEmailValue");

    userEmail = emailInput.value;
    linkedEmailValue.textContent = userEmail;

    document.getElementById("ifYes").style.display = "none";
    document.getElementById("linkedEmail").style.display = "block";
    document.getElementById("notificationText").textContent = "Linked Email: " + userEmail;

    // Save state and email to Chrome storage
    chrome.storage.sync.set({ emailSectionState: true, userEmail: userEmail }, function() {
        console.log('State and email saved to Chrome storage.');

        // Send userEmail to background.js
        chrome.runtime.sendMessage({ action: 'updateUserEmail', userEmail: userEmail });
    });
}

// Function to unlink email
function unlinkEmail() {
    userEmail = null;

    document.getElementById("linkedEmail").style.display = "none";
    document.getElementById("ifYes").style.display = "block";
    document.getElementById("notificationText").textContent = "Link your email id for getting notifications";

    // Save state to Chrome storage
    chrome.storage.sync.set({ emailSectionState: false });

    // Remove email from Chrome storage
    chrome.storage.sync.remove('userEmail', function() {
        console.log('Email removed from Chrome storage.');

        // Send userEmail to background.js
        chrome.runtime.sendMessage({ action: 'updateUserEmail', userEmail: null });
    });
}

// Load user email state from Chrome storage
chrome.storage.sync.get(['emailSectionState', 'userEmail'], function(data) {
    const ifYesDiv = document.getElementById("ifYes");
    const linkedEmailDiv = document.getElementById("linkedEmail");
    const notificationText = document.getElementById("notificationText");

    if (data.emailSectionState) {
        ifYesDiv.style.display = "none";
        linkedEmailDiv.style.display = "block";
        notificationText.textContent = "Linked Email: " + data.userEmail;
    } else {
        ifYesDiv.style.display = "block";
        linkedEmailDiv.style.display = "none";
        notificationText.textContent = "Link your email id for getting notifications";
    }
});

// Event listeners
document.getElementById("linkBtn").addEventListener("click", toggleEmailSection);
document.getElementById("verifyBtn").addEventListener("click", verifyEmail);
document.getElementById("unlinkBtn").addEventListener("click", unlinkEmail);



