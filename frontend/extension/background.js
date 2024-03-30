let proceedURLs = new Set();

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ isEnabled: false, realtimeNotifications: false, blockPhishing: false });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateState") {
    chrome.storage.sync.set({ isEnabled: request.state });
  }

  if (request.action === "proceedToURL") {
    proceedURLs.add(request.url);
  }
    
});

// function updateUI(decision, url) {
//   // Send decision and URL to the popup
//   console.log("sending to popup", decision, url);
//   chrome.runtime.sendMessage({ action: 'updateUI', decision: decision, url: url });
// }



function showNotification(title, message, url) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/16x16.png',  // Replace with the path to your extension icon
    title: title,
    message: message + '\n\nURL: ' + url,
  });
}


function sendEmail(to, subject, message, url) {
  // Use Email.js service to send an email
  const emailjsParams = {
    user_id: 'Dubs0HKkce-UlORe_',
    service_id: 'service_3wruvfn',
    template_id: 'template_e2rj5vp',
    template_params: {
      to,
      subject,
      message: message + '\n\nURL: ' + url,
    },
  };

  fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailjsParams),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => console.log('Email sent:', data))
    .catch(error => {
      console.error('Error sending email:', error);
      console.log('Email send failed:', error.message);
    });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Ignore about:blank pages
  if (tab.url === 'about:blank') {
    return;
  }

  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')  && !tab.url.startsWith('http://127.0.0.1:5000') && !tab.url.startsWith('https://mail.google.com/') && !tab.url.startsWith('https://www.google.com/')) {
    chrome.storage.sync.get(['isEnabled', 'blockPhishing', 'realtimeNotifications'], function (data) {
      const isEnabled = data.isEnabled;
      const blockPhishing = data.blockPhishing;
      const realtimeNotifications = data.realtimeNotifications;

      if (isEnabled) {
        if (!tab.url.startsWith(chrome.runtime.getURL("extension/warning.html"))) {
          if (proceedURLs.has(tab.url)) {
            proceedURLs.delete(tab.url);
          } else {
            fetch('http://127.0.0.1:5000/check_url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: tab.url })
            })
            .then(response => response.json())
            .then(data => {

              // // Send decision and URL to the popup
              // chrome.runtime.sendMessage({ action: 'updateUI', decision: data.decision, url: tab.url });
              // updateUI(data.decision, tab.url)

	            if (data.decision === 'PHISHING') {

                if (blockPhishing) {
                const warningPageUrl = chrome.runtime.getURL("extension/warning.html") + "?url=" + encodeURIComponent(tab.url);
                chrome.tabs.update(tabId, { url: warningPageUrl });
		            }

                if (realtimeNotifications) {
                  // Show notification
                  showNotification('FindPhish - Phishing Alert', 'This website has been identified as a phishing site.', tab.url);

                  // Send instant email message
                  chrome.storage.sync.get('userEmail', function (userData) {
                    const userEmail = userData.userEmail;
                    if (userEmail) {
                      sendEmail(userEmail, 'Phishing Alert', 'This website has been identified as a phishing site.', tab.url);
                    }
                  });
                }

              }
            })
            .catch(error => console.error('Error:', error));
          }
        }
      }
    });
  }
});

const siteadvisorLookup = "https://www.siteadvisor.com/sitereport.html?url=";
const safewebLookup = "https://safeweb.norton.com/report/show?url=";
const urlHaus = "https://malware-filter.gitlab.io/malware-filter/urlhaus-filter-online.txt";
const urlHausBackup = "https://malware-filter.pages.dev/urlhaus-filter-online.txt";
// var siteCheckResult = "https://sitecheck.sucuri.net/results/";
function siteadvisor(domain,sendResponse) {
    let url = siteadvisorLookup + domain;
    let url_t = safewebLookup + domain;
    fetch(url) 
      .then(
        function(response) {
          if (response.status !== 200) {
            console.log('Looks like there was a problem. Status Code: ' +
              response.status);
          }
          else{
            return response.text();
          }}).then(function(html){
            const rating = html.includes("risky");
            sendResponse({status:rating});
        });
}

function scanAllUrls(urldata,sendResponse){
  var fetches = [];
  var finalRes = [];
  console.log(urldata);
  for (let i = 0; i < urldata.length; i++) {
    if(urldata[i]===null){
      finalRes.push(false);
    }
    else if(urldata[i].includes("www.google.com")||urldata[i].includes("maps.google.com") || urldata[i].includes("accounts.google.com") || urldata[i].includes("policies.google.com")){
      finalRes.push(false);
    }
    else{
      fetches.push(
          fetch(siteadvisorLookup + urldata[i])
          .then(
            function(response){
              if(response.status===200){return response.text();}
            })
          .then(function(html){ 
            let rating = html.includes("risky");
            // let rating_sw = html.includes("warning");
            // let rating_oth = html.includes("caution");
            // let rating = (rating_oth||rating_sw);
            finalRes.push(urldata[i]+' '+rating);
          })
        );
    }
  }
  Promise.all(fetches).then(function() {
    sendResponse(finalRes);
  });
}

chrome.runtime.onMessage.addListener(
  function(request,sender,sendResponse) {
    if(request.key!==undefined && request.key==="protection_7#rr"){
        siteadvisor(request.scanIt , sendResponse);
    }
    else{
      var data = request;
      scanAllUrls(data,sendResponse);
    }
    return true;
  }
);

function saveUpdateTime(){
  const tDate = new Date().toLocaleDateString();
  chrome.storage.local.set({run_day:tDate});
}
function performUpdate(){
  try{
  fetch(urlHaus).then(function(response){
    if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' +
            response.status);
      }
      else{
        return response.text()
      }}).then(function(text){
        const urlData = text.split("\n");
        console.log(urlData);
        var id = 1
        var finalRegexArr = []
        if(urlData.length<=5000){
        urlData.forEach((item) => {
          if(!item.includes("! ") && item.length!=0){
            if(item.includes("$all")){
              item=item.replace('$all','');
            }
              finalRegexArr.push({
                  "id": id++,
                  "priority": 1,
                  "action": {
                      "type": "block"
                  },
                  "condition": {
                      "urlFilter": item,
                      "resourceTypes": [
                          "main_frame",
                          "sub_frame",
                          "script",
                          "xmlhttprequest",
                          "ping",
                          "csp_report",
                          "media",
                          "websocket",
                          "image",
                          "webtransport",
                          "webbundle",
                          "other"
                      ]
                  }
              })
          }
        });
        }else{console.log("dNr Error: Ruleset Limit overflow");}
        if(finalRegexArr.length>0){
          finalRegexArr.forEach((registerRule, index) => {
              let id = index + 1;
              chrome.declarativeNetRequest.updateDynamicRules({
                addRules: [
                  registerRule
                ],
                removeRuleIds: [id],
              });
            });
        }
      }).catch((error) => {
        console.log(error)
      });
  }catch(err){
    console.log("Error");
  }finally{
    fetch(urlHausBackup).then(function(response){
    if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' +
            response.status);
      }
      else{
        return response.text()
      }}).then(function(text){
        const urlData = text.split("\n");
        console.log(urlData);
        var id = 1
        var finalRegexArr = []
        urlData.forEach((item) => {
          if(!item.includes("! ") && item.length!=0){
            if(item.includes("$all")){
              item=item.replace('$all','');
              console.log(item);
            }
              finalRegexArr.push({
                  "id": id++,
                  "priority": 1,
                  "action": {
                      "type": "block"
                  },
                  "condition": {
                      "urlFilter": item,
                      "resourceTypes": [
                          "main_frame",
                          "sub_frame",
                          "script",
                          "xmlhttprequest",
                          "ping",
                          "csp_report",
                          "media",
                          "websocket",
                          "image",
                          "webtransport",
                          "webbundle",
                          "other"
                      ]
                  }
              })
          }
        });
        finalRegexArr.forEach((registerRule, index) => {
            let id = index + 1;
            chrome.declarativeNetRequest.updateDynamicRules({
              addRules: [
                registerRule
              ],
              removeRuleIds: [id],
            });
          });
      }).catch((error) => {
        console.log(error)
      });
  }
}

try{
chrome.storage.local.get(['run_day'], function(result) {
    let checkerDate = new Date().toLocaleDateString();    
    if(result.run_day===undefined){
      try{
        performUpdate();
      }catch(err){console.log("Error while fetching urlHaus data:E01!");}
      saveUpdateTime();
      console.log("First Update Performed!");
    }
    else if(result.run_day!==checkerDate){
      try{
        performUpdate();
      }catch(err){console.log("Error while fetching urlHaus data: E02!");}
      saveUpdateTime();
      console.log("Updated Successfully!");

    }
  });
}catch(err){
  console.log(err);
}

